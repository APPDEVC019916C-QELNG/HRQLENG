const constant = require('../util/Constants');
const queryBuilder = require('../util/QueryBuilder');
const httpClient = require('../integration/HttpClient');
class AmountCalculatorHandler {
    constructor() {
        this.queryBuilder = new queryBuilder();
        this.httpClient = new httpClient();
    }

    calculateAmount = async (aEligibleDependents, sReferenceDate) => {
        let aPromise = [];
        
        aEligibleDependents.forEach(dependent => {
            aPromise.push(new Promise (async resolve => {
                resolve(await this._getDependentAllowanceAmount(dependent, sReferenceDate));
            }));
        });

        return await Promise.all(aPromise).then(aResults => { return aResults.reduce((sum, res) => sum + (Number(res.cust_Amount) || 0), 0) });
    }

    _getDependentAllowanceAmount = async (oDependent, sReferenceDate) => {
        return new Promise(async resolve => {
            const sQuery = this.queryBuilder.buildDependentAllowanceQuery(constant.MDF_VALUES.SYSTEM_RECORD_STATUS);
            const oAllowance = await this.httpClient.getAllowanceRules(sQuery, sReferenceDate);
            if (oAllowance && oAllowance.length > 0) {
                resolve(oAllowance[0]);
            } else {
                console.log(`No Amount found for Dependent ${oDependent.externalCode}, date ${sReferenceDate}`);
                resolve(null);
            }
        });
    }

}

module.exports = AmountCalculatorHandler;