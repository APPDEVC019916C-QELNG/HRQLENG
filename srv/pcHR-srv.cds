using {qelng.pc.hr.db as db} from '../db/schema';
using {FODepartment as external} from './external/FODepartment';
using {FOJobCode as externalFOJob} from './external/FOJobCode';
using {cust_HR_Personnel_Area as externalHR} from './external/cust_HR_Personnel_Area';
using {cust_Employee_Group as externalEmpGroup} from './external/cust_Employee_Group';

service pcHRsrv {
    entity EmployeeEligibilityRule as projection on db.EmployeeEligibilityRule;
    entity ChildEligibilityRules as projection on db.ChildEligibilityRules;
    entity SpouseEligibilityRules as projection on db.SpouseEligibilityRules;
    entity PayComponents as projection on db.PayComponents;

    entity ExecutionLog as projection on db.ExecutionLog;
    entity AllExecutionLog as projection on db.ExecutionLog;

    action executeCompHRCalculation(userIds : array of String,
                              foJobs : array of FoJob,
                              departments : array of Department,
                              groups : array of OrgUnitGroup,
                              orgUnits : array of OrgUnit,
                              hrPersonnelAreas : array of HRPersonnelArea,
                              simulationMode : Boolean,
                              emails : array of String,
                              referenceDate : Date,
                              payComponent: PayComponents,
                              custEmployeeGroups : CustEmployeeGroup) returns String;


    @cds.persistence: {
        table,
        skip: true
    }
    @cds.autoexpose
    entity OrgUnit                 as
        projection on external.FODepartment {
                @readonly
            key externalCode,
                @readonly
            key name_defaultValue,
                @readonly
                startDate,
                @readonly
                endDate
        }
        where
            FODepartment.status = 'A';


    @cds.persistence: {
        table,
        skip: true
    }
    @cds.autoexpose
    entity OrgUnitGroup            as
        projection on external.FODepartment {
                @readonly
            key name_defaultValue,
                @readonly
            key externalCode,
                @readonly
                startDate,
                @readonly
                endDate
        }
        where
                FODepartment.status    = 'A'
            and FODepartment.cust_Type = '50015712';


    @cds.persistence: {
        table,
        skip: true
    }
    @cds.autoexpose
    entity Department              as
        projection on external.FODepartment {
                @readonly
            key name_defaultValue,
                @readonly
            key externalCode,
                @readonly
                startDate,
                @readonly
                endDate,

        }
        where
                FODepartment.status    = 'A'
            and FODepartment.cust_Type = '50015713';

    @cds.persistence: {
        table,
        skip: true
    }
    @cds.autoexpose
    entity FoJob                   as
        projection on externalFOJob.FOJobCode {
                @readonly
            key externalCode,
                @readonly
            key cust_name_defaultValue,
                @readonly
                startDate,
                @readonly
                endDate

        }
        where
                FOJobCode.status                 =  'A'
            and FOJobCode.cust_name_defaultValue != null;

    @cds.persistence: {
        table,
        skip: true
    }
    @cds.autoexpose
    entity HRPersonnelArea         as
        projection on externalHR.cust_HR_Personnel_Area {
                @readonly
            key externalCode,
                @readonly
            key externalName,
                @readonly
                effectiveStartDate,
                @readonly
                mdfSystemEffectiveEndDate
        }
        where
            cust_HR_Personnel_Area.mdfSystemStatus = 'A';

    @cds.persistence: {
        table,
        skip: true
    }
    @cds.autoexpose
    entity CustEmployeeGroup       as
        projection on externalEmpGroup.cust_Employee_Group {
                @readonly
            key externalCode,
                @readonly
            key externalName,
                @readonly
                effectiveStartDate,
                @readonly
                mdfSystemEffectiveEndDate
        }
        where
            cust_Employee_Group.mdfSystemStatus = 'A';

}