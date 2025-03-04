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

    runSfEcUpdate = async (oEmployee, iAmount, sReferenceDate, aRecurringPayComponents, bSimulationMode) => {
        if (aRecurringPayComponents && aRecurringPayComponents.length) {
            const bValidAmountInAllRecords = this._validateAmount(aRecurringPayComponents, iAmount);
            if (!bValidAmountInAllRecords) {
                const bValidRefDateInBetweenDates = this._validateRefDateBetween(aRecurringPayComponents, sReferenceDate);
                if (bValidRefDateInBetweenDates) {
                    // Scenario 1 - Calculated Amount equal to all Employee Pay Components and Reference Date is valid on one of them
                    return this._runScenario1();
                } else {
                    // Scenario 2 - Employee Pay Components value with same calculated Amount but Reference Date is NOT valid and needs to created
                    return await this._runScenario2(bSimulationMode, oEmployee, iAmount, sReferenceDate);
                }
            } else {
                // Scenario 3 - Calculated Amount Incorrect in at least one Employee Pay Component
                const bValidReferenceDate = this._validateRefDateAndAmount(aRecurringPayComponents, sReferenceDate, iAmount);
                if (bValidReferenceDate) {
                    // Scenario 3.1 - Employee has Pay Component with startDate equal to Reference Date
                    return await this._runScenario3_1(bSimulationMode, aRecurringPayComponents, iAmount);
                } else {
                    // Scenario 3.2 - Employee has no Pay Component with startDate equal to Reference Date
                    return await this._runScenario3_2(bSimulationMode, oEmployee, aRecurringPayComponents, iAmount, sReferenceDate);
                }
            }
        } else {
            // Scenario 4: No Pay Components found for Employee
            const aEmpCompObj = await this._getAllEmpCompensation(oEmployee, sReferenceDate);
            const bValidReferenceDate = this._validateRefDateEqual(aEmpCompObj, sReferenceDate);
            if (bValidReferenceDate) {
                // Scenario 4.1 - Create EmpPayCompRecurring for each EmpCompensation Record
                return await this._runScenario4_1(bSimulationMode, aEmpCompObj, iAmount);
            } else {
                // Scenario 4.2 - Create EmpCompensation Record on Reference Date and Create EmpPayCompRecurring for each (future)
                return await this._runScenario4_2(bSimulationMode, oEmployee, aEmpCompObj, iAmount, sReferenceDate);
            }
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

    _runScenario3_1 = (bSimulationMode, aRecurringPayComponents, iAmount) => {
        return new Promise(async resolve => {
            if (bSimulationMode) {
                resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_3_1_SIMULATION });
            } else {
                const aCompToUpdate = this._getRecurringPayComponentsToUpdate(aRecurringPayComponents, iAmount);
                const aPayCompRes = await this._updateRecurringPayComponents(aCompToUpdate, iAmount);
                if (aPayCompRes.d && aPayCompRes.d.length > 0) {
                    resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_3_1, message: aPayCompRes.d.filter(res => res.httpCode != 200).map(res => res.message).join(" | ") });
                } else {
                    resolve({ bToUpdate: true, sDetails: constant.DETAILS.ERROR });
                }
            }
        });
    }

    _runScenario3_2 = (bSimulationMode, oEmployee, aRecurringPayComponents, iAmount, sReferenceDate) => {
        return new Promise(async resolve => {
            if (bSimulationMode) {
                resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_3_2_SIMULATION });
            } else {
                const oEmpCompObj = await this._getActiveEmpCompensation(oEmployee, sReferenceDate);
                const oPortletRes = await this._createCompensationPortlet(oEmpCompObj, sReferenceDate);
                if (oPortletRes.d && oPortletRes.d[0].httpCode == 200) {
                    const oPayCompCreateRes = await this._createRecurringPayComponent(oEmpCompObj, iAmount, sReferenceDate);
                    if (oPayCompCreateRes.d && oPayCompCreateRes.d[0].httpCode != 200) {
                        resolve({ bToUpdate: true, sDetails: constant.DETAILS.ERROR, mesage: oPortletRes.d ? oPayCompCreateRes.d[0].message : null });
                    }
                    const aCompToUpdate = this._getRecurringPayComponentsToUpdate(aRecurringPayComponents, iAmount, sReferenceDate);
                    const aPayCompUpdateRes = await this._updateRecurringPayComponents(aCompToUpdate, iAmount);
                    if (aPayCompUpdateRes.d && aPayCompUpdateRes.d.length > 0) {
                        resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_3_2, message: aPayCompUpdateRes.d.filter(res => res.httpCode != 200).map(res => res.message).join(" | ") });
                    } else {
                        resolve({ bToUpdate: true, sDetails: constant.DETAILS.ERROR });
                    }
                } else {
                    resolve({ bToUpdate: true, sDetails: constant.DETAILS.ERROR, mesage: oPortletRes.d ? oPortletRes.d[0].message : null });
                }
            }
        });
    }

    _runScenario4_1 = (bSimulationMode, aEmpCompObj, iAmount) => {
        return new Promise(async resolve => {
            if (bSimulationMode) {
                resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_4_1_SIMULATION });
            } else {
                const aPayCompRes = await this._createRecurringPayComponentList(aEmpCompObj, iAmount);
                if (aPayCompRes.d && aPayCompRes.d.length > 0) {
                    resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_4_1, message: aPayCompRes.d.filter(res => res.httpCode != 200).map(res => res.message).join(" | ") });
                } else {
                    resolve({ bToUpdate: true, sDetails: constant.DETAILS.ERROR });
                }
            }
        });
    }

    _runScenario4_2 = (bSimulationMode, oEmployee, aEmpCompObj, iAmount, sReferenceDate) => {
        return new Promise(async resolve => {
            if (bSimulationMode) {
                resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_4_2_SIMULATION });
            } else {
                const oReferenceEmpCompObj = this._getEmpCompWithRefDate(aEmpCompObj, sReferenceDate);
                const oEmpCompObjRes = await this._createCompensationPortlet(oReferenceEmpCompObj, sReferenceDate);
                if (oEmpCompObjRes.d && oEmpCompObjRes.d[0].httpCode == 200) {
                    const aComponentsToUpdate = await this._getAllEmpCompensation(oEmployee, sReferenceDate);
                    const aPayCompRes = await this._createRecurringPayComponentList(aComponentsToUpdate, iAmount);
                    if (aPayCompRes.d && aPayCompRes.d.length > 0) {
                        resolve({ bToUpdate: true, sDetails: constant.DETAILS.SCENARIO_4_2, message: aPayCompRes.d.filter(res => res.httpCode != 200).map(res => res.message).join(" | ") });
                    } else {
                        resolve({ bToUpdate: true, sDetails: constant.DETAILS.ERROR });
                    }
                } else {
                    resolve({ bToUpdate: true, sDetails: constant.DETAILS.ERROR, message: oEmpCompObjRes.d ? oEmpCompObjRes.d[0].mesage : null });
                }
            }
        });
    }

    _validateAmount = (aRecurringPayComponents, iAmount) => {
        return aRecurringPayComponents.some(oComp => oComp.paycompvalue != iAmount);
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

    _createRecurringPayComponent = async (oEmpCompObj, iAmount, sReferenceDate) => {
        return await this.httpClient.upsertEmpPayCompRecurring(this._buildRecurringComponent(oEmpCompObj, iAmount, false, sReferenceDate, constant.MDF_VALUES.CURRENCY_CODE, constant.MDF_VALUES.PAY_COMPONENT));
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
        oReturnComponent["payComponent"] = sPayComponent ? sPayComponent.toString() : oComponent.payComponent;
        oReturnComponent["paycompvalue"] = iAmount;
        oReturnComponent["startDate"] = (sReferenceDate && sReferenceDate != '') ? `/Date(${new Date(sReferenceDate).getTime()})/` : oComponent.startDate;
        oReturnComponent["endDate"] = oComponent.endDate;
        oReturnComponent["currencyCode"] = sCurrencyCode ? sCurrencyCode : oComponent.currencyCode;
        if (bSequence) oReturnComponent["seqNumber"] = oComponent.seqNumber;

        return oReturnComponent;
    }
}

module.exports = SF_EC_Integration;