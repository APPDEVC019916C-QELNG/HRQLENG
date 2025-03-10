const constant = require("../util/Constants");
const sdkDest = require("@sap-cloud-sdk/connectivity");
const sdkHttpRequest = require('@sap-cloud-sdk/http-client');

class HttpClient {
    constructor() {
        this.destinationName = "cpapp-bupa";
    }


    upsertEmpCompensation = async (oPayload) => {
        return await this._doUpsert(constant.CDS_NAME.EMP_COMPENSATION, oPayload);
    }

    //MIGUEL
    upsertEmpPayCompNonRecurring = async (oPayload) => {
        return await this._doUpsert(constant.CDS_NAME.EMP_PAY_COMP_NON_RECURRING, oPayload);
    }

    _doUpsert = (sEntityName, oPayload) => {
        return new Promise(async resolve => {
            const destination = await sdkDest.getDestination({ destinationName: this.destinationName });

            if (Array.isArray(oPayload)) {
                oPayload.forEach(item => {
                    item["__metadata"] = {
                        uri: `${destination.url}/${sEntityName}`
                    };
                })
            } else {
                oPayload["__metadata"] = {
                    uri: `${destination.url}/${sEntityName}`
                };
            }

            const requestOptions = {
                method: 'POST',
                url: "/upsert",
                headers: {
                    "Content-Type": "application/json"
                }
            };

            requestOptions.data = JSON.stringify(oPayload);
            const oResponse = await sdkHttpRequest.executeHttpRequest(destination, requestOptions, { fetchCsrfToken: false })

            resolve(oResponse.data);
        });
    }

    getEmpJob = async (sQuery, sReferenceDate) => {
        return await this._doGet(constant.CDS_NAME.EMP_JOB, sQuery, sReferenceDate, true, true, "userId");
    }

    getEmpPayCompNonRecurring = async (sQuery, sReferenceDate, bToDate) => {
        return await this._doGet(constant.CDS_NAME.EMP_PAY_COMP_NON_RECURRING, sQuery, sReferenceDate, true, bToDate);
    }

    getEmpCompensation = async (sQuery, sReferenceDate, bFromDate, bToDate) => {
        return await this._doGet(constant.CDS_NAME.EMP_COMPENSATION, sQuery, sReferenceDate, bFromDate, bToDate);
    }

    getCustEligibility = async (sQuery, sReferenceDate) => {
        return await this._doGet(constant.CDS_NAME.CUST_HEALTHCARD_RULES_ELIGIBILITY, sQuery, sReferenceDate, true, true);
    }
    
    getCustDependent = async (sQuery, sReferenceDate, sExpand) => {
        return await this._doGet(constant.CDS_NAME.CUST_DEPENDENTS, sQuery, sReferenceDate, true, true, null, sExpand);
    }

    getCustDependentDetails = async (sQuery, sReferenceDate, sExpand) => {
        return await this._doGet(constant.CDS_NAME.CUST_DEPENDENTS_DETAILS, sQuery, sReferenceDate, true, true, null, sExpand);
    }



    getAllowanceRules = async (sQuery, sReferenceDate) => {
        return await this._doGet(constant.CDS_NAME.CUST_SCHOOL_TRANSP_ALLOWANCE_RULES, sQuery, sReferenceDate, true, true);
    }

    _doGet = (sEntityName, sQuery, sReferenceDate, bFromDate, bToDate, sOrderBy, sExpand) => {
        return new Promise(async resolve => {
            const destination = await sdkDest.getDestination({ destinationName: this.destinationName });

            let url = new URL(`${destination.url}/${sEntityName}`);
            let oQueryParams = {};

            if (sQuery && sQuery != '') oQueryParams["$filter"] = sQuery;
            if (bFromDate) oQueryParams["fromDate"] = sReferenceDate;
            if (bToDate) oQueryParams["toDate"] = sReferenceDate;
            if (sOrderBy && sOrderBy != '') oQueryParams["$orderby"] = sOrderBy;
            if (sExpand && sExpand != '') oQueryParams["$expand"] = sExpand;

            if (oQueryParams) {
                const searchParams = new URLSearchParams();

                for (const [key, value] of Object.entries(oQueryParams)) {
                    if (key === "$filter") {
                        searchParams.append(key, value);
                    } else {
                        searchParams.set(key, value);
                    }
                }
                url.search = searchParams.toString();
            }

            let skip = 0;
            let allRecords = [];

            const requestOptions = {
                method: 'GET',
                url: url.toString(),
                headers: {
                    "Content-Type": "application/json"
                },
                params: {
                    $top: 1000,
                    $skip: skip
                }
            };

            if(sEntityName == constant.CDS_NAME.EMP_JOB) {
                while (true) {
                    try {
                        const response = await sdkHttpRequest.executeHttpRequest(destination, requestOptions, { fetchCsrfToken: false });
                        if (response.data.d.results?.length > 0) {
                            allRecords = allRecords.concat(response.data.d.results);
                            requestOptions.params.$skip += 1000;
                        } else {
                            break;
                        }
                    } catch (error) {
                        console.error('Error fetching batch:', error);
                        break;
                    }
                }
            } else {
                const response = await sdkHttpRequest.executeHttpRequest(destination, requestOptions, { fetchCsrfToken: false });
                allRecords = allRecords.concat(response.data.d.results);
            }

            resolve(allRecords);
        });
    }

}

module.exports = HttpClient;