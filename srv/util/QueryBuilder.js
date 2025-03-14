class QueryBuilder {
    constructor() { }

    buildHealthCareCustQUery = (custNat, cust_employeeCategory ) => {

        const queryString = `mdfSystemRecordStatus eq 'N' and 
        cust_EmployeeCategory eq '${cust_employeeCategory}' and 
        cust_Eligibility eq '${custNat}'`;
        
        return queryString;
    };

    buildEmployeeFilterQuery = (aFilters) => {
        return aFilters.map(item => {
            if (Array.isArray(item)) {
                // For array items (OR condition between the objects)
                return `(${item.map(obj => {
                    const key = Object.keys(obj)[0];
                    return `${key} eq '${obj[key]}'`;
                }).join(" or ")})`;
            } else {
                // For individual objects (AND condition)
                const key = Object.keys(item)[0];
                let value = item[key];

                return `${key} eq '${value}'`;
            }
        }).join(" and ");
    }

    buildEligibilityQuery = (sEcField, sCustEligibility, sSystemStatus, sCustNat) => {

        let aFilters = [{
            "cust_ECField": sEcField
        }, {
            "cust_EligibilityType": sCustEligibility
        }, {
            "mdfSystemRecordStatus": sSystemStatus
        }, {
            "cust_National": sCustNat
        },

        ];

        return this._buildQuery(aFilters);
    }

    buildEmployeeDependentsQuery = (sExternalCode) => {
        return `externalCode eq '${sExternalCode}'`;
    }

    buildEmployeeDependentsDetailsQuery = (sExternalCode, familyCode) => {
        //  return 'externalCode eq '${sExternalCode} ' and cust_FamilyMember';
        return `externalCode eq '${sExternalCode}' and cust_FamilyMember eq '${familyCode}'`;

    }

    buildCDSdependentQuery = (sTarget, sCustNat) => {
        return `target = '${sTarget}' and (custNat = '${sCustNat}' or custNat IS NULL)`;
    }

    buildDependentAllowanceQuery = (sSystemStatus) => {
        return `mdfSystemRecordStatus eq '${sSystemStatus}'`;
    }

    buildEmployeeRecurringPayCompQuery = (userId, referenceDate, payCompCode) => {
        return `userId eq '${userId}' and payComponentCode eq '${payCompCode}' and payDate eq '${referenceDate}'`;
    }

    buildEmpCompensationQuery = (sUserId) => {
        return `userId eq '${sUserId}'`;
    }

    _buildQuery = (aFilters) => {
        return aFilters.map(item => {
            const key = Object.keys(item)[0];
            let value = item[key];

            if (value == null) {
                return `${key} eq ${value}`;
            }

            return `${key} eq '${value}'`;

        }).join(" and ");
    }
}

module.exports = QueryBuilder;