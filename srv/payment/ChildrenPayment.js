const constant = require('../util/Constants');
const cruder = require('../util/Cruder');
const formatter = require('../util/Formatter');
const DependentEligibilityRules = require('../rules/DependentsEligibilityRules');



class ChildrenPayment {
    constructor(service, bottleNeck) {
        this.formatter = new formatter();
        this.cruder = new cruder(service);
        this.dependentEligibilityRules = new DependentEligibilityRules(service, bottleNeck);
    }

    isEligible =  async (details, referenceDate, custNational) => {

        const age = this.calculateAge(details.cust_DateOfBirth, referenceDate);

        if (custNational === "Nat" ) {
            return await this.evaluateNationalEligibility(details, referenceDate, custNational, age);
        } else {
            return await this.evaluateNonNationalEligibility(details, referenceDate, custNational, age);
        }

    }

     validateRulesForNationalChildBE23 = async (details, referenceDate, custNational, applicableAgeRange)  =>{

        const rules = await this.cruder.read(constant.CDS_NAME.CHILD_ELIGIBILITY_RULE, [['payComponent', '=',"3126"], ['applicableAgeRange', '=', applicableAgeRange], ['custNat', '=', custNational]], 'AND' );
    
        for (const rule of rules) {
            if (!isSimpleRuleEligible(details, rule, referenceDate)) {
                return false; // Equivalent of Optional.empty()
            }
        }
    
        return true; 
    }
    
     validateRulesForNationChildG23Gender = async (details, referenceDate, custNational, applicableAgeRange) => {
        const rules = await this.cruder.read(constant.CDS_NAME.CHILD_ELIGIBILITY_RULE, [['payComponent', '=',"3126"], ['applicableAgeRange', '=', applicableAgeRange], ['custNat', '=', custNational]], 'AND' );
       
        const gender = details.custGender; // Assumed direct property access
    
        for (const rule of rules) {
            if (isGenderMatching(gender, rule) && !isSimpleRuleEligible(details, rule, referenceDate)) {
                return false;
            }
        }
    
        return true;
    }
    

    calculateAge = (birthDate, referenceDate) => {

        
        const birth = new Date(this.formatter.formatDate(birthDate));
        let reference = new Date(referenceDate);
        
        // Adjust referenceDate to December 31st of the same year
        reference.setMonth(11); // Set to December
        reference.setDate(31);  // Set to 31st
    
        let age = reference.getFullYear() - birth.getFullYear();
        
        // Adjust if the birthday hasn't occurred yet in the current year
        if (
            reference.getMonth() < birth.getMonth() ||
            (reference.getMonth() === birth.getMonth() && reference.getDate() < birth.getDate())
        ) {
            age--;
        }
    
        return age;
    }

     evaluateNationalEligibility = async ( details, referenceDate, custNational, age) => {
        const applicableAgeRange = this.getNationalAgeRange(age);
        
        if (age <= 23) {
            return await this.validateRulesForNationalChildBE23(details, referenceDate, custNational, applicableAgeRange);
        } else {
            return await this.validateRulesForNationChildG23Gender(details, referenceDate, custNational, applicableAgeRange);
        }
    }
    
     evaluateNonNationalEligibility  = async (details, referenceDate, custNational, age) =>{
        if (age < 19) {
            return true;
        }
    
        if (age > 23) {
            return false;
        }
    
        const applicableAgeRange = this.getNonNationalAgeRange(age);

        const rules = await this.cruder.read(constant.CDS_NAME.CHILD_ELIGIBILITY_RULE, [['payComponent', '=',"3125"], ['applicableAgeRange', '=', applicableAgeRange], ['custNat', '=', custNational]], 'AND' );
        

        if(rules && rules.length > 0){
            const result = await this.dependentEligibilityRules.isEligible(details, referenceDate, rules);

            if(!result) return false;
            return result;
        }

        return false;

    }

     getNationalAgeRange = (age) => {
        return age <= 23 ? "<=23" : ">23";
    }

    getNonNationalAgeRange = (age) => {
        if (age >= 19 && age <= 23) {
            return "19-23";
        } else if (age > 23) {
            return ">23";
        }    
    }

    
    
    


}

module.exports = ChildrenPayment;