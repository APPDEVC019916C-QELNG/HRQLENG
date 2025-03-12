const constant = require('../util/Constants');
const cruder = require('../util/Cruder');




class Payment {
    constructor(service, st_healthCardRules, st_EmpEmployment) {
        this.service = service;
        this.cruder = new cruder(this.service);
        this.st_healthCardRules = st_healthCardRules;
        this.st_EmpEmployment = st_EmpEmployment;

    }



    isEmployeeApplicable = async (empJob, referenceDate, empRule) => {
        const empDetails = await this.fetchHireDateForUser(empJob.userId);

        return this.isApplicable(empRule.cust_Frequency, empDetails.startDate, referenceDate);
    }

    isApplicable = (frequency, entryDate, referenceDate) => {
        console.log("fequency: " + frequency);

        if (frequency === 1 || frequency ==='1') {
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