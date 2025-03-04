const constant = require('../util/Constants');
const queryBuilder = require('../util/QueryBuilder');
const dependentsEligibilityRules = require('../rules/DependentsEligibilityRules');
const amountCalculator = require('../handlers/AmountCalculatorHandler');
const payComponentRules = require('../rules/PayComponentRules');
const sf_ec_integration = require('../integration/SF_EC_Integration');
const httpClient = require('../integration/HttpClient');

class DependentsHandler {
    constructor(service, st_picklist, bottleneck, executionLogHandler) {
        this.service = service;
        this.queryBuilder = new queryBuilder();

        this.dependentsEligibilityRules = new dependentsEligibilityRules(service, st_picklist, bottleneck);
        this.amountCalculator = new amountCalculator();
        this.payComponentRules = new payComponentRules();
        this.executionLogHandler = executionLogHandler;
        this.sf_ec_integration = new sf_ec_integration();

        this.httpClient = new httpClient();

        this.limiter = bottleneck;
    }

    processEmployeeDependentsAllowance = async (aEligibleEmployeeList, sReferenceDate, sExecutionID, bSimulationMode) => {
        let aPromise = [];
        this.aErrorMessages = [];

        aEligibleEmployeeList.forEach((employee) => {
            aPromise.push(new Promise(async resolve => {
                await this.getDependentsList(employee, sReferenceDate).then(async aDependents => {
                    if (aDependents && aDependents.length) {
                        let aEligibleDependents = await this.dependentsEligibilityRules.checkDependentsEligibility(employee, sReferenceDate, aDependents);
                        if (aEligibleDependents && aEligibleDependents.length) {
                            const iAmount = await this.amountCalculator.calculateAmount(aEligibleDependents, sReferenceDate);
                            const aPayComponents = await this.payComponentRules._getEmployeePayComponents(employee, sReferenceDate, false);
                            const oResult = await this.sf_ec_integration.runSfEcUpdate(employee, iAmount, sReferenceDate, aPayComponents, bSimulationMode);

                            await this.executionLogHandler.createExecutionLogSingleEntry(employee, sReferenceDate, sExecutionID, bSimulationMode, oResult.message ? [{ message: oResult.message }] : null, true, iAmount, oResult.bToUpdate, oResult.sDetails);

                            resolve({
                                aEligibleDependents: aEligibleDependents,
                                iAmount: iAmount,
                                bValidPayComponent: oResult.bValid
                            })
                        } else {
                            if (bSimulationMode) {
                                await this.executionLogHandler.createExecutionLogSingleEntry(employee, sReferenceDate, sExecutionID, bSimulationMode, [{ message: `No Dependents are eligible for Employee ${employee.userId}, date ${sReferenceDate}` }], true);
                            } else {
                                const oResult = await this.payComponentRules.checkEmployeePayComponents(employee, sReferenceDate);
                                await this.executionLogHandler.createExecutionLogSingleEntry(employee, sReferenceDate, sExecutionID, bSimulationMode, [...[{ message: `No Dependents are eligible for Employee ${employee.userId}, date ${sReferenceDate}` }], ...oResult.message ? [{ message: oResult.message }] : []], true, null, oResult.bToUpdate, oResult.sDetails);
                            }
                            resolve({ aEligibleDependents: null })
                        }
                    } else {
                        await this.executionLogHandler.createExecutionLogSingleEntry(employee, sReferenceDate, sExecutionID, bSimulationMode, this.aErrorMessages.filter(msg => msg.userId == employee.userId), true);
                        resolve({ aEligibleDependents: null })
                    }
                });
            }));
        });

        return await Promise.all(aPromise).then(aResults => { return aResults.filter(res => !!res.aEligibleDependents) });
    }

    getDependentsList = (oEmployee, sReferenceDate) => {
        return new Promise(async resolve => {
            const sQuery = this.queryBuilder.buildEmployeeDependentsQuery(oEmployee.userId);
            const oDependent = await this.httpClient.getCustDependent(sQuery, sReferenceDate, "cust_DependentsDetails");
            if (oDependent && oDependent.length > 0) {
                if (oDependent[0].cust_DependentsDetails.results.length > 0) {
                    resolve(oDependent[0].cust_DependentsDetails.results.filter(dependent => { return dependent.cust_FamilyMember == constant.MDF_VALUES.FAMILIY_KEY.CHILDREN }));
                } else {
                    this.aErrorMessages.push({ userId: oDependent[0].externalCode, message: `No Dependent Details found for Employee Dependent ${oDependent[0].externalCode}, date ${oDependent[0].effectiveStartDate}` });
                    resolve(null);
                }
            } else {
                this.aErrorMessages.push({ userId: oEmployee.userId, message: `No Dependent found for Employee ${oEmployee.userId}, date ${sReferenceDate}` });
                resolve(null);
            }
        });
    }
}

module.exports = DependentsHandler;