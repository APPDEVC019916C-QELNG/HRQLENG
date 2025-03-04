const cds = require('@sap/cds');
const EmployeeJobHandler = require('./handlers/EmployeeJobHandler');
const EligibilityRules = require('./rules/EligibilityRules');
const DependentsHandler = require('./handlers/DependentsHandler');
const ExecutionLogHandler = require('./handlers/ExecutionLogHandler');
const Bottleneck = require("bottleneck");
const EventEmitter = require("events");
const HttpClient = require('./integration/HttpClient');

module.exports = cds.service.impl(async function () {
    // CDS Entities //
    const { OrgUnit, OrgUnitGroup, Department, FoJob, HRPersonnelArea, CustEmployeeGroup, ExecutionLog } = this.entities;

    // Success Factors API connection //
    const sf_foDep = await cds.connect.to('FODepartment');
    const sf_foJob = await cds.connect.to('FOJobCode');
    const sf_hrArea = await cds.connect.to('cust_HR_Personnel_Area');
    const sf_empGrp = await cds.connect.to('cust_Employee_Group');
    const st_picklist = await cds.connect.to('PicklistOption');

    // Global Classes //
    EventEmitter.defaultMaxListeners = 20; // Increase limit globally
    const bottleneck = new Bottleneck({ minTime: 10, maxConcurrent: 500, });

    const employeeJobHandler = new EmployeeJobHandler();
    const executionLogHandler = new ExecutionLogHandler(this, sf_foDep, sf_foJob, sf_hrArea, sf_empGrp);
    const eligibilityRules = new EligibilityRules(this, st_picklist, bottleneck, executionLogHandler);
    const dependentsHandler = new DependentsHandler(this, st_picklist, bottleneck, executionLogHandler);

    // Success Factors API Handlers //
    this.on("READ", OrgUnit, async req => {
        return await sf_foDep.tx(req).run(req.query);
    });

    this.on("READ", OrgUnitGroup, async req => {
        return await sf_foDep.tx(req).run(req.query);
    });

    this.on("READ", Department, async req => {
        return await sf_foDep.tx(req).run(req.query);
    });

    this.on("READ", FoJob, async req => {
        return await sf_foJob.tx(req).run(req.query);
    });

    this.on("READ", HRPersonnelArea, async req => {
        return await sf_hrArea.tx(req).run(req.query);
    });

    this.on("READ", CustEmployeeGroup, async req => {
        return await sf_empGrp.tx(req).run(req.query);
    });

    this.on("READ", ExecutionLog, async req => {
        const aLatestExecutionIds = (await SELECT.from(ExecutionLog).columns("executionID").groupBy("executionID").orderBy({ "executionID": "desc" }).limit(5)).map(row => row.executionID);
        return await SELECT.from(ExecutionLog).where({ executionID: { in: aLatestExecutionIds } });
    });

    // Actions //
    this.on("executeCompHRCalculation", async req => {
        // Get Execution ID from last Log entry //
        let sExecutionID = await executionLogHandler.getExecutionLogID();

        _executeProcess(req.data, sExecutionID);

        return `School Transportation Allowance Generation Executed with ID: ${sExecutionID}`;
    });

    _executeProcess = async (oRequest, sExecutionID) => {
        // Get Employee Data from UI Filter Criteria //
        const sQuery = await employeeJobHandler.getFilteredEmployeeListQuery(oRequest);

        let aFilteredEmployeeList = [];

        const httpClient = new HttpClient();
        aFilteredEmployeeList = await httpClient.getEmpJob(sQuery, oRequest.referenceDate);

        console.log("Filtered Employee List length " + aFilteredEmployeeList.length);
        const start = Date.now();

        if (aFilteredEmployeeList && aFilteredEmployeeList.length) {
            const aEligibleEmployeeRes = await eligibilityRules.getEligibleEmployeeList(aFilteredEmployeeList, oRequest.referenceDate, sExecutionID, oRequest.simulationMode);

            console.log("Eligible Employee List length " + aEligibleEmployeeRes.length);
            console.log(`ELIG QUERY Time: ${Date.now() - start}ms`);

            if (aEligibleEmployeeRes && aEligibleEmployeeRes.length) {
                const aProcessedAllowance = await dependentsHandler.processEmployeeDependentsAllowance(aEligibleEmployeeRes, oRequest.referenceDate, sExecutionID, oRequest.simulationMode);

                console.log("A Processed Allowance length " + aProcessedAllowance.length);
                console.log(`ALLOWANCE Time: ${Date.now() - start}ms`);

            }
        } else {
            executionLogHandler.createExecutionLogSingleEntry(null, oRequest.referenceDate, sExecutionID, oRequest.simulationMode, [{ message: "No Employees were found for selected filter criteria" }]);
        }
    }

});