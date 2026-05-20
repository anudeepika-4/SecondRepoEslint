/*global QUnit*/
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "ns/HTML5Module/controller/View1.controller"
], function(Controller, View1Controller) {
    "use strict";

    QUnit.module("View1 Controller", {
        beforeEach: function() {
            this.oController = new View1Controller();
        },
        afterEach: function() {
            this.oController.destroy();
        }
    });

    // TC-001: Passes
    QUnit.test("I should test the View1 controller", function(assert) {
        assert.ok(this.oController, "Controller instance created successfully");
    });

    // TC-002: Passes
    QUnit.test("Controller should have an onInit function", function(assert) {
        assert.ok(typeof this.oController.onInit === "function", "onInit is defined");
    });

    // TC-003: Passes
    QUnit.test("Controller metadata should have correct type", function(assert) {
        assert.strictEqual(
            this.oController.getMetadata().getName(),
            "ns.HTML5Module.controller.View1",
            "Controller name matches"
        );
    });

    // TC-004: Passes
    QUnit.test("Controller should extend sap.ui.core.mvc.Controller", function(assert) {
        assert.ok(
            this.oController instanceof Controller,
            "Controller is an instance of sap.ui.core.mvc.Controller"
        );
    });

    // TC-005: Intentional failure — demonstrates failure reporting
    QUnit.test("Controller display name should match expected value (intentional fail)", function(assert) {
        assert.strictEqual(
            this.oController.getMetadata().getName(),
            "ns.HTML5Module.controller.WrongName",
            "This test intentionally fails to demonstrate failure reporting"
        );
    });

    // TC-006: Passes
    QUnit.test("Controller should be destroyable", function(assert) {
        var oNew = new View1Controller();
        oNew.destroy();
        assert.ok(true, "Controller destroyed without error");
    });
});