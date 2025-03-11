sap.ui.define([
    "qa/com/qelng/pcui5/paycomponentsui5/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
],
    function (BaseController, JSONModel, MessageBox, Filter, FilterOperator, Fragment) {
        "use strict";
        let selectedDate = '';
        let oData = { healthCardForm: {} }
        return BaseController.extend("qa.com.qelng.pcui5.paycomponentsui5.controller.HealthCardForm", {
            onInit: function () {
                let oModel = new JSONModel(),
                    oInitialModelState = Object.assign({}, oData);
                oModel.setData(oInitialModelState);
                this.setModel(oModel);
                let years = [];
                for (let year = 2024; year <= 2100; year++) {
                    years.push({ year: year });
                }
                oModel.setProperty("/healthCardForm/year", years);
                let pcModel = this.getOwnerComponent().getModel("pcModel");
                pcModel.setSizeLimit(50000);
            },
            onAfterRendering: function () {
                let oView = this.getView();
                let oModel = oView.getModel();
                this.defaultHealthCardFormBinding(oModel);
                this.byId("healthCardForm").bindElement("/healthCardForm");
            },
            defaultHealthCardFormBinding() {
                this.clearListSelection();
                let oModel = this.getView().getModel();
                oModel.setProperty("/healthCardForm/payComponent", '');
                oModel.setProperty("/healthCardForm/referenceYear", '');
                oModel.setProperty("/healthCardForm/userId", '');
                oModel.setProperty("/healthCardForm/organizationalUnit", '');
                oModel.setProperty("/healthCardForm/group", '');
                oModel.setProperty("/healthCardForm/department", '');
                oModel.setProperty("/healthCardForm/job", '');
                oModel.setProperty("/healthCardForm/hrPersonnelArea", '');
                oModel.setProperty("/healthCardForm/employeeGroup", '');
                oModel.setProperty("/healthCardForm/simulationMode", false);
                oModel.setProperty("/healthCardForm/adminEmail", '');

            },
            resetOnRefYearChange: function () {
                this.clearListSelection();
                let oModel = this.getView().getModel();
                oModel.setProperty("/healthCardForm/userId", '');
                oModel.setProperty("/healthCardForm/organizationalUnit", '');
                oModel.setProperty("/healthCardForm/group", '');
                oModel.setProperty("/healthCardForm/department", '');
                oModel.setProperty("/healthCardForm/job", '');
                oModel.setProperty("/healthCardForm/hrPersonnelArea", '');
                oModel.setProperty("/healthCardForm/employeeGroup", '');
                oModel.setProperty("/healthCardForm/simulationMode", false);
                oModel.setProperty("/healthCardForm/adminEmail", '');
            },

            clearListSelection: function () {
                let selectedValue = this.getView().getModel().getData().healthCardForm;
                if (selectedValue.department) {
                    this.byId("departmentList").clearSelection();
                }
                if (selectedValue.job) {
                    this.byId("jobList").clearSelection();
                }
                if (selectedValue.group) {
                    this.byId("groupList").clearSelection();
                }
                if (selectedValue.organizationalUnit) {
                    this.byId("orgUnitList").clearSelection();
                }
                if (selectedValue.hrPersonnelArea) {
                    this.byId("hrPersonnelAreaList").clearSelection();
                }
                if (selectedValue.employeeGroup) {
                    this.byId("employeeGroupList").clearSelection();
                }
            },
            handleRefYearChange: function (oEvent) {
                this.resetOnRefYearChange()
                let refrenceYear = oEvent.getSource().getSelectedKey();
                selectedDate = refrenceYear + '-01-01';
            },
            oFilter: function () {
                return new Filter({
                    filters: [
                        new Filter("startDate", FilterOperator.LE, selectedDate),
                        new Filter("endDate", FilterOperator.GE, selectedDate)
                    ],
                    and: true
                });
            },

            oFilterSecond: function () {
                return new Filter({
                    filters: [
                        new Filter("effectiveStartDate", FilterOperator.LE, selectedDate),
                        new Filter("mdfSystemEffectiveEndDate", FilterOperator.GE, selectedDate)
                    ],
                    and: true
                });
            },

            onValueHelpDialogConfirm: function (oEvent) {
                let oSelectedItem = oEvent.getParameter("selectedItems");
                let id = '';
                if (oEvent.getSource().getId().includes("orgUnitList")) {
                    id = "orgUnitInput";
                }
                else if (oEvent.getSource().getId().includes("jobList")) {
                    id = "jobInput";
                }
                else if (oEvent.getSource().getId().includes("groupList")) {
                    id = "groupInput";
                }
                else if (oEvent.getSource().getId().includes("departmentList")) {
                    id = "departmentInput";
                }
                else if (oEvent.getSource().getId().includes("hrPersonnelAreaList")) {
                    id = "hrPersonnelAreaInput";
                }
                else if (oEvent.getSource().getId().includes("employeeGroupList")) {
                    id = "employeeGroupInput";
                }
                let oInput = this.byId(id);

                if (!oSelectedItem) {
                    oInput.resetProperty("value");
                    return;
                }
                let value = [];
                for (let i = 0; i < oSelectedItem.length; i++) {
                    value.push(oSelectedItem[i].getTitle())
                }
                oInput.setValue(value.toString());
            },

            orgUnitValueHelp: function () {
                let oView = this.getView();
                if (!this.orgUnitHelpDialog) {
                    this.orgUnitHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "qa.com.qelng.pcui5.paycomponentsui5.view.orgUnitValueHelp",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                }
                this.orgUnitHelpDialog.then(function (oDialog) {
                    if (selectedDate == '') {
                        MessageBox.warning(this.getResourceBundle().getText("selectReferenceYear"))
                    }
                    else {
                        let oOrganizationalUnitBinding = this.byId("orgUnitList").getBinding("items");
                        oOrganizationalUnitBinding.filter(this.oFilter());
                        oDialog.open();
                    }
                }.bind(this));
            },


            jobValueHelp: function () {
                let oView = this.getView();
                if (!this._jobValueHelpDialog) {
                    this._jobValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "qa.com.qelng.pcui5.paycomponentsui5.view.jobValueHelp",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                }
                this._jobValueHelpDialog.then(function (oDialog) {
                    if (selectedDate == '') {
                        MessageBox.warning(this.getResourceBundle().getText("selectReferenceYear"))
                    }
                    else {
                        let ojobListBinding = this.byId("jobList").getBinding("items");
                        ojobListBinding.filter(this.oFilter());
                        oDialog.open();
                    }
                }.bind(this));
            },

            groupValueHelp: function () {
                let oView = this.getView();
                if (!this._groupHelpDialog) {
                    this._groupHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "qa.com.qelng.pcui5.paycomponentsui5.view.groupValueHelp",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                }
                this._groupHelpDialog.then(function (oDialog) {
                    if (selectedDate == '') {
                        MessageBox.warning(this.getResourceBundle().getText("selectReferenceYear"))
                    }
                    else {
                        let oGroupListBinding = this.byId("groupList").getBinding("items");
                        oGroupListBinding.filter(this.oFilter());
                        oDialog.open();
                    }
                }.bind(this));
            },

            departmentValueHelp: function () {
                let oView = this.getView();
                if (!this._departmentHelpDialog) {
                    this._departmentHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "qa.com.qelng.pcui5.paycomponentsui5.view.departmentValueHelp",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                }
                this._departmentHelpDialog.then(function (oDialog) {
                    if (selectedDate == '') {
                        MessageBox.warning(this.getResourceBundle().getText("selectReferenceYear"))
                    }
                    else {
                        let oDepartmentListBinding = this.byId("departmentList").getBinding("items");
                        oDepartmentListBinding.filter(this.oFilter());
                        oDialog.open();
                    }
                }.bind(this));
            },

            hrPersonnelAreaValueHelp: function () {
                let oView = this.getView();
                if (!this._hrPersonnelAreaValueHelpDialog) {
                    this._hrPersonnelAreaValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "qa.com.qelng.pcui5.paycomponentsui5.view.hrPersonnelAreaValueHelp",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                }
                this._hrPersonnelAreaValueHelpDialog.then(function (oDialog) {
                    if (selectedDate == '') {
                        MessageBox.warning(this.getResourceBundle().getText("selectReferenceYear"))
                    }
                    else {
                        let ohrPersonnelAreaListBinding = this.byId("hrPersonnelAreaList").getBinding("items");
                        ohrPersonnelAreaListBinding.filter(this.oFilterSecond());
                        oDialog.open();
                    }
                }.bind(this));
            },

            employeeGroupValueHelp: function () {
                let oView = this.getView();
                if (!this._employeeGroupValueHelpDialog) {
                    this._employeeGroupValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "qa.com.qelng.pcui5.paycomponentsui5.view.employeeGroupValueHelp",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                }
                this._employeeGroupValueHelpDialog.then(function (oDialog) {
                    if (selectedDate == '') {
                        MessageBox.warning(this.getResourceBundle().getText("selectReferenceYear"))
                    }
                    else {
                        let oEmployeeGroupListListBinding = this.byId("employeeGroupList").getBinding("items");
                        oEmployeeGroupListListBinding.filter(this.oFilterSecond());
                        oDialog.open();
                    }
                }.bind(this));
            },
            onExecute: function () {
                let selectedValue = this.getView().getModel().getData().healthCardForm;
                if (!this.validateEmail(this.splitFunction(selectedValue.adminEmail))) {
                    MessageBox.error(this.getResourceBundle().getText("correctEmail"));
                    return;
                }
                else if (!this.onSubmitCheck()) {
                    let oAction = this.getModel("pcModel").bindContext("/executeCompHRCalculation(...)");
                    oAction.setParameter("payComponent", this.convertPcToObject(selectedValue.payComponent));
                    oAction.setParameter("referenceYear", parseInt(selectedValue.referenceYear));
                    oAction.setParameter("userIds", this.splitFunction(selectedValue.userId));
                    oAction.setParameter("foJobs", this.convertToJobsObject(selectedValue.job));
                    oAction.setParameter("departments", this.convertToDepartmentsObject(selectedValue.department));
                    oAction.setParameter("groups", this.convertToDepartmentsObject(selectedValue.group));
                    oAction.setParameter("orgUnits", this.convertToOrgUnitsObject(selectedValue.organizationalUnit));
                    oAction.setParameter("HRPersonnelArea", this.convertToHrPObject(selectedValue.hrPersonnelArea));
                    oAction.setParameter("custEmployeeGroup", this.convertToHrPObject(selectedValue.employeeGroup));
                    oAction.setParameter("emails", this.splitFunction(selectedValue.adminEmail));
                    oAction.setParameter("simulationMode", selectedValue.simulationMode);

                    oAction.execute().then(function () {
                        let oActionContext = oAction.getBoundContext();
                        MessageBox.success(oActionContext.getObject().value);
                        this.defaultHealthCardFormBinding();
                    }.bind(this), function (oError) {
                        MessageBox.error(oError.message);
                    }.bind(this)).then(function () {

                    }.bind(this));
                }
                else {
                    MessageBox.error(this.getResourceBundle().getText("mandatoryFields"));
                }
            },

            convertPcToObject: function (string) {
                const parts = string.split('_#');
                const result = { ID: parts[0], name: parts[1], code: parts[2] };
                return result;
            },
            splitFunction: function (string) {
                if (string == "") {
                    return [];
                }
                else {
                    return string.split(',').map(str => str.trim()).filter(str => str !== '');
                }
            },
            convertToJobsObject: function (string) {
                if (string == "") {
                    return [];
                }
                else {
                    const result = string.split(',').map(item => {
                        const match = item.match(/(.*) \((\w+)\)$/);
                        return {
                            externalCode: match[2],
                            cust_name_defaultValue: match[1]
                        };
                    });
                    return result;
                }
            },

            convertToDepartmentsObject: function (string) {
                if (string == "") {
                    return [];
                }
                else {
                    const result = string.split(',').map(item => {
                        const match = item.match(/(.*) \((\w+)\)$/);
                        return {
                            externalCode: match[2],
                            name_defaultValue: match[1]
                        };
                    });
                    return result;
                }
            },
            convertToOrgUnitsObject: function (string) {
                if (string == "") {
                    return [];
                }
                else {
                    const result = string.split(',').map(item => {
                        const match = item.match(/(.*) \((\w+)\)$/);
                        return {
                            externalCode: match[2],
                            name_defaultValue: match[1]
                        };
                    });
                    return result;
                }
            },
            convertToHrPObject: function (string) {
                if (string == "") {
                    return [];
                }
                else {
                    const result = string.split(',').map(item => {
                        const match = item.match(/(.*) \((\w+)\)$/);
                        return {
                            externalCode: match[2],
                            externalName: match[1]
                        };
                    });
                    return result;
                }
            },

            validateEmail: function (emailArray) {
                if (emailArray) {
                    const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,11})+$/;
                    return emailArray.every(email => emailPattern.test(email));
                }
                else {
                    return true;
                }
            },
            onSearch: function (oEvent){
                let sValue = oEvent.getParameter("value");
                let idCheck=oEvent.getSource().getId();
                let value;
                if(idCheck.includes("orgUnitList") || idCheck.includes("groupList") || idCheck.includes("departmentList")){
                    value="name_defaultValue";
                }
                else if(idCheck.includes("jobList")){
                    value="cust_name_defaultValue";
                }
                else if(idCheck.includes("hrPersonnelAreaList") || idCheck.includes("employeeGroupList")){
                    value="externalName";
                }
                let oFilter = new Filter({path:value, operator:FilterOperator.Contains, value1:sValue, caseSensitive:false});
                let oBinding = oEvent.getParameter("itemsBinding");
                oBinding.filter([oFilter]);
            },
            onSubmitCheck: function () {
                let pcID = this.byId("pcSelect"), refYearID = this.byId("referenceYearSelect");
                let sError = false;
                if (pcID.getValue().length < 1) {
                    pcID.setValueState("Error");
                    pcID.setValueStateText(this.getResourceBundle().getText("cannotBeEmpty"));
                    sError = true;
                }
                else {
                    pcID.setValueState("None");
                    sError = false;
                }
                if (refYearID.getValue().length < 1) {
                    refYearID.setValueState("Error");
                    refYearID.setValueStateText(this.getResourceBundle().getText("cannotBeEmpty"));
                    sError = true;
                }
                else {
                    refYearID.setValueState("None");
                    sError = false;
                }
                return sError;
            },
            onPressExecLogs: function () {
                this.getModel("pcModel").refresh();
                this.getRouter().navTo("RouteExecutionLogs");
            }
        });
    });