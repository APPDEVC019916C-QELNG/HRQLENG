const constant = require('../util/Constants');
const cruder = require('../util/Cruder');
const DependentEligibilityRules = require('../rules/DependentsEligibilityRules');




class SpousePayment {
    constructor(service, st_perPerson, bottleNeck) {
        this.cruder = new cruder(service);
        this.st_perPerson = st_perPerson;
        this.dependentEligibilityRules = new DependentEligibilityRules(service, bottleNeck);

    }

    isEligible = async (details, referenceDate, custNational, employeeID) => {

        if (custNational === "Nat") {
            const spouseRules = await this.cruder.read(constant.CDS_NAME.SPOUSE_ELIGIBILITY_RULE, [['payComponent', '=', "3126"], ['custNat', '=', custNational]], 'AND');
            let isValid = await this.dependentEligibilityRules.isEligibleWithGender(details, referenceDate, spouseRules);

            if(isValid){
               return details; 
            } else{
                false
            }
        }
        // Non-national spouse has no eligibility
        return details;
    }

    fetchPersonalForEmployee = async (userID) => {
        return await this.st_perPerson.run(SELECT.one.from(constant.CDS_NAME.PER_PERSONAL).where({ "personIdExternal": userID }));
    };

    checkSpouseNationality = (spouseNationality) => {
        let eligibility;

        // Condition i: if Nationality is QA (Qatari) or empty
        if (spouseNationality === 'QA' || !spouseNationality) {
            eligibility = 'spouse_nat'; // Spouse (National)
        }
        // Condition ii: if Nationality is SA, KW, AE, BH, or OM (GCC countries)
        else if (['SA', 'KW', 'AE', 'BH', 'OM'].includes(spouseNationality)) {
            eligibility = 'spouse_gcc'; // Spouse (GCC)
        }
        // Condition iii: Other nationalities
        else {
            eligibility = 'spouse_nongcc'; // Spouse (Non-GCC)
        }

        return eligibility;
    };

}

module.exports = SpousePayment;