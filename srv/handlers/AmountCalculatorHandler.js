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

        const empRule = await this.getCustHealthCardRuleEmployee(
            empJob.userId, referenceDate, custNat, "employee"
        );
        
      //  console.log("Employee rule name: "+empRule !== undefined ? empRule.externalName :" No Rule / undefined rule");
        
        const bApplicable = await this.payment.isEmployeeApplicable(empJob, referenceDate, empRule);

        if (empRule && bApplicable) {
            const amount = empRule.cust_Amount;
            const count = 1;
            return { empJob, amount, count, additionalData: {} };
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
    calculateEmployeeSpousePayment = async (spouse, referenceDate, custNat, empId) => {
        let spouse_cust_nat;
        let ecField;
        if(custNat === "Nat"){
            spouse_cust_nat = this._determineECFieldForNationalEmployee(spouse.cust_Nationality);
            ecField = "national";
        }else{
            const perPersonal = await this.fetchPersonalForEmployee(empId);
            const pickList = await this._getPickList(perPersonal.customString1);
            spouse_cust_nat = this._determineEligibilityBasedOnSpouseNat(spouse.cust_Nationality);
            ecField = this.getEligibilityForNonNatEmployee(pickList.externalCode);
        }
        const spouseRule = await this.getCustHealthCardRuleSpouse(
           empId, referenceDate, ecField, spouse_cust_nat
        );
        
      //  console.log("spouse Rule name: "+ spouseRule !== undefined ? spouseRule.externalName :"no rule");
        console.log("spouse Cust_Nationality: "+ spouse_cust_nat);

        if (spouseRule && this.payment.isApplicable(spouseRule.cust_Frequency, spouse.cust_FirstEntryDate, referenceDate)) {
            return spouseRule.cust_Amount;
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
    calculateEmployeeChildPayment = async (child, referenceDate, custNat, empId) => {

  
        const childRule = await this.getCustHealthCardRuleChild(
            empId, referenceDate, custNat,
            child.cust_Nationality
        );

       // console.log("Child rule name: " + childRule !== undefined ? childRule.externalName : "no Rule undefined rule");


        if (childRule && this.payment.isApplicable(childRule.cust_Frequency, childRule.effectiveStartDate , referenceDate)) {
            return childRule.cust_Amount;
        }
        return 0;
    }

    getCustHealthCardRuleEmployee = async (employeeID, referenceDate, ecField, custEligibility) => {

        const gender = await this.fetchGenderForUser(employeeID);
        const gender1 = this._getGender(gender, 1);
        const gender2 = this._getGender(gender, 2);

        if (ecField === "Nat") {
            ecField = "national"; 
            
            const oRulesResult = await this._fetchHealthCardRules(referenceDate, ecField, custEligibility);
            return oRulesResult.find(item => item.cust_Gender === gender1 || item.cust_Gender === gender2);

        } else {

         const perPersonal = await this.fetchPersonalForEmployee(employeeID);

            const pickListNationalOpt = await this._getPickList(perPersonal.customString1);

            if (!pickListNationalOpt || pickListNationalOpt.length === 0) {
                console.info(`PickListOption Empty for NON EcField: ${ecField}, Gender: ${gender}, custEligibility: ${custEligibility}`);
                return null;
            }
            ecField = this.getEligibilityForNonNatEmployee(pickListNationalOpt.externalCode);

            const oRulesResult = await this._fetchHealthCardRules(referenceDate, ecField, custEligibility);
            return oRulesResult.find(item => item.cust_Gender === gender1 || item.cust_Gender === gender2);
        }


    }

    getCustHealthCardRuleChild = async (employeeID, referenceDate, ecField, custEligibility) => {

        const gender = await this.fetchGenderForUser(employeeID);
        const gender1 = this._getGender(gender, 1);
        const gender2 = this._getGender(gender, 2);

        if (ecField === "Nat") {
            ecField = "national";  

            const oRulesResult = await this._fetchHealthCardRules(referenceDate, ecField, "children_nat");
            return oRulesResult.find(item => item.cust_Gender === gender1 || item.cust_Gender === gender2);
        
        } else {

            const perPersonal = await this.fetchPersonalForEmployee(employeeID);

            const pickListNationalOpt = await this._getPickList(perPersonal.customString1);

            if (!pickListNationalOpt || pickListNationalOpt.length === 0) {
                console.info(`PickListOption Empty for NON EcField: ${ecField}, Gender: ${gender}, custEligibility: ${custEligibility}`);
                return null;
            }
            ecField = this.getEligibilityForNonNatEmployee(pickListNationalOpt.externalCode);
            custEligibility = this.getEligibilityForNonNatEmployeeChildDeps(custEligibility);

            const oRulesResult = await this._fetchHealthCardRules(referenceDate, ecField, custEligibility);
            return oRulesResult.find(item => item.cust_Gender === gender1 || item.cust_Gender === gender2);
        }


    }

    getCustHealthCardRuleSpouse = async (employeeID, referenceDate, ecField, custEligibility) => {
        const gender = await this.fetchGenderForUser(employeeID);
        const gender1 = this._getGender(gender, 1);
        const gender2 = this._getGender(gender, 2);

        const oRulesResult = await this._fetchHealthCardRules(referenceDate, ecField, custEligibility);
        return oRulesResult.find(item => item.cust_Gender === gender1 || item.cust_Gender === gender2);
    }

    getEligibilityForNonNatEmployeeChildDeps= (custEligibility) => {
        const gccCountries = ["SA", "KW", "AE", "BH", "OM"];
    
        if (custEligibility.toUpperCase() === "QA") {
            return "children_nat";
        }
    
        if (gccCountries.includes(custEligibility.toUpperCase())) {
            return "children_gcc";
        }
    
        return "children_nongcc";
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


    _fetchHealthCardRules= async ( referenceDate, employeeCategory, custNat) => {

        const sQuery = this.queryBuilder.buildHealthCareCustQUery(custNat, employeeCategory);

        return await this.httpClient.getCustHealthCardRules(sQuery, referenceDate);
    };

    _getGender = (gender, formatType) => {
        if (!gender || gender.trim() === "") {
            throw new Error("Gender cannot be null or empty");
        }

        switch (formatType) {
            case 1:
                return gender.toUpperCase() === "M" || gender === "1" ? "1"
                    : gender.toUpperCase() === "F" || gender === "2" ? "2"
                        : null;

            case 2:
                return gender.toUpperCase() === "M" || gender === "1" ? "M"
                    : gender.toUpperCase() === "F" || gender === "2" ? "F"
                        : null;

            default:
                throw new Error(`Invalid format type: ${formatType}`);
        }
    }


    
    _mapGender = (genderField) => {
        const normalizedGender = genderField ? genderField.toLowerCase() : '';
        if (normalizedGender === "m" || genderField === "1") {
            return "M";
        } else if (normalizedGender === "f" || genderField === "2") {
            return "F";
        }
        return null;
    };

     _determineECFieldForNationalEmployee= (nationality) => {
        if (nationality === "QA" || nationality === "" || nationality === undefined) {
            return "spouse_nat"; // Spouse (National)
        } 
        if (["SA", "KW", "AE", "BH", "OM"].includes(nationality)) {
            return "spouse_gcc"; // Spouse (GCC)
        } 
        return "spouse_nongcc"; // Spouse (Non-GCC)
    }

    _determineEligibilityBasedOnSpouseNat = (spouseNat) =>{
        const gccCountries = ["SA", "KW", "AE", "BH", "OM"];
      
        if (!spouseNat || spouseNat.trim() === "" || spouseNat.toUpperCase() === "QA") {
          return "spouse_nat";
        } else if (gccCountries.includes(spouseNat.toUpperCase())) {
          return "spouse_gcc";
        }
        return "spouse_nongcc";
      }
      


    //andre logic

}

module.exports = AmountCalculatorHandler;