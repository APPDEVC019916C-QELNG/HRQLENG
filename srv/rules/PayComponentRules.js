const constant = require('../util/Constants');
const queryBuilder = require('../util/QueryBuilder');
const httpClient = require('../integration/HttpClient');
const formatter = require('../util/Formatter');


class PayComponentRules {
    constructor() {
        this.queryBuilder = new queryBuilder();
        this.httpClient = new httpClient();

        this.formatter = new formatter();
    }

    checkEmployeePayComponents = async (oEmployee, sReferenceDate) => {
        const aPayComponents = await this._getEmployeePayComponents(oEmployee, sReferenceDate, false);
        if (aPayComponents && aPayComponents.length) {
            const bValidRefDate = this._validateRefDate(aPayComponents, sReferenceDate);
            if (bValidRefDate) {
                // Scenario 1 – All the records have a start date >= “Reference Date”
                const aResults = await this._deleteRecurringPayComponentList(oEmployee, aPayComponents);
                if (aResults.d && aResults.d.length > 0) {
                    return { bToUpdate: true, sDetails: constant.DETAILS.DELETION, message: aResults.d.filter(res => res.httpCode != 200).map(res => res.message).join(" | ") };
                } else {
                    return { bToUpdate: true, sDetails: constant.DETAILS.ERROR };
                }
            } else {
                // Scenario 2 – A record has a start date < “Reference Date”
                const oEmpCompObj = await this._getActiveEmpCompensation(oEmployee, sReferenceDate);
                const oPortletRes = await this._createCompensationPortlet(oEmpCompObj, sReferenceDate);

                if (oPortletRes.d && oPortletRes.d[0].httpCode == 200) {
                    const aNewPayComponents = await this._getEmployeePayComponents(oEmployee, sReferenceDate, false);
                    const aResults = await this._deleteRecurringPayComponentList(oEmployee, aNewPayComponents);
                    if (aResults.d && aResults.d.length > 0) {
                        return { bToUpdate: true, sDetails: constant.DETAILS.DELETION, message: aResults.d.filter(res => res.httpCode != 200).map(res => res.message).join(" | ") };
                    } else {
                        return { bToUpdate: true, sDetails: constant.DETAILS.ERROR };
                    }

                } else {
                    return { bToUpdate: true, sDetails: constant.DETAILS.ERROR, message: oPortletRes.d ? oPortletRes.d[0].mesage : null };
                }
            }
        } else {
            return { bToUpdate: false} ;
        }

    }

    _getEmployeePayComponents = (oEmployee, sReferenceDate, bToDate, payCompCode) => {
        return new Promise(async resolve => {
            const sQuery = this.queryBuilder.buildEmployeeRecurringPayCompQuery(oEmployee.userId, payCompCode );
            resolve(await this.httpClient.getEmpPayCompNonRecurring(sQuery, sReferenceDate, bToDate));
        });
    }

    _validateRefDate = (aPayComponents, sReferenceDate) => {
        return aPayComponents.every(oComp => {
            let start = new Date(oComp.startDate);
            if (isNaN(start.getTime())) start = new Date(this.formatter.formatDate(oComp.startDate));
            return start >= new Date(sReferenceDate);
        });
    }

    _deleteRecurringPayComponentList = async (oEmployee, aPayComponents) => {
        let aPromise = [];

        aPayComponents.forEach(component => {
            aPromise.push(new Promise(async resolve => {
                resolve(this._buildRecurringPayComponent(component, oEmployee));
            }))
        })

        return await Promise.all(aPromise).then(async aResults => { return await this.httpClient.upsertEmpPayCompRecurring(aResults) });
    }

    _buildRecurringPayComponent = async (oComponent, oEmployee) => {
        return {
            userId: oEmployee.userId,
            payComponent: constant.MDF_VALUES.PAY_COMPONENT.toString(),
            startDate : oComponent.startDate,
            operation: constant.MDF_VALUES.OPERATION.DELIMIT
        };
    }

    _getActiveEmpCompensation = (oEmployee, sReferenceDate) => {
        return new Promise(async resolve => {
            const sQuery = this.queryBuilder.buildEmpCompensationQuery(oEmployee.userId);
            const aEmpComp = await this.httpClient.getEmpCompensation(sQuery, sReferenceDate, true, true);
            if(aEmpComp && aEmpComp.length > 0) {
                resolve(aEmpComp[0]);
            } else {
                console.log(`No EmpCompensation found for user ${oEmployee.userId} ,date ${sReferenceDate}`);
                resolve(null);
            }
        })
    }

    _createCompensationPortlet = async (oEmpCompObj, sReferenceDate) => {
        let oNewEmpCompObj = {
            userId: oEmpCompObj.userId,
            payGroup: oEmpCompObj.payGroup,
            eventReason: constant.EMP_COMPENSATION.EVENT_REASON,
            startDate: `/Date(${new Date(sReferenceDate).getTime()})/`
        }

        return await this.httpClient.upsertEmpCompensation(oNewEmpCompObj);
    }


}

module.exports = PayComponentRules;