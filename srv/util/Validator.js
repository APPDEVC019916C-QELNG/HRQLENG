const formatter = require('../util/Formatter');

class Validator {
    constructor() { 
        this.formatter = new formatter();
    }

    isValidString = (sString) => {
        return sString != null && sString !== "";
    }

    validateWithOperator = (sOperator, sValues, sCode, bIsDate) => {
        if (!this.isValidString(sOperator) || !this.isValidString(sCode)) {
            console.log("One or more parameters are null in validateWithOperator");
            return false;
        }

        if(bIsDate) {
            return this.validateDateWithOperator(sOperator, sValues, sCode);
        }
        else if (typeof sCode === 'boolean') {
            return this.validateBooleanWithOperator(sOperator, sValues, sCode);
        } else {
            return this.validateStringWithOperator(sOperator, sValues, sCode);
        }
    }

    validateBooleanWithOperator = (sOperator, sValues, sCode) => {
        switch (sOperator) {
            case "=":
                return sCode === Boolean(sValues);
            case "<>":
                return sCode !== Boolean(sValues);
            default:
                console.log(`Unsupported operator for booleans: ${sOperator}`);
                return false;
        }
    }

    validateDateWithOperator = (sOperator, sValues, sCode) => {
        let birthDate = new Date(sCode);
        if(isNaN(birthDate.getTime())) birthDate = new Date(this.formatter.formatDate(sCode));
        const currentDate = new Date();

        let age = currentDate.getFullYear() - birthDate.getFullYear();

        // Adjust if birthday hasn't occurred yet this year
        const hasBirthdayPassed =currentDate.getMonth() > birthDate.getMonth() || (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() >= birthDate.getDate());
    
        if (!hasBirthdayPassed) {
            age--;
        }

        switch (sOperator) {
            case ">=":
                return age >= sValues;
            case "<=":
                return age <= sValues;
            default:
                console.log(`Unsupported operator for booleans: ${sOperator}`);
                return false;
        }
    }

    validateStringWithOperator = (sOperator, sValues, sCode) => {
        if (sOperator === "=") {
            if (sValues && sValues.includes(";")) {
                return sValues.split(";").some(value => value === sCode);
            } else {
                return sValues === sCode;
            }
        } else if (sOperator === "<>") {
            if (sValues && sValues.includes(";")) {
                return sValues !== sCode;
            } else {
                if(sValues){
                    return sValues.split(";").every(value => value !== sCode);
                } else {
                    return sValues !== sCode;
                }
            }
        } else {
            console.log(`Unsupported operator for strings: ${sOperator}`);
            return false;
        }
    }

}

module.exports = Validator;