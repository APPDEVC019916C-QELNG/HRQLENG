const constant = require('../util/Constants');
const cruder = require('../util/Cruder');




class Payment {
    constructor(service, st_healthCardRules, st_EmpEmployment) {
        this.service = service;
        this.cruder = new cruder(this.service);
        this.st_healthCardRules = st_healthCardRules;
        this.st_EmpEmployment = st_EmpEmployment;

    }

    getHealthCardRules = async (userId, referenceDate, ecField, custEligibility, gender) => {

        const gender1 = this._getGender(gender, 1);
        const gender2 = this._getGender(gender, 2);

        return await this.st_healthCardRules.run(SELECT.one.from(constant.CDS_NAME.CUST_HEALTHCARD_RULES).where(
            { ref: ["cust_EmployeeCategory"] }, "=", { val: ecField }, "and",
            { ref: ["cust_Eligibility"] }, "=", { val: custEligibility }, "and",
            { ref: ["effectiveStartDate"] }, "<=", { val: referenceDate }, "and",
            { ref: ["mdfSystemRecordStatus"] }, "=", { val: "N" }, "and",
            "(",
            { ref: ["cust_Gender"] }, "=", { val: gender1 }, "or",
            { ref: ["cust_Gender"] }, "=", { val: gender2 },
            ")",
            "and",
            "(",
            { ref: ["mdfSystemEffectiveEndDate"] }, ">=", { val: referenceDate }, "or",
            { ref: ["mdfSystemEffectiveEndDate"] }, "is", null,
            ")"
        ));

    }

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

    isEmployeeApplicable = async (empJob, referenceDate, empRule) => {
        const empDetails = await this.fetchHireDateForUser(empJob.userId);

        return this.isApplicable(empRule.cust_Frequency, empDetails.startDate, referenceDate);
    }

    isApplicable = (frequency, entryDate, referenceDate) => {
        console.log("Enter day --> " + entryDate + "   referenceDate.  " + referenceDate);

        if (frequency === 1) {
            return true; // Always applicable for frequency = 1
        }
    
        if (!entryDate) {
            return false; // Null check for entry date
        }
    
        // Convert entryDate from string to Date object
        const entryDateObj = new Date(entryDate);
        const referenceDateObj = new Date(referenceDate);
    
        if (isNaN(entryDateObj) || isNaN(referenceDateObj)) {
            console.error("Invalid date format for entryDate or referenceDate");
            return false;
        }
    
        const entryYear = entryDateObj.getFullYear();
        const referenceYear = referenceDateObj.getFullYear();
    
        const dayOfYear = (date) => Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    
        if (dayOfYear(entryDateObj) === 1 && entryYear === referenceYear) {
            console.log("// Date is 1st January of the reference year");
            return true;
        }
    
        if (entryYear === referenceYear - 1 && dayOfYear(entryDateObj) !== 1) {
            console.log("// Date is in the previous year but not on 1st January");
            return true;
        }
    
        if (dayOfYear(entryDateObj) === 1 && (referenceYear - entryYear) % frequency === 0) {
            console.log("// Date is 1st January and frequency matches the difference");
            return true;
        }
    
        if (dayOfYear(entryDateObj) !== 1 && (referenceYear - entryYear - 1) % frequency === 0) {
            console.log("// Date is not on 1st January and frequency matches adjusted difference");
            return true;
        }
    
        return false;
    }


    fetchHireDateForUser = async (id) => {
        return await this.st_EmpEmployment.run(SELECT.one.from(constant.CDS_NAME.EMP_EMPLOYMENT).where({ "userId": id }));
    }




}

module.exports = Payment;