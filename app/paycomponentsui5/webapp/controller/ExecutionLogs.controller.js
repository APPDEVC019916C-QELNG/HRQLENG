sap.ui.define([
	'qa/com/qelng/pcui5/paycomponentsui5/controller/BaseController',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/export/library',
	'sap/ui/export/Spreadsheet',
	'sap/m/MessageToast'
], function (BaseController, Filter, FilterOperator, exportLibrary, Spreadsheet, MessageToast) {
	"use strict";

	let EdmType = exportLibrary.EdmType;
	return BaseController.extend("qa.com.qelng.pcui5.paycomponentsui5.controller.ExecutionLogs", {
		onInit: function () {

		},
		onSearch: function () {
			let oBinding = this.byId("resultPerEmpTable").getBinding("items"),
				inputValue = this.byId("searchInput").getValue(),
				oFilter = new Filter("employeeID", FilterOperator.Contains, inputValue);
			if (inputValue == "") {
				oBinding.filter([]);
			}
			else {
				oBinding.filter(oFilter);
			}
		},
		getText: function (text) {
			return this.getResourceBundle().getText(text);
		},

		createColumnConfig: function () {
			let aCols = [];

			aCols.push({
				label: this.getText("IDExecution"),
				property: 'executionID',
				type: EdmType.Integer
			});

			aCols.push({
				label: this.getText("timeStamp"),
				property: 'createdAt',
				type: EdmType.DateTime
			});

			aCols.push({
				label: this.getText("simulationMode"),
				property: 'simulationMode',
				type: EdmType.Boolean,
				trueValue: 'X',
				falseValue: ''
			});

			aCols.push({
				label: this.getText("userID"),
				property: 'employeeID',
				type: EdmType.String
			});

			aCols.push({
				label: this.getText("organizationalUnit"),
				property: 'orgUnit',
				type: EdmType.String
			});

			aCols.push({
				label: this.getText("group"),
				property: 'group',
				type: EdmType.String
			});

			aCols.push({
				label: this.getText("department"),
				property: 'department',
				type: EdmType.String
			});

			aCols.push({
				label: this.getText("job"),
				property: 'job',
				type: EdmType.String
			});

			aCols.push({
				label: this.getText("hRPersonnelArea"),
				property: 'hRPersonnelArea',
				type: EdmType.String
			});

			aCols.push({
				label: this.getText("employeeGroup"),
				property: 'employeeGroup',
				type: EdmType.String
			});

			aCols.push({
				label: this.getText("payComponent"),
				property: 'payComponent',
				type: EdmType.String
			});

			aCols.push({
				label: this.getText("eligible"),
				property: 'eligible',
				type: EdmType.Boolean
			});

			aCols.push({
				label: this.getText("referenceDate"),
				property: 'referenceDate',
				type: EdmType.String
			});

			aCols.push({
				label: this.getText("amount"),
				property: 'amount',
				type: EdmType.Decimal
			});

			aCols.push({
				label: this.getText("toBeUpdated"),
				property: 'toBeUpdated',
				type: EdmType.Boolean
			});

			aCols.push({
				label: this.getText("details"),
				property: 'details',
				type: EdmType.String
			});

			return aCols;
		},

		onDownload: function (oEvent) {
			let aCols, oBinding, oSettings, oSheet, flag = true;
			let executionId = oEvent.getSource().getBindingContext("pcModel").getProperty("executionID");
			oBinding = this.byId("resultPerEmpTable").getBinding("items").filter(new Filter("executionID", FilterOperator.EQ, executionId));
			aCols = this.createColumnConfig();

			oSettings = {
				workbook: { columns: aCols },
				dataSource: oBinding,
				fileName: this.getText("IDExecution") + " " + executionId + ".xlsx"
			};
			oBinding.attachDataReceived(function () {
				if (flag) {
					oSheet = new Spreadsheet(oSettings);
					oSheet.build()
						.then(function () {
							flag = false;
							this.onSearch();
							MessageToast.show(this.getText("downloadCompleted"));

						}.bind(this), function (oError) {

						}.bind(this)).finally(function () {
							oSheet.destroy();

						}.bind(this))
				}
			}.bind(this)
			)

		},
		dateFormat: function (dateTime) {
			let oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "dd/MM/yyyy"
			});

			return oDateFormat.format(new Date(dateTime))
		},
		onRefreshPress: function () {
			this.getModel("pcModel").refresh();
		},
		dateTimeFormat: function (dateTime) {
			let oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "dd/MM/yyyy hh:mm:ss"
			});

			return oDateFormat.format(new Date(dateTime))
		}
	});
});