const formatter = require('../util/Formatter');

class Validator {
    constructor() {
        this.formatter = new formatter();
    }

    isValidString = (sString) => {
        return sString != null && sString !== "";
    }

    validateWithOperator = (sOperator, sValues, sCode, bIsDate, sReferenceDate) => {
        if (!this.isValidString(sOperator) || !this.isValidString(sCode)) {
            console.log("One or more parameters are null in validateWithOperator");
            return false;
        }


        if (bIsDate) {
            return this.validateDateWithOperator(sOperator, sValues, sCode, sReferenceDate);
        }
        else if (typeof sCode === 'boolean') {
            return this.validateBooleanWithOperator(sOperator, sValues, sCode);
        } else {
            return this.validateStringWithOperator(sOperator, sValues, sCode);
        }
    }

    validateBooleanWithOperator = (sOperator, sValues, sCode) => {

        const boolValue = sValues === "Y" ? true : sValues === "N" ? false : Boolean(sValues);

        switch (sOperator) {
            case "=":
                return sCode === Boolean(boolValue);
            case "<>":
                return sCode !== Boolean(boolValue);
            default:
                console.log(`Unsupported operator for booleans: ${sOperator}`);
                return false;
        }
    }

    validateDateWithOperator = (custOperator, custValues, fieldDateValue, referenceDate) => {
        // Step 1: Get the year from referenceDate
        const year = new Date(referenceDate).getFullYear();

        // Step 2: Replace "XXXX" in custValues with the extracted year
        const updatedDateString = custValues.replace("XXXX", year.toString());

        // Step 3: Convert "/Date(1709251200000)/" (fieldDateValue) to a JavaScript Date object
        const dateNormalTimestamp = fieldDateValue.match(/\d+/)[0]; // Extract the timestamp part from fieldDateValue
        const dateNormalObj = new Date(parseInt(dateNormalTimestamp, 10)); // Convert to Date object

        // Step 4: Convert updatedDateString to Date object
        const [month, day, yearFromDateString] = updatedDateString.split('/').map(Number);
        const updatedDateObj = new Date(yearFromDateString, month - 1, day);

        // Step 5: Perform comparison based on the operator
        switch (custOperator) {
            case "<":
                return dateNormalObj < updatedDateObj;
            case "<=":
                return dateNormalObj <= updatedDateObj;
            case ">":
                return dateNormalObj > updatedDateObj;
            case ">=":
                return dateNormalObj >= updatedDateObj;
            case "=":
                return dateNormalObj.getTime() === updatedDateObj.getTime();
            case "<>":
                return dateNormalObj.getTime() !== updatedDateObj.getTime();
            default:
                console.error(`Unsupported operator for dates: ${custOperator}`);
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
                if (sValues) {
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


    validateWithDate = async (sOperator, sValues, sCode, bIsDate) => {

        const { custValues: originalCustValues, custOperator } = ruleOpt;
        let custValues = originalCustValues.replace("XXXX", referenceDate.getFullYear().toString());

        logger.debug(`Evaluating CustValues: ${custValues}, CustOperator: ${custOperator}, for Obj ID: ${objID}, custNational:${custNational}, custEligibility:${custEligibility}, ecField:${ecField}`);

        const isValid = custValuesChecker.validateWithOperator(dateAttribute, custValues, custOperator);

        logger.debug(`Validation result for Obj ID ${objID} and custNational ${custNational}: dateAttribute=${dateAttribute}, custValues=${custValues}, operator=${custOperator}, isValid=${isValid}`);

        return isValid;
    }


}

module.exports = Validator;