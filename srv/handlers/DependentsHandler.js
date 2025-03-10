const constant = require('../util/Constants');
const queryBuilder = require('../util/QueryBuilder');
const payComponentRules = require('../rules/PayComponentRules');
const sf_ec_integration = require('../integration/SF_EC_Integration');
const httpClient = require('../integration/HttpClient');
const childrenPayment = require('../payment/ChildrenPayment');
const spousePayment = require('../payment/SpousePayment');

const AmountCalculatorHandler = require('./AmountCalculatorHandler');


class DependentsHandler {
    constructor(service, st_picklist, bottleneck, executionLogHandler,  st_perPerson, st_healthCardRules, st_EmpEmployment) {
        this.service = service;
        this.queryBuilder = new queryBuilder();

        this.payComponentRules = new payComponentRules();
        this.executionLogHandler = executionLogHandler;
        this.sf_ec_integration = new sf_ec_integration();

        this.httpClient = new httpClient();

        this.childrenPayment = new childrenPayment(service, bottleneck);
        this.spousePayment = new spousePayment(service, bottleneck, st_perPerson, bottleneck);

    
        this.limiter = bottleneck;
        this.amountCalculatorHandler = new AmountCalculatorHandler(service, st_perPerson, st_picklist, st_healthCardRules, st_EmpEmployment);
    }

    getDependentsList = async (externalCode, sReferenceDate) => {
        const sQuery = this.queryBuilder.buildEmployeeDependentsQuery(externalCode);
        const oDependent = await this.httpClient.getCustDependent(sQuery, sReferenceDate, "cust_DependentsDetails");

        if (!oDependent || oDependent.length === 0) {
            // Log error or handle missing dependents
            console.warn(`No dependents found for Employee ${externalCode} on ${sReferenceDate}`);
            return null;
        }

        const dependentsList = oDependent[0]?.cust_DependentsDetails?.results || [];

        if (dependentsList.length === 0) {
            console.warn(`No Dependent Details found for Employee Dependent ${oDependent[0].externalCode}, date ${oDependent[0].effectiveStartDate}`);
            return null;
        }

        return dependentsList;

    };


    processChildDependent = async (employee, children, referenceDate, custNat) => {
        let totalAmount = 0;
        let count = 0; // Counter for the number of times an amount was added
    
        for (const child of children) {
            if (await this.childrenPayment.isApplicable(child, referenceDate, custNat)) {
                let amount = await this.amountCalculatorHandler.calculateEmployeeChildPayment(employee, child, referenceDate, custNat, child);
                totalAmount += parseFloat(amount) || 0; // Ensures numeric addition
                count++; // Increment counter each time an amount is added
            }
        }
        const totalAmountString = totalAmount.toString();
    
        return {totalAmountString, count}; 
    };
    
    

    processSpouseDependent = async (employee, spouses, referenceDate, custNat) => {

        let totalAmount = 0;
        let count = 0; // Counter for the number of times an amount was added
    
        for (const spouse of spouses) {
            if (await this.spousePayment.isApplicable(spouse, referenceDate, custNat)) {
                let amount = await this.amountCalculatorHandler.calculateEmployeeChildPayment(employee, spouse, referenceDate, custNat, spouse);
                totalAmount += parseFloat(amount) || 0; // Ensures numeric addition
                count++; // Increment counter each time an amount is added

            }
        }
    
        const totalAmountString = totalAmount.toString();
    
        return {totalAmountString, count }; 

    };


    
    
}

module.exports = DependentsHandler;