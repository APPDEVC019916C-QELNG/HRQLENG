namespace qelng.pc.hr.db;

using {
    cuid,
    managed
} from '@sap/cds/common';

entity PayComponents : cuid {
  name : String(300);
  code : String(50);
}

entity EmployeeEligibilityRule : cuid, managed {
  name              : String(255);
  target            : String(255);
  custNat           : String(10);
  custEligibility   : String(50);
  ecField           : String(50);
  payComponent      : String(50);
  targetEntityProp  : String;
  withPickList      : Boolean;
  withEmpEmployment : Boolean;
  isDate            : Boolean;
}

entity ChildEligibilityRules : cuid, managed {
  name               : String(255); // Name of the rule
  target             : String(255); // Target entity, fixed as "Child"
  custNat            : String(10); // Nationality (Nat, NonNat)
  custEligibility    : String(50); // Eligibility type (e.g., childBE23, child19_23)
  ecField            : String(50); // Criteria field (e.g., insideQatar, school)
  payComponent       : String(50); // Pay component associated with the rule
  targetEntityProp   : String(50); // Target field in the child's entity
  withPickList       : Boolean; // Flag for picklist validation
  withEmpEmployment  : Boolean; // Flag for employment-related data
  isDate             : Boolean; // Flag for date-based validation
  applicableAgeRange : String(20); // Applicable age range (e.g., <=19, 19-23, >23)
  gender             : String(5); // for which gender the rule is applicable
}

entity SpouseEligibilityRules : cuid, managed {
  name             : String(255); // Name of the rule
  target           : String(10); // Target entity, fixed as "Child"
  custNat          : String(10); // Nationality (Nat, NonNat)
  custEligibility  : String(50); // Eligibility type (e.g., childBE23, child19_23)
  ecField          : String(50); // Criteria field (e.g., insideQatar, school)
  payComponent     : String(50); // Pay component associated with the rule
  targetEntityProp : String(50); // Target field in the spouse's entity
  checkGender      : Boolean; // does rule need gender
  checkSpouseNat   : Boolean; // does rule need gender
}

entity ExecutionLog : cuid,managed {
    executionID : Integer;
    simulationMode : Boolean;
    employeeID : String;
    orgUnit : String;
    group : String;
    department : String;
    job : String;
    hRPersonnelArea : String;
    employeeGroup : String;
    payComponent : String;
    eligible : Boolean;
    referenceDate : Date;
    amount : Decimal(15, 2);
    numberOfUnits : Decimal(15, 2);
    toBeUpdated : Boolean;
    details : String; // New Pay Component / Amount Change / Deletion
    result : String; // Updated, Error, etc.
    errorDetails : String; // Optional field to store error details if any
}