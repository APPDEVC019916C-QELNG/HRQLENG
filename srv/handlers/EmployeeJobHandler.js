const { t } = require('@sap/cds/lib/utils/tar');
const queryBuilder = require('../util/QueryBuilder');
const AmountCalculatorHandler = require('./AmountCalculatorHandler');
const DependentsHandler = require('./DependentsHandler');
const constant = require('../util/Constants');

class EmployeeJobHandler {

    constructor(service, st_perPerson, st_picklist, st_healthCardRules, st_EmpEmployment, bottleneck, executionLogHandler) {
        this.queryBuilder = new queryBuilder();
        this.amountCalculatorHandler = new AmountCalculatorHandler(service, st_perPerson, st_picklist, st_healthCardRules, st_EmpEmployment);
        this.dependentsHandler = new DependentsHandler(service, st_picklist, bottleneck, executionLogHandler, st_perPerson, st_healthCardRules, st_EmpEmployment);

    }

    getFilteredEmployeeListQuery = async (oPayload) => {
        const aFilters = await this.createFilterForEmployeeList(oPayload);

        return this.queryBuilder.buildEmployeeFilterQuery(aFilters);
    }

    createFilterForEmployeeList = async (oPayload) => {
        return new Promise(resolve => {
            let oFilter = [];

            if (oPayload.userIds && oPayload.userIds.length) {
                oFilter = [...oFilter, oPayload.userIds.map(item => { return { "userId": item } })];
            }

            if (oPayload.foJobs && oPayload.foJobs.length) {
                oFilter = [...oFilter, oPayload.foJobs.map(item => { return { "jobCode": item.externalCode } })];
            }

            if (oPayload.departments && oPayload.departments.length) {
                oFilter = [...oFilter, oPayload.departments.map(item => { return { "customString3": item.externalCode } })];
            }

            if (oPayload.groups && oPayload.groups.length) {
                oFilter = [...oFilter, oPayload.groups.map(item => { return { "customString2": item.externalCode } })];
            }

            if (oPayload.orgUnits && oPayload.orgUnits.length) {
                oFilter = [...oFilter, oPayload.orgUnits.map(item => { return { "department": item.externalCode } })];
            }

            if (oPayload.hrPersonnelAreas && oPayload.hrPersonnelAreas.length) {
                oFilter = [...oFilter, oPayload.hrPersonnelAreas.map(item => { return { "customString8": item.externalCode } })];
            }

            if (oPayload.custEmployeeGroups && oPayload.custEmployeeGroups.length) {
                oFilter = [...oFilter, oPayload.custEmployeeGroups.map(item => { return { "customString10": item.externalCode } })];
            }

            resolve(oFilter);
        });
    }


    processEligibleEmployees = async (eligibleEmployees, referenceDate, custNat) => {
        let eligibleDetailsList = [];

        for (const employee of eligibleEmployees) {
            const numberOfUnits = 1;
            const details = await this.processEmployee(employee, referenceDate, custNat);

            // Process dependents independently

            const dependentList = await this.dependentsHandler.getDependentsList(employee.userId, referenceDate);

            if (dependentList && dependentList.length) {

                // Separate dependents into two categories
                const children = dependentList.filter(dependent => dependent.cust_FamilyMember === constant.MDF_VALUES.FAMILIY_KEY.CHILDREN);
                const spouse = dependentList.filter(dependent => dependent.cust_FamilyMember === constant.MDF_VALUES.FAMILIY_KEY.SPOUSE);


                const childrenResult  = await this.dependentsHandler.processChildDependent(employee, children, referenceDate, custNat);
                
                const spouseResult = await this.dependentsHandler.processSpouseDependent(employee, spouse, referenceDate, custNat);

            

                details.amount = this.sumStrings(childrenResult.totalAmountString ,details.amount);

                details.count = numberOfUnits+childrenResult.count;

                //const totalDependentAmount = await this.dependentsHandler.processDependentDetails(employee, lDependentsDetails, referenceDate, custNat, details);

                //details.emplyeeAount = totalDependentAmount;

                eligibleDetailsList.push(details);

            }


        }

        return eligibleDetailsList;

    }

        //MIGUEL Move to utils
    sumStrings = (str1, str2) => {
        // Convert strings to numbers
        const num1 = parseFloat(str1);
        const num2 = parseFloat(str2);
    
        // Calculate the sum and convert it back to a string
        return (num1 + num2).toString();
    };

    processEmployee = async (employee, referenceDate, custNat) => {

        let employeeDetails = await this.amountCalculatorHandler.calculateEmployeePayment(employee, referenceDate, custNat);

        if (employeeDetails === null) {

            employeeDetails = {
                "empJob": employee,
                "amount": 0,
                "additionalData": {}
            };
        }

        return employeeDetails;

    }

}

module.exports = EmployeeJobHandler;