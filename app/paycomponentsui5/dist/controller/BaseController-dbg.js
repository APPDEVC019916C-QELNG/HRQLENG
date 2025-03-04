sap.ui.define(
    [
      "sap/ui/core/mvc/Controller",
      "sap/ui/core/routing/History",
      "sap/m/MessageBox"
    ],
    function (BaseController,History,MessageBox) {
      "use strict";
  
      return BaseController.extend("qa.com.qelng.pcui5.paycomponentsui5.controller.BaseController", {
        onInit() {
  
        },
        getResourceBundle: function () {
          return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        getModel: function (sName) {
          return this.getView().getModel(sName);
        },
        setModel: function (oModel, sName) {
          return this.getView().setModel(oModel, sName);
        },
        getRouter: function () {
          return this.getOwnerComponent().getRouter();
        },
        getBaseURL: function () {
          let appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
          let appPath = appId.replaceAll(".", "/");
          let appModulePath = sap.ui.require.toUrl(appPath);
          return appModulePath;
        },
        onNavButtonPress: function() {
          let sPreviousHash=History.getInstance().getPreviousHash();
          if(sPreviousHash !== undefined){
              history.go(-1);
            }
            else {
                 this.getOwnerComponent().getRouter().navTo("RouteHealthCardForm",{});          
            }
        }
      });
    }
  );
  