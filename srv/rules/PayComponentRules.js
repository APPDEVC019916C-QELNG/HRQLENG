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


    checkEmployeePayComponents = async (userId, sReferenceDate, payCompCode, simulationMode) => {
        const aPayComponents = await this.getEmployeePayComponents(userId, sReferenceDate, payCompCode);
        
        if (aPayComponents && aPayComponents.length) {
            if (!simulationMode) {
                // Execute upsert for each pay component in parallel
                await Promise.all(aPayComponents.map(async (payComponent) => {
                    const sObject = this._buildRecurringPayComponentDelete(payComponent, userId, sReferenceDate);
                    await this.httpClient.upsertEmpPayCompNonRecurring(sObject);
                    console.log("deleted one component");
                }));
            }
            //miguel log error
            return { bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_7_3 }; 
        } 
    
        return { bToUpdate: false, sDetails: constant.DETAILS.SCENARIO_7_2 };
    };

    getEmployeePayComponents = (userId, sReferenceDate, payCompCode) => {
        return new Promise(async resolve => {
            const sQuery = this.queryBuilder.buildEmployeeRecurringPayCompQuery(userId, sReferenceDate, payCompCode );
            resolve(await this.httpClient.getEmpPayCompNonRecurring(sQuery));
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

    //MIGUEL Move to querybuilder
    _buildRecurringPayComponentDelete = (payComponent, userId, referenceDate) => {
        return {
            userId: userId,
            payComponentCode: payComponent.payComponentCode,
            sequenceNumber: payComponent.sequenceNumber,
            payDate : this.convertToSapDateFormat(referenceDate),
            operation: constant.MDF_VALUES.OPERATION.DELETE
        };

    }

     convertToSapDateFormat = (dateString) => {
        const date = new Date(dateString + "T00:00:00Z"); 
        const ticks = date.getTime();
        return `/Date(${ticks})/`;
    }

    _buildRecurringPayComponent =  (payComponent, userId, referenceDate) => {
        return {
            userId: userId,
            payComponentCode: payComponent,
            payDate :`${referenceDate}T00:00:00Z`,
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