sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel"
], function(Controller, MessageBox, JSONModel) {
	"use strict";

	var that;
	var sServiceURL = "/sap/opu/odata/sap/ZHCM_YD_SKALA_SRV/";
	var oDataModel = new sap.ui.model.odata.v2.ODataModel(sServiceURL, true);
	var oOrgehModel = new sap.ui.model.json.JSONModel();
	var oStellModel = new sap.ui.model.json.JSONModel();

	var oOrgehModel02 = new sap.ui.model.json.JSONModel();
	var oStellModel02 = new sap.ui.model.json.JSONModel();

	return Controller.extend("ZHCM_YD_SKALA.controller.View1", {
		onInit: function() {
			this.ODataServiceUrl = sServiceURL;
			this.ODataModel = new sap.ui.model.odata.v2.ODataModel(this.ODataServiceUrl, true);
			this.ODataModel.setSizeLimit("100000");
			this.getView().setModel(this.ODataModel);
			that = this;
			sap.ui.getCore().setModel(this.ODataModel);

			var oOrgehData = {
				OrgehList: [{
					Orgeh: '',
					OrgehTx: ''
				}]
			};
			oOrgehModel.setData(oOrgehData);
			oOrgehModel.setSizeLimit("100000");
			this.getView().byId("idorgeh").setModel(oOrgehModel);
			this.getView().setModel(oOrgehModel, "OrgehModel");

			oOrgehModel02.setData(oOrgehData);
			oOrgehModel02.setSizeLimit("100000");
			this.getView().byId("idorgeh02").setModel(oOrgehModel02);
			this.getView().setModel(oOrgehModel02, "OrgehModel02");

			var oStellData = {
				StellList: [{
					Stell: '',
					StellTx: ''
				}]
			};
			oStellModel.setData(oStellData);
			oStellModel.setSizeLimit("100000");
			this.getView().byId("idstell").setModel(oStellModel);
			this.getView().setModel(oStellModel, "StellModel");

			oStellModel02.setData(oStellData);
			oStellModel02.setSizeLimit("100000");
			this.getView().byId("idstell02").setModel(oStellModel02);
			this.getView().setModel(oStellModel02, "StellModel02");


			//Check if startup - parameter is send
			var oViewModel = new JSONModel({
				Country1: null,
				City1: null,
				OrgUnit1: null,
				Country2: null,
				City2: null,
				OrgUnit2: null,
				Set: false
			});
			this.getView().setModel(oViewModel, "scaleView");
			var oStartupParameters = this.getOwnerComponent().getComponentData().startupParameters;
			if(oStartupParameters?.RegionSelection){
				try{
					var oDefault = JSON.parse(atob(oStartupParameters.RegionSelection[0]));
					oViewModel.setProperty("/Country1", oDefault?.Werks );
					oViewModel.setProperty("/City1", oDefault?.Btrtl );
					oViewModel.setProperty("/Country2", oDefault?.Werks );
					oViewModel.setProperty("/City2", oDefault?.Btrtl );
				}catch(e){
					oViewModel.setProperty("/Country1", null );
					oViewModel.setProperty("/City1", null );
					oViewModel.setProperty("/Country2", null );
					oViewModel.setProperty("/City2", null );
				}
			}

			
		},
		onCountryRequested: function(){
			this.getView().byId("idulke").setBusy(true);
		},
		onCountryReceived: function(){
			var oViewModel = this.getView().getModel("scaleView");
			var sCountry1 = oViewModel.getProperty("/Country1");
			var sCountry2 = oViewModel.getProperty("/Country2");
			var bSet = oViewModel.getProperty("/Set");
			var oCountry1 = this.getView().byId("idulke");
			var oCountry2 = this.getView().byId("idulke02");
			if(sCountry1 && !bSet){
				oCountry1.setSelectedKey(sCountry1);
				oCountry2.setSelectedKey(sCountry2);
				this.onChangeUlke();
				this.onChangeUlke02();
			}
			oCountry1.setBusy(false);
			oCountry2.setBusy(false);
		},
		onChangeUlke: function() {
			var Ulke = this.byId("idulke").getSelectedKey();
			var oViewModel = this.getView().getModel("scaleView");
			var sCity = oViewModel.getProperty("/City1");
			var bSet = oViewModel.getProperty("/Set");
			var sOrgeh = null;

			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, Ulke));

			//Clear
			var aStell = [];
			oStellModel.setProperty("/StellList", aStell);
			this.byId("idbetrg1").setValue("");
			this.byId("idbetrg2").setValue("");
			this.byId("idbetrg3").setValue("");
			this.byId("idkidem").setValue("");
			this.byId("idkidem2").setValue("");
			this.byId("idkidem3").setValue("");
			this.byId("idtotal").setValue("");
			this.byId("idtotalusd").setValue("");
			this.byId("htmlTextOrg").setHtmlText("");
			this.byId("idtotaltalep").setValue("");

			//Ülkeye bağlı para birimi
			this.getView().getModel().read("/WAERSSet", {
				filters: aFilter,
				async: false,
				success: function(oContent) {
					if (oContent.results[0]) {
						var waers = oContent.results[0].Waers;
						var kurusd = oContent.results[0].Kurusd;
						that.byId("idwaers").setValue(waers);
						that.byId("idwaersusd").setValue(kurusd);
					} else {
						that.byId("idwaers").setValue("");
						that.byId("idwaersusd").setValue("");
					}
				}
			});

			//Ülkeye bağlı organizasyonlar
			var aOrgeh = [];
			this.getView().getModel().read("/ORGEHSet", {
				filters: aFilter,
				async: false,
				success: function(oData, response) {
					for (var idx = 0; idx < oData.results.length; idx++) {
						if(oData.results[idx].Btrtl === sCity){
							sOrgeh = oData.results[idx].Orgeh;
						}
						aOrgeh.push({
							Orgeh: oData.results[idx].Orgeh,
							OrgehTx: oData.results[idx].OrgehTx,
							Werks: oData.results[idx].Werks,
							Btrtl: oData.results[idx].Btrtl,
						});
					}
					oOrgehModel.setProperty("/OrgehList", aOrgeh);
					if(sOrgeh && !bSet){
						oViewModel.setProperty("/OrgUnit1", sOrgeh);
						oViewModel.setProperty("/Set", true);
					}
					// if(sOrgeh && !bSet){
					// 	that.byId("idorgeh").setSelectedKey(sOrgeh);
					// 	oViewModel.setProperty("/Set", true);
					// }
				},
				failed: function(oData, response) {
					var F = "Failed to get Domain Values!";
					sap.m.MessageBox.error(F);
				},
				error: function(oError) {
					var M = JSON.parse(oError.response.body).error.message.value;
					sap.m.MessageBox.error(M);
				}
			});
		},
		onChangeUlke02: function() {
			var Ulke = this.byId("idulke02").getSelectedKey();
			var oViewModel = this.getView().getModel("scaleView");
			var sCity = oViewModel.getProperty("/City2");
			var bSet = oViewModel.getProperty("/Set");
			var sOrgeh = null;
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, Ulke));

			//Clear
			var aStell = [];
			oStellModel02.setProperty("/StellList02", aStell);
			this.byId("idbetrg1_02").setValue("");
			this.byId("idztype1_02").setValue("");
			this.byId("idbetrg1usd_02").setValue("");

			//Ülkeye bağlı para birimi
			this.getView().getModel().read("/WAERSSet", {
				filters: aFilter,
				async: false,
				success: function(oContent) {
					if (oContent.results[0]) {
						var waers = oContent.results[0].Waers;
						var kurusd = oContent.results[0].Kurusd;
						that.byId("idwaers02").setValue(waers);
						that.byId("idwaersusd02").setValue(kurusd);
					} else {
						that.byId("idwaers02").setValue("");
						that.byId("idwaersusd02").setValue("");
					}
				}
			});

			//Ülkeye bağlı organizasyonlar
			var aOrgeh = [];
			this.getView().getModel().read("/ORGEHSet", {
				filters: aFilter,
				async: false,
				success: function(oData, response) {
					for (var idx = 0; idx < oData.results.length; idx++) {
						if(oData.results[idx].Btrtl === sCity){
							sOrgeh = oData.results[idx].Orgeh;
						}
						aOrgeh.push({
							Orgeh: oData.results[idx].Orgeh,
							OrgehTx: oData.results[idx].OrgehTx,
							Werks: oData.results[idx].Werks,
							Btrtl: oData.results[idx].Btrtl,
						});
					}
					oOrgehModel02.setProperty("/OrgehList02", aOrgeh);
					if(sOrgeh && !bSet){
						oViewModel.setProperty("/OrgUnit2", sOrgeh);
					}
				},
				failed: function(oData, response) {
					var F = "Failed to get Domain Values!";
					sap.m.MessageBox.error(F);
				},
				error: function(oError) {
					var M = JSON.parse(oError.response.body).error.message.value;
					sap.m.MessageBox.error(M);
				}
			});
		},
		onChangeOrgeh: function() {
			var Orgeh = this.byId("idorgeh").getSelectedKey();
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Orgeh", sap.ui.model.FilterOperator.EQ, Orgeh));
			aFilter.push(new sap.ui.model.Filter("Zpertype", sap.ui.model.FilterOperator.EQ, "1"));

			//Clear
			this.byId("idbetrg1").setValue("");
			this.byId("idbetrg3").setValue("");
			this.byId("idkidem").setValue("");
			this.byId("idkidem2").setValue("");
			this.byId("idkidem3").setValue("");
			this.byId("idtotal").setValue("");
			this.byId("idtotalusd").setValue("");

			//Organizasyona bağlı işler
			var aStell = [];
			this.getView().getModel().read("/STELLSet", {
				filters: aFilter,
				async: false,
				success: function(oData, response) {
					for (var idx = 0; idx < oData.results.length; idx++) {
						if (oData.results[idx].Orgehacklm !== '') {
							that.byId("htmlTextOrg").setHtmlText(oData.results[idx].Orgehacklm);
						}
						aStell.push({
							Stell: oData.results[idx].Stell,
							StellTx: oData.results[idx].StellTx
						});
					}
					oStellModel.setProperty("/StellList", aStell);
				},
				failed: function(oData, response) {
					var F = "Failed to get Domain Values!";
					sap.m.MessageBox.error(F);
				},
				error: function(oError) {
					var M = JSON.parse(oError.response.body).error.message.value;
					sap.m.MessageBox.error(M);
				}
			});
		},
		onChangeOrgeh02: function() {
			var Orgeh = this.byId("idorgeh02").getSelectedKey();
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Orgeh", sap.ui.model.FilterOperator.EQ, Orgeh));
			aFilter.push(new sap.ui.model.Filter("Zpertype", sap.ui.model.FilterOperator.EQ, "2"));

			//Clear
			this.byId("idbetrg1_02").setValue("");
			this.byId("idztype1_02").setValue("");
			this.byId("idbetrg1usd_02").setValue("");

			//Organizasyona bağlı işler
			var aStell = [];
			this.getView().getModel().read("/STELLSet", {
				filters: aFilter,
				async: false,
				success: function(oData, response) {
					for (var idx = 0; idx < oData.results.length; idx++) {
						if (oData.results[idx].Orgehacklm !== '') {
							// that.byId("htmlTextOrg02").setHtmlText(oData.results[idx].Orgehacklm);
						}
						aStell.push({
							Stell: oData.results[idx].Stell,
							StellTx: oData.results[idx].StellTx
						});
					}
					oStellModel02.setProperty("/StellList02", aStell);
				},
				failed: function(oData, response) {
					var F = "Failed to get Domain Values!";
					sap.m.MessageBox.error(F);
				},
				error: function(oError) {
					var M = JSON.parse(oError.response.body).error.message.value;
					sap.m.MessageBox.error(M);
				}
			});
		},
		onChangeStell: function() {
			var Orgeh = this.byId("idorgeh").getSelectedKey();
			var Stell = this.byId("idstell").getSelectedKey();
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Orgeh", sap.ui.model.FilterOperator.EQ, Orgeh));
			aFilter.push(new sap.ui.model.Filter("Stell", sap.ui.model.FilterOperator.EQ, Stell));
			aFilter.push(new sap.ui.model.Filter("Zpertype", sap.ui.model.FilterOperator.EQ, "1"));

			//Clear
			this.byId("idbetrg3").setValue("");
			this.byId("idkidem").setValue("");
			this.byId("idkidem2").setValue("");
			this.byId("idkidem3").setValue("");

			this.getView().getModel().read("/BETRGSet", {
				filters: aFilter,
				async: false,
				success: function(oData, response) {
					if (oData.results[0]) {
						var betrg = oData.results[0].Betrg;
						that.byId("idbetrg1").setValue(betrg);
					} else {
						that.byId("idbetrg1").setValue("");
					}
					var total = 0;

					if (that.byId("idbetrg1").getValue() !== "") {
						total = total + parseFloat(that.byId("idbetrg1").getValue());
					}
					if (that.byId("idbetrg2").getValue() !== "") {
						total = total + parseFloat(that.byId("idbetrg2").getValue());
					}
					if (that.byId("idbetrg3").getValue() !== "") {
						total = total + parseFloat(that.byId("idbetrg3").getValue());
					}
					total = parseFloat(total).toFixed(2);
					that.byId("idtotal").setValue(total);

					var totalusd = 0;
					totalusd = that.byId("idwaersusd").getValue();
					totalusd = total * totalusd;
					totalusd = parseFloat(totalusd).toFixed(2);
					that.byId("idtotalusd").setValue(totalusd);

				},
				failed: function(oData, response) {
					var F = "Failed to get Domain Values!";
					sap.m.MessageBox.error(F);
				},
				error: function(oError) {
					var M = JSON.parse(oError.response.body).error.message.value;
					sap.m.MessageBox.error(M);
				}
			});
		},
		onChangeStell02: function() {
			var Orgeh = this.byId("idorgeh02").getSelectedKey();
			var Stell = this.byId("idstell02").getSelectedKey();
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Orgeh", sap.ui.model.FilterOperator.EQ, Orgeh));
			aFilter.push(new sap.ui.model.Filter("Stell", sap.ui.model.FilterOperator.EQ, Stell));
			aFilter.push(new sap.ui.model.Filter("Zpertype", sap.ui.model.FilterOperator.EQ, "2"));

			// //Clear
			// this.byId("idbetrg3").setValue("");
			// this.byId("idkidem").setValue("");

			this.getView().getModel().read("/BETRGSet", {
				filters: aFilter,
				async: false,
				success: function(oData, response) {
					if (oData.results[0]) {
						var betrg = oData.results[0].Betrg;
						var ztype = oData.results[0].ZtypeTx;
						that.byId("idbetrg1_02").setValue(betrg);
						that.byId("idztype1_02").setValue(ztype);

						var totalusd = 0;
						totalusd = that.byId("idwaersusd02").getValue();
						totalusd = betrg * totalusd;
						totalusd = parseFloat(totalusd).toFixed(2);
						that.byId("idbetrg1usd_02").setValue(totalusd);
					} else {
						that.byId("idbetrg1_02").setValue("");
						that.byId("idztype1_02").setValue("");
						that.byId("idbetrg1usd_02").setValue("");
					}
				},
				failed: function(oData, response) {
					var F = "Failed to get Domain Values!";
					sap.m.MessageBox.error(F);
				},
				error: function(oError) {
					var M = JSON.parse(oError.response.body).error.message.value;
					sap.m.MessageBox.error(M);
				}
			});
		},
		onChangeSlart: function() {
			var Ulke = this.byId("idulke").getSelectedKey();
			var Slart = this.byId("idslart").getSelectedKey();
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, Ulke));
			aFilter.push(new sap.ui.model.Filter("Slart", sap.ui.model.FilterOperator.EQ, Slart));

			this.getView().getModel().read("/BETRGSet", {
				filters: aFilter,
				async: false,
				success: function(oData, response) {
					if (oData.results[0]) {
						var betrg = oData.results[0].Betrg;
						that.byId("idbetrg2").setValue(betrg);
					} else {
						that.byId("idbetrg2").setValue("");
					}
					var total = 0;
					if (that.byId("idbetrg1").getValue() !== "") {
						total = total + parseFloat(that.byId("idbetrg1").getValue());
					}
					if (that.byId("idbetrg2").getValue() !== "") {
						total = total + parseFloat(that.byId("idbetrg2").getValue());
					}
					if (that.byId("idbetrg3").getValue() !== "") {
						total = total + parseFloat(that.byId("idbetrg3").getValue());
					}
					total = parseFloat(total).toFixed(2);
					that.byId("idtotal").setValue(total);

					var totalusd = 0;
					totalusd = that.byId("idwaersusd").getValue();
					totalusd = total * totalusd;
					totalusd = parseFloat(totalusd).toFixed(2);
					that.byId("idtotalusd").setValue(totalusd);
				},
				failed: function(oData, response) {
					var F = "Failed to get Domain Values!";
					sap.m.MessageBox.error(F);
				},
				error: function(oError) {
					var M = JSON.parse(oError.response.body).error.message.value;
					sap.m.MessageBox.error(M);
				}
			});

		},
		onLiveKidem: function(oEvent) {
			// var value = oEvent.getSource().getValue().replace(/[^\d]/g, '');
			// oEvent.getSource().setValue(value);
			var Ulke = this.byId("idulke").getSelectedKey();
			var Kidem = this.byId("idkidem").getValue();
			var Kidem2 = this.byId("idkidem2").getValue();
			var Kidem3 = this.byId("idkidem3").getValue();
			var Betrg1 = this.byId("idbetrg1").getValue();
			var aFilter = [];
			Kidem3 = (+Kidem + +(Kidem2 / 2));
			aFilter.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, Ulke));
			aFilter.push(new sap.ui.model.Filter("Kidem", sap.ui.model.FilterOperator.EQ, Kidem3));
			aFilter.push(new sap.ui.model.Filter("Betrg", sap.ui.model.FilterOperator.EQ, Betrg1));
			if (Kidem === "" && Kidem2 === "") {
				this.byId("idbetrg3").setValue("");
				this.byId("idkidem3").setValue("");
				return;
			} else {
				this.byId("idkidem3").setValue(Kidem3);
			}
			this.getView().getModel().read("/BETRGSet", {
				filters: aFilter,
				async: false,
				success: function(oData, response) {
					if (oData.results[0]) {
						var betrg = parseFloat(oData.results[0].Betrg).toFixed(2);
						betrg = betrg - Betrg1;
						// betrg = (betrg * Betrg1) - Betrg1;
						betrg = parseFloat(betrg).toFixed(2);
						that.byId("idbetrg3").setValue(betrg);
					} else {
						that.byId("idbetrg3").setValue("");
					}

					var total = 0;
					if (that.byId("idbetrg1").getValue() !== "") {
						total = total + parseFloat(that.byId("idbetrg1").getValue());
					}
					if (that.byId("idbetrg2").getValue() !== "") {
						total = total + parseFloat(that.byId("idbetrg2").getValue());
					}
					if (that.byId("idbetrg3").getValue() !== "") {
						total = total + parseFloat(that.byId("idbetrg3").getValue());
					}
					total = parseFloat(total).toFixed(2);
					that.byId("idtotal").setValue(total);

					var totalusd = 0;
					totalusd = that.byId("idwaersusd").getValue();
					totalusd = total * totalusd;
					totalusd = parseFloat(totalusd).toFixed(2);
					that.byId("idtotalusd").setValue(totalusd);
				},
				failed: function(oData, response) {
					var F = "Failed to get Domain Values!";
					sap.m.MessageBox.error(F);
				},
				error: function(oError) {
					var M = JSON.parse(oError.response.body).error.message.value;
					sap.m.MessageBox.error(M);
				}
			});
		},
		onLiveTalep: function(oEvent) {
			// var value = oEvent.getSource().getValue().replace(/[^\d]/g, '');
			// oEvent.getSource().setValue(value);
		},
		onPressCalculate: function() {
			var nocalc = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("NoCalc");
			var okmsg = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("ResultOk");
			var notokmsg = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("ResultNotOk");
			var minmsg = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("Minbetrg");
			var maxmsg = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("Maxbetrg");

			var Ulke = this.byId("idulke").getSelectedKey();
			var Total = 0;
			var TotalTalep = 0;
			var aFilter = [];

			Total = this.byId("idtotal").getValue();
			TotalTalep = this.byId("idtotaltalep").getValue();

			aFilter.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, Ulke));
			aFilter.push(new sap.ui.model.Filter("Betrgtotal", sap.ui.model.FilterOperator.EQ, Total));
			aFilter.push(new sap.ui.model.Filter("Betrgtalep", sap.ui.model.FilterOperator.EQ, TotalTalep));

			if (this.byId("idtotal").getValue() !== "" && this.byId("idtotaltalep").getValue() !== "") {
				this.getView().getModel().read("/CALCSet", {
					filters: aFilter,
					async: false,
					success: function(oData, response) {
						if (oData.results[0]) {
							var flag = oData.results[0].Resultflag;
							var min = that.currencyOA(oData.results[0].Resultmin);
							var max = that.currencyOA(oData.results[0].Resultmax);
							var waers = oData.results[0].Waers;
							if (flag) {
								var okmsgfinal = okmsg + " ( " + minmsg + ": " + min + " " + waers + " / " + maxmsg + ": " + max + " " + waers + " ) ";
								sap.m.MessageBox.success(okmsgfinal, {
									styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer",
									onClose: function(sAction) {}
								});
							} else {
								var notokmsgfinal = notokmsg + " ( " + minmsg + ": " + min + " " + waers + " / " + maxmsg + ": " + max + " " + waers +
									" ) ";
								sap.m.MessageBox.error(notokmsgfinal, {
									styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer",
									onClose: function(sAction) {}
								});

							}
						} else {
							that.byId("idbetrg3").setValue("");
						}
					},
					failed: function(oData, response) {
						var F = "Failed to get Domain Values!";
						sap.m.MessageBox.error(F);
					},
					error: function(oError) {
						var M = JSON.parse(oError.response.body).error.message.value;
						sap.m.MessageBox.error(M);
					}
				});
			} else {
				sap.m.MessageBox.information(nocalc, {
					styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer",
					onClose: function(sAction) {}
				});
			}

		},
		currencyOA: function(value) {
			value = parseFloat(value).toFixed(2);
			// value = value.replace('.', ',');
			// return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
			return value;
		}

	});
});