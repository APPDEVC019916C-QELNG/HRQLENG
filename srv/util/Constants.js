module.exports = Object.freeze({

    CDS_NAME:{
        EMPLOYEE_ELIGIBILITY_RULE:"EmployeeEligibilityRule",
        CHILD_ELIGIBILITY_RULE:"ChildEligibilityRules",
        SPOUSE_ELIGIBILITY_RULE:"SpouseEligibilityRules",
        CUST_HEALTHCARD_RULES_ELIGIBILITY:"cust_HealthCard_Rules_Eligibility ",
        PICK_LIST_OPTION: "PicklistOption",
        CUST_DEPENDENTS: "cust_Dependents",
        CUST_DEPENDENTS_DETAILS: "cust_DependentsDetails",
        CUST_SCHOOL_TRANSP_ALLOWANCE_RULES: "cust_SchoolTranspAllowance_Rules",
        EMP_PAY_COMP_NON_RECURRING: "EmpPayCompNonRecurring",
        EXECUTION_LOG: "ExecutionLog",
        FO_DEPARTMENT: "FODepartment",
        FO_JOB: "FOJobCode",
        HR_PERSONAL_AREA: "cust_HR_Personnel_Area",
        EMPLOYEE_GROUP: "cust_Employee_Group",
        EMP_COMPENSATION: "EmpCompensation",
        EMP_JOB: "EmpJob",
        CUST_HEALTHCARD_RULES:"cust_HealthCard_Rules",
        PER_PERSONAL: "PerPersonal",
        EMP_EMPLOYMENT : "EmpEmployment"
    },

    CDS_PROPERTY: {
        EMPLOYEE: "EmpJob",
        CHILD: "Child"
    },

    MDF_VALUES: {
        SYSTEM_RECORD_STATUS: "N",
        SYSTEM_RECORD_STATUS_ACTIVE: "A",
        FAMILIY_KEY: {
            SPOUSE: "1",
            CHILDREN: "2"
        },
        NAT: "Nat",
        NON_NAT: "NonNat",
        CURRENCY_CODE: "QAR",
        CUST_TYPE: {
            GROUP: "50015712",
            DEPARTMENT: "50015713"
        },
        OPERATION: {
            DELETE: "DELETE"
        }
    },

    RULE: {
        EC_FIELD_MAX_CHILD: "maxChild",
        CUST_ELIGIBILITY_TYPE: "children"
    },

    EMP_COMPENSATION: {
        EVENT: "5",
        EVENT_REASON: "02_99"
    },

    MESSAGE: {
        SCENARIO_1 : "Scenario 1 - Employee has the Pay Component in the with the same amount calculated"
    },

    DETAILS: {
        NO_RESULTS : "No Employees were found for selected filter criteria",
        VALID_PAY_COMPONENT: "Employee Pay Components value with same calculated Amount",
        NEW_PAY_COMPONENT: "New Pay Component",
        AMOUNT_CHANGE: "Amount Change",
        DELETION: "Deletion - Paid Incorrectly",
        NOT_ELIGIBLE: "Employee is not eligible",
        SCENARIO_1: "Employee has the Pay Component with the same amount calculated by the program",
        SCENARIO_2: "Employee has the Pay Component but with a different amount or number compared to the information calculated by the program",
        SCENARIO_3: "Employee do not have the Pay Component at all and it should be created",
        SCENARIO_4: "Updated on SFF - Employee has no Pay Component and no Compensation Portlet with valid startDate equal to Reference Date",
        ERROR: "There was an error executing the UPSERT on SF EC",
        SCENARIO_7_1: "Employee is not eligible",
        SCENARIO_7_2: "Employee eligible but the calculated amount is 0",
        SCENARIO_7_3: "Employee is not eligible or the calculated amount is 0 but there is an existing record for the Pay Component to be deleted"
    }
});