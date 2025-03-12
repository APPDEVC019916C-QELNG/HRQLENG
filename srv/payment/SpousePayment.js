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

            for (let rule of spouseRules) {
                let isValid = true;
                
                if (rule.checkGender) {
                    // Get the gender of the employee for the spouse
                    //let perPersonal = genderService.getPerPersonalForEmployeeId(employeeID);
                    let perPersonal = await this.fetchPersonalForEmployee(employeeID);
                    //console.log("Spouse nationality " + perPersonal.personal);
                    if (!perPersonal) {
                        return null;
                    }

                    isValid = await this.dependentEligibilityRules.isEligible(details, referenceDate, rule);
                    
                    if (!isValid) {
                        return null;
                    }
                }
            }
            return details;
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