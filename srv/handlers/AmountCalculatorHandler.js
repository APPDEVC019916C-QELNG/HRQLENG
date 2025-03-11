const constant = require('../util/Constants');
const queryBuilder = require('../util/QueryBuilder');
const httpClient = require('../integration/HttpClient');
const cruder = require('../util/Cruder');
const payment = require('../payment/Payment');

class AmountCalculatorHandler {
    constructor(service, st_perPerson, st_picklist, st_healthCardRules, st_EmpEmployment) {
        this.service = service;
        this.queryBuilder = new queryBuilder();
        this.httpClient = new httpClient();
        this.cruder = new cruder(this.service);
        this.st_perPerson = st_perPerson;
        this.st_picklist =st_picklist;
        this.payment = new payment(this.service, st_healthCardRules, st_EmpEmployment);
    }


    //new logic ported from java

    /**
     * Calculates the payment amount for an employee.
     *
     * @param {Object} empJob - The employee job data.
     * @param {Date} referenceDate - The reference date for payment calculation.
     * @param {string} custNat - The nationality of the customer.
     * @return {Object|null} An object containing payment information, or null if not applicable.
     */
    calculateEmployeePayment = async (empJob, referenceDate, custNat) => {

        const empRule = await this.getCustHealthCardRule(
            empJob.userId, referenceDate, custNat, "employee"
        );

        const bApplicable = await this.payment.isEmployeeApplicable(empJob, referenceDate, empRule);

        if (empRule && bApplicable) {
            const amount = empRule.cust_Amount;
            return { empJob, amount, additionalData: {} };
        }
        return null;
    }

    /**
     * Calculates the payment amount for an employee's spouse.
     *
     * @param {Object} empJob - The employee job data.
     * @param {Object} spouse - The spouse details.
     * @param {Date} referenceDate - The reference date for payment calculation.
     * @param {string} custNat - The nationality of the customer.
     * @return {number} The calculated spouse payment amount.
     */
    calculateEmployeeSpousePayment = async (empJob, referenceDate, custNat, ) => {
        const spouseRule = await this.getCustHealthCardRule(
            empJob.userId, referenceDate, custNat, "spouse_nat"
        );

        if (spouseRule && this.payment.isApplicable(spouseRule.cust_Frequency, referenceDate, spouseRule)) {
            const spouseAmount = spouseRule.cust_Amount;
     
            return { empJob, amount, additionalData: {} };
        }
        return 0;
    }

    /**
     * Calculates the payment amount for an employee's child.
     *
     * @param {Object} empJob - The employee job data.
     * @param {Object} child - The child details.
     * @param {Date} referenceDate - The reference date for payment calculation.
     * @param {string} custNat - The nationality of the customer.
     * @return {number} The calculated child payment amount.
     */
    calculateEmployeeChildPayment = async (empJob, child, referenceDate, custNat) => {

  
        const childRule = await this.getCustHealthCardRule(
            empJob.userId, referenceDate, custNat,
            custNat, child.cust_Nationality
        );

        if (childRule && this.payment.isApplicable(childRule.cust_Frequency, childRule.effectiveStartDate , referenceDate)) {
            const childAmount = childRule.cust_Amount;

            return childAmount;
        }
        return 0;
    }

    getCustHealthCardRule = async (employeeID, referenceDate, ecField, custEligibility) => {

        const gender = await this.fetchGenderForUser(employeeID);

        if (ecField === "Nat") {
            ecField = "national";  

            return this.payment.getHealthCardRules(employeeID, referenceDate, ecField, custEligibility, gender);
        
        } else {

         const perPersonal = await this.fetchPersonalForEmployee(employeeID);

            const pickListNationalOpt = await this._getPickList(perPersonal.customString1);

            if (!pickListNationalOpt || pickListNationalOpt.length === 0) {
                console.info(`PickListOption Empty for NON EcField: ${ecField}, Gender: ${gender}, custEligibility: ${custEligibility}`);
                return null;
            }
            ecField = this.getEligibilityForNonNatEmployee(pickListNationalOpt.externalCode);

            return this.payment.getHealthCardRules(employeeID, referenceDate, ecField, custEligibility, gender);
        }


    }

     getEligibilityForNonNatEmployee= (custEligibility) => {
        const gccCountries = ["SA", "KW", "AE", "BH", "OM"];
        if (gccCountries.includes(custEligibility.toUpperCase())) {
            return "gcc";
        }
        return "non_national";
    }

    fetchGenderForUser = async (userID) => {
        const oUserInfo = await this._getUserInformation(userID);
        return this._mapGender(oUserInfo.gender);
    };
    
    fetchPersonalForEmployee = async (userID) => {
        return await this._getUserInformation(userID);
    };
    
    _getUserInformation = async (userID) => {
        return await this.st_perPerson.run(SELECT.one.from(constant.CDS_NAME.PER_PERSONAL).where({ "personIdExternal": userID }));
    };

    _getPickList = async (id) => {
        return await this.st_picklist.run(SELECT.one.from(constant.CDS_NAME.PICK_LIST_OPTION).where({ "id": id }));
    };


    
    _mapGender = (genderField) => {
        const normalizedGender = genderField ? genderField.toLowerCase() : '';
        if (normalizedGender === "m" || genderField === "1") {
            return "M";
        } else if (normalizedGender === "f" || genderField === "2") {
            return "F";
        }
        return null;
    };


    //andre logic

}

module.exports = AmountCalculatorHandler;