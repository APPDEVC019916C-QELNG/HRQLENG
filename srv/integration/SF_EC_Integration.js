const constant = require('../util/Constants');
const queryBuilder = require('../util/QueryBuilder');
const httpClient = require('../integration/HttpClient');
const formatter = require('../util/Formatter');

class SF_EC_Integration {
    constructor() {
        this.queryBuilder = new queryBuilder();
        this.httpClient = new httpClient();
        this.formatter = new formatter();
    }

    runSfEcUpdate = async (oEmployee, iAmount, sReferenceDate, aRecurringPayComponents, bSimulationMode, sPayComponent) => {
        if (aRecurringPayComponents && aRecurringPayComponents.length) {
            const bValidAmountInAllRecords = this._validateAmount(aRecurringPayComponents, iAmount);
            if (!bValidAmountInAllRecords) {
                // Scenario 1 - Calculated Amount equal to all Employee Pay Components
                return this._runScenario1();

            } else {

                return await this._runScenario2and3(bSimulationMode, oEmployee.empJob, iAmount, sReferenceDate, sPayComponent);

            }
        } else {
            // Scenario 3: No Pay Components found for Employee
            return await this._runScenario2and3(bSimulationMode, oEmployee.empJob, iAmount, sReferenceDate, sPayComponent);
        }
    }

    _runScenario1 = () => {
        return {
            bToUpdate: false,
            sDetails: constant.DETAILS.SCENARIO_1
        }
    }

    _runScenario2 = (bSimulationMode, oEmployee, iAmount, sReferenceDate) => {
        return new Promise(async resolve => {
            if (bSimulationMode) {
                resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_2_SIMULATION });
            } else {
                const oEmpCompObj = await this._getActiveEmpCompensation(oEmployee, sReferenceDate);
                const bValidReferenceDate = this._validateRefDateEqual([oEmpCompObj], sReferenceDate);
                if (bValidReferenceDate) {
                    const oPayCompRes = await this._createRecurringPayComponent(oEmpCompObj, iAmount, sReferenceDate);
                    if (oPayCompRes.d && oPayCompRes.d[0].httpCode == 200) {
                        resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_2 });
                    } else {
                        resolve({ bToUpdate: true, sDetails: constant.DETAILS.ERROR, message: oPayCompRes.d ? oPayCompRes.d[0].mesage : null });
                    }
                } else {
                    const oPortletRes = await this._createCompensationPortlet(oEmpCompObj, sReferenceDate);
                    if (oPortletRes.d && oPortletRes.d[0].httpCode == 200) {
                        const oPayCompRes = await this._createRecurringPayComponent(oEmpCompObj, iAmount, sReferenceDate);
                        if (oPayCompRes.d && oPayCompRes.d[0].httpCode == 200) {
                            resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_2 });
                        } else {
                            resolve({ bToUpdate: true, sDetails: constant.DETAILS.ERROR, message: oPayCompRes.d ? oPayCompRes.d[0].mesage : null });
                        }
                    } else {
                        resolve({ bToUpdate: true, sDetails: constant.DETAILS.ERROR, message: oPortletRes.d ? oPortletRes.d[0].mesage : null });
                    }
                }
            }
        });
    }

    _runScenario2and3 = (bSimulationMode, oEmployee, iAmount, sReferenceDate, sPayComponent) => {
        return new Promise(async resolve => {
            if (bSimulationMode) {
                resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_2_SIMULATION });
            } else {

                const oPayCompRes = await this._createRecurringPayComponent(oEmployee, iAmount, sReferenceDate, sPayComponent);
                if (oPayCompRes.d && oPayCompRes.d[0].httpCode == 200) {
                    resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_2 }); //MIGUEL
                } else {
                    resolve({ bToUpdate: true, sDetails: constant.DETAILS.ERROR, message: oPayCompRes.d ? oPayCompRes.d[0].mesage : null });
                }

            }
        });
    }




    _runScenario4 = (bSimulationMode, oEmployee, aEmpCompObj, iAmount, sReferenceDate) => {
        return new Promise(async resolve => {
            if (bSimulationMode) {
                resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_4 });
            } else {
                const oReferenceEmpCompObj = this._getEmpCompWithRefDate(aEmpCompObj, sReferenceDate);
                const oEmpCompObjRes = await this._createCompensationPortlet(oReferenceEmpCompObj, sReferenceDate);
                if (oEmpCompObjRes.d && oEmpCompObjRes.d[0].httpCode == 200) {
                    const aComponentsToUpdate = await this._getAllEmpCompensation(oEmployee, sReferenceDate);
                    const aPayCompRes = await this._createRecurringPayComponentList(aComponentsToUpdate, iAmount);
                    if (aPayCompRes.d && aPayCompRes.d.length > 0) {
                        resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_4, message: aPayCompRes.d.filter(res => res.httpCode != 200).map(res => res.message).join(" | ") });
                    } else {
                        resolve({ bToUpdate: true, sDetails: constant.DETAILS.ERROR });
                    }
                } else {
                    resolve({ bToUpdate: true, sDetails: constant.DETAILS.ERROR, message: oEmpCompObjRes.d ? oEmpCompObjRes.d[0].mesage : null });
                }
            }
        });
    }

    _validateAmount = (aRecurringPayComponents, iAmount, iUnits, iValue) => {
        return aRecurringPayComponents.some(oComp =>
            oComp.paycompvalue !== iAmount ||
            oComp.numberOfUnits !== iUnits ||
            oComp.value !== iValue
        );
    }


    _validateRefDateBetween = (aRecurringPayComponents, sReferenceDate) => {
        const refDate = new Date(sReferenceDate);

        return aRecurringPayComponents.some(({ startDate, endDate }) => {
            let start = new Date(startDate);
            if (isNaN(start.getTime())) start = new Date(this.formatter.formatDate(startDate));
            let end = new Date(endDate);
            if (isNaN(end.getTime())) end = new Date(this.formatter.formatDate(endDate));
            return refDate >= start && refDate <= end;
        });
    }

    _validateRefDateEqual = (aComponents, sReferenceDate) => {
        const refDate = new Date(sReferenceDate);

        return aComponents.some(oComp => {
            let start = new Date(oComp.startDate);
            if (isNaN(start.getTime())) start = new Date(this.formatter.formatDate(oComp.startDate));
            return start.getTime() == refDate.getTime()
        });
    }

    _validateRefDateAndAmount = (aComponents, sReferenceDate, iAmount) => {
        const refDate = new Date(sReferenceDate);

        return aComponents.some(oComp => {
            let start = new Date(oComp.startDate);
            if (isNaN(start.getTime())) start = new Date(this.formatter.formatDate(oComp.startDate));
            let end = new Date(oComp.endDate);
            if (isNaN(end.getTime())) end = new Date(this.formatter.formatDate(oComp.endDate));
            return start.getTime() == refDate.getTime() || refDate >= start && refDate <= end && oComp.paycompvalue == iAmount;
        });
    }

    _getRecurringPayComponentsToUpdate = (aRecurringPayComponents, iAmount, sReferenceDate) => {
        return sReferenceDate ? aRecurringPayComponents.filter(oComp => {
            let start = new Date(oComp.startDate);
            if (isNaN(start.getTime())) start = new Date(this.formatter.formatDate(oComp.startDate));
            return oComp.paycompvalue != iAmount && start >= new Date(sReferenceDate);
        }) : aRecurringPayComponents.filter(oComp => oComp.paycompvalue != iAmount);
    }

    _getEmpCompWithRefDate = (aComponents, sReferenceDate) => {
        const refDate = new Date(sReferenceDate);

        return aComponents.filter(({ startDate, endDate }) => {
            let start = new Date(startDate);
            if (isNaN(start.getTime())) start = new Date(this.formatter.formatDate(startDate));
            let end = new Date(endDate);
            if (isNaN(end.getTime())) end = new Date(this.formatter.formatDate(endDate));
            return refDate >= start && refDate <= end;
        })[0];
    }

    _getActiveEmpCompensation = (oEmployee, sReferenceDate) => {
        return new Promise(async resolve => {
            const sQuery = this.queryBuilder.buildEmpCompensationQuery(oEmployee.userId);
            const aEmpComp = await this.httpClient.getEmpCompensation(sQuery, sReferenceDate, true, true);
            if (aEmpComp && aEmpComp.length > 0) {
                resolve(aEmpComp[0]);
            } else {
                console.log(`No EmpCompensation found for user ${oEmployee.userId} ,date ${sReferenceDate}`);
                resolve(null);
            }
        })
    }

    _getAllEmpCompensation = (oEmployee, sReferenceDate) => {
        return new Promise(async resolve => {
            const sQuery = this.queryBuilder.buildEmpCompensationQuery(oEmployee.userId);
            const aEmpComp = await this.httpClient.getEmpCompensation(sQuery, sReferenceDate, true, false);
            if (aEmpComp && aEmpComp.length > 0) {
                resolve(aEmpComp);
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

    _createRecurringPayComponent = async (oEmpCompObj, iAmount, sReferenceDate, component) => {
        return await this.httpClient.upsertEmpPayCompNonRecurring(this._buildRecurringComponent(oEmpCompObj, iAmount, false, sReferenceDate, constant.MDF_VALUES.CURRENCY_CODE, component));
    }

    _updateRecurringPayComponents = async (aComponentsToUpdate, iAmount) => {
        let aPromise = [];

        aComponentsToUpdate.forEach(component => {
            aPromise.push(new Promise(async resolve => {
                resolve(this._buildRecurringComponent(component, iAmount, true));
            }))
        })

        return await Promise.all(aPromise).then(async aResults => { return await this.httpClient.upsertEmpPayCompRecurring(aResults) });
    }

    _createRecurringPayComponentList = async (aComponentsToUpdate, iAmount) => {
        let aPromise = [];

        aComponentsToUpdate.forEach(component => {
            aPromise.push(new Promise(async resolve => {
                resolve(this._buildRecurringComponent(component, iAmount, false, null, constant.MDF_VALUES.CURRENCY_CODE, constant.MDF_VALUES.PAY_COMPONENT));
            }))
        })

        return await Promise.all(aPromise).then(async aResults => { return await this.httpClient.upsertEmpPayCompRecurring(aResults) });
    }

    _buildRecurringComponent = (oComponent, iAmount, bSequence, sReferenceDate, sCurrencyCode, sPayComponent) => {
        let oReturnComponent = {};

        oReturnComponent["userId"] = oComponent.userId;
        oReturnComponent["payComponentCode"] = sPayComponent ? sPayComponent.toString() : oComponent.payComponent;
        oReturnComponent["value"] = iAmount;
        // oReturnComponent["customString1 "] = "HMC Pmts 2025" //“HMC Pmts –YEAR” (YEAR should be the “Reference Year”);
        oReturnComponent["numberOfUnits"] = "2"; //need to calculate this, forgot
        // oReturnComponent["unitOfMeasure "] = "Persons";
        oReturnComponent["payDate"] = `/Date(${new Date("2025-01-01").getTime()})/` //1st January of the “Reference Year”
        oReturnComponent["currencyCode"] = sCurrencyCode ? sCurrencyCode : oComponent.currencyCode;
        oReturnComponent["sequenceNumber"] = this._newTimeStamp() //Timestamp of execution (dd_mm_yyyy_hh_mm_ss)

        return oReturnComponent;
    }

    _newTimeStamp = () => {
        let datenow = new Date();

        return datenow.toISOString().replace("T", " ").substring(0, 19);
    }
}

module.exports = SF_EC_Integration;