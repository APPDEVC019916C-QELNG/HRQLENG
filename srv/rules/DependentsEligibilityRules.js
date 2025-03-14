const constant = require('../util/Constants');
const cruder = require('../util/Cruder');
const queryBuilder = require('../util/QueryBuilder');
const validator = require('../util/Validator');
const httpClient = require('../integration/HttpClient');


class DependentsEligibilityRules {
    constructor(service, bottleneck) {
        this.service = service;
        this.cruder = new cruder(service);
        this.queryBuilder = new queryBuilder();
        this.validator = new validator();

        this.httpClient = new httpClient();

        this.limiter = bottleneck;
    }


    isEligible = async (oDependent, sReferenceDate, aRules) => {
        // Generate queries in parallel
        const aQueries = await Promise.all(aRules.map(this._getQuery));

        // Process eligibility checks with rate limiter
        const aResults = [];
        for await (const oQueryObj of aQueries) {
            const oEligbRule = await this.limiter.schedule(() =>
                this.httpClient.getCustEligibility(oQueryObj.sQuery, sReferenceDate)
            );

            if (!oEligbRule || oEligbRule.length === 0) {
                console.log(`No Health Card Eligibility found for Dependent ${oDependent.cust_Dependents_externalCode}, userId ${oDependent.externalCode}, date ${sReferenceDate}, field ${oQueryObj.oRule.ecField}, custElig ${oQueryObj.oRule.custEligibility}`);
                aResults.push(false);
                continue;
            }

            const isValid = await this._validateEligibilityRule(oDependent, oQueryObj.oRule, oEligbRule[0], sReferenceDate);
            aResults.push(isValid);
        }


        return aResults.every(Boolean);

    };


    isEligibleWithGender = async (oDependent, sReferenceDate, aRules) => {
        // Generate queries in parallel
        const aQueries = await Promise.all(aRules.map(this._getQuery));

        // Process eligibility checks with rate limiter
        const aResults = [];
        for await (const oQueryObj of aQueries) 
        
        {
            const oEligbRule = await this.limiter.schedule(() =>
                this.httpClient.getCustEligibility(oQueryObj.sQuery, sReferenceDate)
            );

            if (!oEligbRule || oEligbRule.length === 0) {
                console.log(`No Health Card Eligibility found for Dependent ${oDependent.cust_Dependents_externalCode}, userId ${oDependent.externalCode}, date ${sReferenceDate}, field ${oQueryObj.oRule.ecField}, custElig ${oQueryObj.oRule.custEligibility}`);
                aResults.push(false);
                continue;
            }

            const isValid = await this._validateEligibilityRule(oDependent, oQueryObj.oRule, oEligbRule[0], sReferenceDate);
            aResults.push(isValid);
        }


        return aResults.every(Boolean);

    };


    _getQuery = (oRule) => {
        return new Promise(async resolve => {
            resolve({
                sQuery: this.queryBuilder.buildEligibilityQuery(oRule.ecField, oRule.custEligibility, constant.MDF_VALUES.SYSTEM_RECORD_STATUS, oRule.custNat),
                oRule: oRule
            });
        })
    }

    _validateEligibilityRule = async (oDependent, oRule, oEligbRule, sReferenceDate) => {

        return this.validator.validateWithOperator(
            oEligbRule.cust_Operator,
            oEligbRule.cust_Values,
            oDependent[oRule.targetEntityProp],
            oRule.isDate,
            sReferenceDate
        );
    };





}

module.exports = DependentsEligibilityRules;