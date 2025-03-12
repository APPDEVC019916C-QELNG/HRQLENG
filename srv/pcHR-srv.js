const cds = require('@sap/cds');
const EmployeeJobHandler = require('./handlers/EmployeeJobHandler');
const EligibilityRules = require('./rules/EligibilityRules');
const DependentsHandler = require('./handlers/DependentsHandler');
const ExecutionLogHandler = require('./handlers/ExecutionLogHandler');
//const AmountCalculatorHandler = require('./handlers/AmountCalculatorHandler');
const Bottleneck = require("bottleneck");
const EventEmitter = require("events");
const HttpClient = require('./integration/HttpClient');
const PayComponentRules = require('./rules/PayComponentRules');
const SfecIntegration = require('./integration/SF_EC_Integration');




module.exports = cds.service.impl(async function () {
    // CDS Entities //
    const { OrgUnit, OrgUnitGroup, Department, FoJob, HRPersonnelArea, CustEmployeeGroup, ExecutionLog } = this.entities;

    // Success Factors API connection //
    const sf_foDep = await cds.connect.to('FODepartment');
    const sf_foJob = await cds.connect.to('FOJobCode');
    const sf_hrArea = await cds.connect.to('cust_HR_Personnel_Area');
    const sf_empGrp = await cds.connect.to('cust_Employee_Group');
    const st_picklist = await cds.connect.to('PicklistOption');
    const st_perPerson = await cds.connect.to('PerPersonal');
    const st_healthCardRules = await cds.connect.to('cust_HealthCard_Rules');
    const st_EmpEmployment = await cds.connect.to('EmpEmployment');




    // Global Classes //
    EventEmitter.defaultMaxListeners = 20; // Increase limit globally
    const bottleneck = new Bottleneck({ minTime: 10, maxConcurrent: 500, });

    const executionLogHandler = new ExecutionLogHandler(this, sf_foDep, sf_foJob, sf_hrArea, sf_empGrp);
    const employeeJobHandler = new EmployeeJobHandler(this, st_perPerson, st_picklist, st_healthCardRules, st_EmpEmployment, bottleneck, executionLogHandler);
    const eligibilityRules = new EligibilityRules(this, st_picklist, bottleneck, executionLogHandler);

    const payComponentRules = new PayComponentRules();
    const sfecIntegration = new SfecIntegration();



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

        return `Health Card Allowance Generation Executed with ID: ${sExecutionID}`;
    });

    _executeProcess = async (oRequest, sExecutionID) => {
        console.log("---- test start ----")

        // Get Employee Data from UI Filter Criteria //
        const sQuery = await employeeJobHandler.getFilteredEmployeeListQuery(oRequest);

        const referenceDate = _getReferenceDate(oRequest.referenceDate);

        const sPayCompCode = oRequest.payComponent.code;

        let aFilteredEmployeeList = [];

        const httpClient = new HttpClient();
        aFilteredEmployeeList = await httpClient.getEmpJob(sQuery, referenceDate);

        console.log("Filtered Employee List length " + aFilteredEmployeeList.length);
        const start = Date.now();

        if (aFilteredEmployeeList && aFilteredEmployeeList.length) {


            const aEligibleEmployeeRes = await eligibilityRules.getEligibleEmployeeList(aFilteredEmployeeList, referenceDate, sExecutionID, sPayCompCode, oRequest.simulationMode);

            console.log("Eligible Employee List length " + aEligibleEmployeeRes.length);
            console.log(`ELIG QUERY Time: ${Date.now() - start}ms`);

            if (aEligibleEmployeeRes && aEligibleEmployeeRes.length) {

                //Miguel does this make sense ?
                const custNat = _determineCustNationality(sPayCompCode);

                const elegibleList = await employeeJobHandler.processEligibleEmployees(aEligibleEmployeeRes, referenceDate, custNat);

                //UN COMMENT
                //console.log("A Processed Allowance length " + elegibleList.length);
                //console.log(`ALLOWANCE Time: ${Date.now() - start}ms`);

                //processWinner(elegibleList,referenceDate, oRequest.simulationMode, sPayCompCode, sExecutionID);
            }else {
                executionLogHandler.createExecutionLogSingleEntry(null, oRequest.referenceDate, sExecutionID, oRequest.simulationMode, [{ message: "No Employees were found for selected filter criteria" }],null, null, false, null, sPayCompCode);
            }
        } 
    };


    processWinner = async (winners, referenceDate, simulationMode, payCompCode, sExecutionID)  => {
        for (const oEmployee of winners) {
            // Assuming iAmount is being calculated or retrieved from somewhere
            const iAmount = parseFloat(oEmployee.amount);  // Replace with actual logic to calculate amount

            console.log("Total Amount: " + iAmount);
            console.log("Total Count (numberOfUnits): " + oEmployee.count);

            if(iAmount === 0){
               await payComponentRules.checkEmployeePayComponents(oEmployee, referenceDate);
                return;
            }

            const aPayComponents = await payComponentRules._getEmployeePayComponents(oEmployee.empJob, referenceDate, false, payCompCode);
            console.log("---- test end ----")
            return;
            await sfecIntegration.runSfEcUpdate(oEmployee, iAmount, referenceDate, aPayComponents, simulationMode, payCompCode);
            await executionLogHandler.createExecutionLogSingleEntry(oEmployee.empJob, referenceDate, sExecutionID, simulationMode, [{ message: `No Dependents are eligible for Employee ${oEmployee.empJob.userId}, date ${referenceDate}` }], true, iAmount, null, null, payCompCode);
            console.log("----- end ---- ")

        }
    };



    


    _determineCustNationality = (sPayCompCode) => {
        return sPayCompCode.toLowerCase() === "3125" ? "NonNat" : "Nat";
    };

    _getReferenceDate = (sDate) => {
        const referenceDate = new Date(sDate);
        const year = referenceDate.getFullYear();
        const firstOfJanuary = `${year}-01-01`;

        return firstOfJanuary;
    };

});