const cruder = require('../util/Cruder');
const constant = require('../util/Constants');
const queryBuilder = require('../util/QueryBuilder');
const validator = require('../util/Validator');
const payComponentRules = require('../rules/PayComponentRules');
const httpClient = require('../integration/HttpClient');

class EligibilityRules {

    constructor(service, st_picklist, bottleneck, executionLogHandler) {
        this.service = service;
        this.cruder = new cruder(service);
        this.queryBuilder = new queryBuilder();
        this.validator = new validator();
        this.executionLogHandler = executionLogHandler;
        this.httpClient = new httpClient();

        this.st_picklist_conn = st_picklist;
        this.payComponentRules = new payComponentRules();

        this.limiter = bottleneck;
    }

    getEligibleEmployeeList = async (aFilteredEmployeeList, sReferenceDate, sExecutionID, sPayCompCode, bSimulationMode) => {
        let aPromise = [];
        this.aErrorMessages = [];

        const aCdsRules = await this.cruder.read(constant.CDS_NAME.EMPLOYEE_ELIGIBILITY_RULE, [['target', '=',constant.CDS_PROPERTY.EMPLOYEE], ['payComponent', '=', sPayCompCode]], 'AND' );


        aFilteredEmployeeList.forEach((employee) => {
            aPromise.push(new Promise(async resolve => {
                await this.isEligible(employee, sReferenceDate, aCdsRules).then(async bIsEligible => {
                    if (bIsEligible) {
                        resolve(employee);
                    } else {

                        console.log("checking if component exits then delete");
                        const oResult = await this.payComponentRules.checkEmployeePayComponents(employee.userId, sReferenceDate, sPayCompCode, bSimulationMode, bIsEligible);
                        await this.executionLogHandler.createExecutionLogSingleEntry(employee, sReferenceDate, sExecutionID, bSimulationMode, oResult.message , false,null, 0, 0, oResult.sDetails, sPayCompCode); //MIGUEL
                        
                        resolve(null);
                    }
                })
            }))
        });

        return await Promise.all(aPromise).then(aResults => { return aResults.filter(res => !!res) });
    }

    isEligible = async (oEmployee, sReferenceDate, aRules) => {
        const aQueries = await Promise.all(
            aRules.map(async rule => await this._getQuery(rule))
        );

        const aPromise = aQueries.map(oQueryObj =>
            this.limiter.schedule(async () => {
                const oEligbRule = await this.httpClient.getCustEligibility(oQueryObj.sQuery, sReferenceDate, oEmployee.userId);

                if (oEligbRule && oEligbRule.length > 0) {
                    if (oQueryObj.oRule.withPickList) {
                        return await this._withPickList(oEmployee, oQueryObj.oRule, sReferenceDate, oEligbRule[0]).then(bValid => { return bValid; });
                    } else {
                        return await this._withNoPickList(oEmployee, oQueryObj.oRule, sReferenceDate, oEligbRule[0]).then(bValid => { return bValid; });
                    }
                } else {
                    this.aErrorMessages.push({ userId: oEmployee.userId, message: `No Cust Health Card eligibility found for userId ${oEmployee.userId}, date ${sReferenceDate}, field ${oQueryObj.oRule.ecField}, custElig ${oQueryObj.oRule.custEligibility}` });
                    return false;
                }
            })
        );

        return await Promise.allSettled(aPromise).then(aResults => { return aResults.every(oRes => oRes.status === "fulfilled" && oRes.value === true); });
    };

    _getQuery = (oRule) => {
        return new Promise(async resolve => {
            resolve({
                sQuery: this.queryBuilder.buildEligibilityQuery(oRule.ecField, oRule.custEligibility, constant.MDF_VALUES.SYSTEM_RECORD_STATUS, oRule.custNat),
                oRule: oRule
            });
        })
    };

    _withPickList = (oEmployee, oRule, sReferenceDate, oEligbRule) => {
        return new Promise(async resolve => {
            await this.st_picklist_conn.run(SELECT.one.from(constant.CDS_NAME.PICK_LIST_OPTION).where({ "id": oEmployee[oRule.targetEntityProp] })).then(oPickRes => {
                if (oPickRes) {
                    let bValid = this.validator.validateWithOperator(oEligbRule.cust_Operator, oEligbRule.cust_Values, oPickRes.externalCode, oRule.isDate, sReferenceDate);
                    if (!bValid) {
                        this.aErrorMessages.push({ userId: oEmployee.userId, message: `Health cards Eligibility not valid for userId ${oEmployee.userId}, date ${sReferenceDate}, field ${oRule.ecField}, with value ${oPickRes.externalCode}, operator ${oEligbRule.cust_Operator}, cust values ${oEligbRule.cust_Values}` });
                    }
                    resolve(bValid);
                } else {
                    this.aErrorMessages.push({ userId: oEmployee.userId, message: `No Health cards Eligibility picklistOption found for userId ${oEmployee.userId}, date ${sReferenceDate}, field ${oRule.ecField}, custElig ${oRule.custEligibility}, picklistopt  ${oEmployee[oRule.targetEntityProp]}` });
                    resolve(false);
                }
            });
        });
    };

    _withNoPickList = (oEmployee, oRule, sReferenceDate, oEligbRule) => {
        return new Promise(resolve => {
            let bValid = this.validator.validateWithOperator(oEligbRule.cust_Operator, oEligbRule.cust_Values, oEmployee[oRule.targetEntityProp], oRule.isDate, sReferenceDate);
            if (!bValid) {
                this.aErrorMessages.push({ userId: oEmployee.userId, message: `Health cards not valid for userId ${oEmployee.userId}, date ${sReferenceDate}, field ${oRule.ecField}, with value ${oEmployee[oRule.targetEntityProp]}, operator ${oEligbRule.cust_Operator}, cust values ${oEligbRule.cust_Values}` });
            }
            resolve(bValid);
        })
    };






}

module.exports = EligibilityRules;