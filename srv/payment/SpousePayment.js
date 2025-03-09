const constant = require('../util/Constants');
const cruder = require('../util/Cruder');
const DependentEligibilityRules = require('../rules/DependentsEligibilityRules');




class SpousePayment {
    constructor(service, st_perPerson, bottleNeck) {
        this.cruder = new cruder(service);
        this.st_perPerson = st_perPerson;
        this.dependentEligibilityRules = new DependentEligibilityRules(service, bottleNeck);

    }

    isApplicable = async (details, referenceDate, custNational) => {

        const spouseNationality = this.checkSpouseNationality(details.cust_Nationality);

        const rules = await this.cruder.read(constant.CDS_NAME.SPOUSE_ELIGIBILITY_RULE, [['payComponent', '=', "3126"], ['custNat', '=', custNational]], 'AND');
        //const perPersonal = await this.fetchPersonalForEmployee(employeeID);
        const result = await this.dependentEligibilityRules.isEligible(details, referenceDate, rules);

        debugger;
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