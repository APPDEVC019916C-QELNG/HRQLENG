const cruder = require('../util/Cruder');
const constant = require('../util/Constants');

class ExecutionLogHandler {
    constructor(service, sf_foDep, sf_foJob, sf_hrArea, sf_empGrp) {
        this.service = service;

        this.sf_foDep_conn = sf_foDep;
        this.sf_foJob_conn = sf_foJob;
        this.sf_hrArea_conn = sf_hrArea;
        this.sf_empGrp_conn = sf_empGrp;

        this.cruder = new cruder(service);
    }

    getExecutionLogID = () => {
        return new Promise(resolve => {
            this.cruder.readOne(constant.CDS_NAME.EXECUTION_LOG, null, null, [['executionID', 'desc']], "executionID").then(oLastLog => {
                resolve(!!oLastLog ? oLastLog.executionID + 1 : 1);
            })
        });
    }

    createExecutionLogSingleEntry = async (oEmployee, sReferenceDate, sExecutionID, bSimulationMode, aErrorMessages, bEligible, iAmount, bToUpdate, sDetails, sPayCompCode) => {
        await this._createLogEntry(await this._buildPayload(oEmployee, sReferenceDate, sExecutionID, bSimulationMode, aErrorMessages, bEligible, iAmount, bToUpdate, sDetails, sPayCompCode));
    }

    _buildPayload = async (oEmployee, sReferenceDate, sExecutionID, bSimulationMode, aErrorMessages, bEligible, iAmount, bToUpdate, sDetails, sPayCompCode) => {
        return {
            "executionID": sExecutionID,
            "simulationMode": bSimulationMode,
            "employeeID": oEmployee ? oEmployee.userId : null,
            "orgUnit": oEmployee && oEmployee.department ? await this._getOrgUnit(oEmployee.department) : null,
            "group": oEmployee && oEmployee.customString2 ? await this._getGroup(oEmployee.customString2) : null,
            "department": oEmployee && oEmployee.customString3 ? await this._getDepartment(oEmployee.customString3) : null,
            "job": oEmployee && oEmployee.jobCode ? await this._getJob(oEmployee.jobCode) : null,
            "hRPersonnelArea": oEmployee && oEmployee.customString8 ? await this._getHrArea(oEmployee.customString8) : null,
            "employeeGroup": oEmployee && oEmployee.customString10 ? await this._getEmpGroup(oEmployee.customString10) : null,
            "payComponent": sPayCompCode,
            "eligible": bEligible,
            "referenceDate": sReferenceDate,
            "amount": iAmount,
            "toBeUpdated": bToUpdate,
            "details": sDetails,
            "result": bSimulationMode && bToUpdate ? (aErrorMessages && aErrorMessages.map(msg => msg.message).length > 0 ? "Error" : "Updated") : null,
            "errorDetails": aErrorMessages ? aErrorMessages.map(msg => msg.message).join(" | ") : null
        }
    }

    _createLogEntry = (oPayload) => {
        return new Promise(resolve => {
            this.cruder.create(constant.CDS_NAME.EXECUTION_LOG, oPayload).then(oLog => {
                resolve(oLog);
            })
        });
    }

    _getOrgUnit = (sExternalCode) => {
        return new Promise(async resolve => {
            this.sf_foDep_conn.run(SELECT.one.from(constant.CDS_NAME.FO_DEPARTMENT).where({ "externalCode": sExternalCode, "status": constant.MDF_VALUES.SYSTEM_RECORD_STATUS_ACTIVE })).then(oOrg => {
                resolve(oOrg ? oOrg.name_defaultValue : null);
            })
        })
    }

    _getGroup = (sExternalCode) => {
        return new Promise(async resolve => {
            this.sf_foDep_conn.run(SELECT.one.from(constant.CDS_NAME.FO_DEPARTMENT).where({ "externalCode": sExternalCode, "status": constant.MDF_VALUES.SYSTEM_RECORD_STATUS_ACTIVE, "cust_Type": constant.MDF_VALUES.CUST_TYPE.GROUP })).then(oGrp => {
                resolve(oGrp ? oGrp.name_defaultValue : null);
            })
        })
    }

    _getDepartment = (sExternalCode) => {
        return new Promise(async resolve => {
            this.sf_foDep_conn.run(SELECT.one.from(constant.CDS_NAME.FO_DEPARTMENT).where({ "externalCode": sExternalCode, "status": constant.MDF_VALUES.SYSTEM_RECORD_STATUS_ACTIVE, "cust_Type": constant.MDF_VALUES.CUST_TYPE.DEPARTMENT })).then(oDep => {
                resolve(oDep ? oDep.name_defaultValue : null);
            })
        })
    }

    _getJob = (sExternalCode) => {
        return new Promise(async resolve => {
            this.sf_foJob_conn.run(SELECT.one.from(constant.CDS_NAME.FO_JOB).where({ "externalCode": sExternalCode, "status": constant.MDF_VALUES.SYSTEM_RECORD_STATUS_ACTIVE, "cust_name_defaultValue": { "!=": null } })).then(oJob => {
                resolve(oJob ? oJob.cust_name_defaultValue : null);
            })
        })
    }

    _getHrArea = (sExternalCode) => {
        return new Promise(async resolve => {
            this.sf_hrArea_conn.run(SELECT.one.from(constant.CDS_NAME.HR_PERSONAL_AREA).where({ "externalCode": sExternalCode, "mdfSystemStatus": constant.MDF_VALUES.SYSTEM_RECORD_STATUS_ACTIVE })).then(oHR => {
                resolve(oHR ? oHR.externalName : null);
            })
        })
    }

    _getEmpGroup = (sExternalCode) => {
        return new Promise(async resolve => {
            this.sf_empGrp_conn.run(SELECT.one.from(constant.CDS_NAME.EMPLOYEE_GROUP).where({ "externalCode": sExternalCode, "mdfSystemStatus": constant.MDF_VALUES.SYSTEM_RECORD_STATUS_ACTIVE })).then(oEmpGrp => {
                resolve(oEmpGrp ? oEmpGrp.externalName : null);
            })
        })
    }

}

module.exports = ExecutionLogHandler;