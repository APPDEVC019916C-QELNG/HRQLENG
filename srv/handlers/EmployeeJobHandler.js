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
        const eligibleDetailsList = [];
    
        for (const employee of eligibleEmployees) {
            console.log("----START USER -----");

            console.log(`Employee ID: ${employee.userId}`);

            const details = await this.processEmployee(employee, referenceDate, custNat);
            console.log(`Employee amount: ${details.amount}`);
    
            const dependentList = await this.dependentsHandler.getDependentsList(employee.userId, referenceDate);
    
            if (!dependentList?.length) {
                details.count = 1
                eligibleDetailsList.push(details);
                console.log("TOTAL AMOUNT: " +details.amount);
                console.log("TOTAL COUNT: " +details.count);
                continue;
            }
    
    
            // Categorize dependents
            const children = dependentList.filter(d => d.cust_FamilyMember === constant.MDF_VALUES.FAMILIY_KEY.CHILDREN);
            const spouse = dependentList.filter(d => d.cust_FamilyMember === constant.MDF_VALUES.FAMILIY_KEY.SPOUSE);

            console.log(`Children size: ${children.length}`);
            console.log(`Spouse size: ${spouse.length}`);
    
            // Process children and spouse in parallel
            const [childrenResult, spouseResult] = await Promise.all([
                this.dependentsHandler.processChildDependent(children, referenceDate, custNat, employee.userId),
                this.dependentsHandler.processSpouseDependent(spouse, referenceDate, custNat, employee.userId)
            ]);
    
            // Log results
            if(childrenResult){
                console.log(`Children processed amount: ${childrenResult.totalAmountString}`);
            }
            
            if(spouseResult){
                console.log(`Spouse processed amount: ${spouseResult.totalAmountString}`);
            }
    
            // Update details
            details.amount = this.sumStrings(childrenResult.totalAmountString, details.amount);
            details.amount = this.sumStrings(spouseResult.totalAmountString, details.amount);
            details.count = details.count + childrenResult.count + spouseResult.count;
    
            eligibleDetailsList.push(details);
            console.log("TOTAL AMOUNT: " +details.amount);
            console.log("TOTAL COUNT: " +details.count);

            console.log("----END USER -----");

        }
    
        return eligibleDetailsList;
    };
    

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
                "count": 0,
                "additionalData": {}
            };
        }

        return employeeDetails;

    }

}

module.exports = EmployeeJobHandler;