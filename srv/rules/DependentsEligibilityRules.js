const constant = require('../util/Constants');
const cruder = require('../util/Cruder');
const queryBuilder = require('../util/QueryBuilder');
const validator = require('../util/Validator');
const httpClient = require('../integration/HttpClient');


class DependentsEligibilityRules {
    constructor(service, st_picklist, bottleneck) {
        this.service = service;
        this.cruder = new cruder(service);
        this.queryBuilder = new queryBuilder();
        this.validator = new validator();

        this.st_picklist_conn = st_picklist;
        this.httpClient = new httpClient();

        this.limiter = bottleneck;
    }

    checkDependentsEligibility = async (oEmployee, sReferenceDate, aDependentDetails) => {
        const oCustNat = await this.st_picklist_conn.run(SELECT.one.from(constant.CDS_NAME.PICK_LIST_OPTION).where({ "id": oEmployee["customString20"] })).catch(oErr => { debugger; }); // customString20 (National)

        if (oCustNat) {
            let aPromise = [];

            const sQuery = this.queryBuilder.buildCDSdependentQuery(constant.CDS_PROPERTY.CHILD, oCustNat.externalCode);
            const aCdsRules = await this.cruder.read(constant.CDS_NAME.EMPLOYEE_ELIGIBILITY_RULE).where(sQuery);

            aDependentDetails.forEach(dependent => {
                aPromise.push(new Promise(async resolve => {
                    await this.isEligible(dependent, sReferenceDate, aCdsRules).then(bIsEligible => {
                        bIsEligible ? resolve(dependent) : resolve(null);
                    })
                }));
            });

            let aEligibleDependentsList = await Promise.all(aPromise).then(aResults => { return aResults.filter(res => !!res) });
            if (aEligibleDependentsList.length && oCustNat.externalCode === constant.MDF_VALUES.NON_NAT) {
                const sMaxChild = await this._validateMaxChildrenNum(sReferenceDate);
                aEligibleDependentsList.length <= sMaxChild ? aEligibleDependentsList : aEligibleDependentsList.splice(0, (aEligibleDependentsList.length - sMaxChild));
            }

            return aEligibleDependentsList;

        } else {
            console.log(`Could not validate if Employee: ${oEmployee.userId} is National or Non National through PickListOption`);
        }

    }

    isEligible = async (oDependent, sReferenceDate, aRules) => {
        const aQueries = await Promise.all(
            aRules.map(async rule => await this._getQuery(rule))
        );

        const aPromise = aQueries.map(oQueryObj =>
            this.limiter.schedule(async () => {
                const oEligbRule = await this.httpClient.getCustEligibility(oQueryObj.sQuery, sReferenceDate);

                if (oEligbRule && oEligbRule.length > 0) {
                    return await this._validateEligibilityRule(oDependent, oQueryObj.oRule, oEligbRule[0]).then(bValid => { return bValid; });
                } else {
                    console.log(`No Cust School Transportation Eligibility found for Dependent ${oDependent.cust_Dependents_externalCode}, userId ${oDependent.externalCode}, date ${sReferenceDate}, field ${oQueryObj.oRule.ecField}, custElig ${oQueryObj.oRule.custEligibility}`);
                    return false;
                }
            })
        );

        return await Promise.allSettled(aPromise).then(aResults => { return aResults.every(oRes => oRes.status === "fulfilled" && oRes.value === true); });
    }

    _getQuery = (oRule) => {
        return new Promise(async resolve => {
            resolve({
                sQuery: this.queryBuilder.buildEligibilityQuery(oRule.ecField, oRule.custEligibility, constant.MDF_VALUES.SYSTEM_RECORD_STATUS, oRule.custNat),
                oRule: oRule
            });
        })
    }

    _validateEligibilityRule = (oDependent, oRule, oEligbRule) => {
        return new Promise(async resolve => {
            resolve(this.validator.validateWithOperator(oEligbRule.cust_Operator, oEligbRule.cust_Values, oDependent[oRule.targetEntityProp], oRule.isDate));
        })
    }

    _validateMaxChildrenNum = (sReferenceDate) => {
        return new Promise(async resolve => {
            const sQuery = this.queryBuilder.buildEligibilityQuery(constant.RULE.EC_FIELD_MAX_CHILD, constant.RULE.CUST_ELIGIBILITY_TYPE, constant.MDF_VALUES.SYSTEM_RECORD_STATUS, constant.MDF_VALUES.NON_NAT);
            const oEligbRule = await this.httpClient.getCustEligibility(sQuery, sReferenceDate);
            if (oEligbRule && oEligbRule.length > 0) {
                resolve(oEligbRule[0].cust_Values);
            } else {
                console.log(`No Cust School Transportation Eligibility found for Max Child Capacity on Non Nat`);
                resolve(false);
            }
        });
    }


}

module.exports = DependentsEligibilityRules;