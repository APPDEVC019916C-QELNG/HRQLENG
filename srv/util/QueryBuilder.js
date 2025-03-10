class QueryBuilder {
    constructor() { }

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

    buildEmployeeRecurringPayCompQuery = (userId, sPayComponent) => {
        return `userId eq '${userId}' and payComponentCode eq '${sPayComponent}'`;
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