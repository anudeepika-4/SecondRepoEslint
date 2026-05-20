/*global QUnit*/
sap.ui.define([
    "ns/HTML5Module/model/models"
], function(models) {
    "use strict";

    QUnit.module("Model Utilities");

    // TC-007: Passes
    QUnit.test("createDeviceModel should return a JSONModel", function(assert) {
        var oModel = models.createDeviceModel();
        assert.ok(oModel, "Device model created successfully");
        oModel.destroy();
    });

    // TC-008: Passes
    QUnit.test("Device model should have isMobile property", function(assert) {
        var oModel = models.createDeviceModel();
        var bIsMobile = oModel.getProperty("/system/phone");
        assert.strictEqual(typeof bIsMobile, "boolean", "isMobile is a boolean");
        oModel.destroy();
    });

    // TC-009: Intentional failure — demonstrates failure in model tests
    QUnit.test("Device model version should match (intentional fail)", function(assert) {
        assert.strictEqual("1.0", "2.0", "This test intentionally fails");
    });
});