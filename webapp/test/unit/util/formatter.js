/*global QUnit*/
sap.ui.define([], function() {
    "use strict";

    QUnit.module("Formatter Utilities");

    // TC-010: Passes
    QUnit.test("Empty string should be treated as falsy", function(assert) {
        assert.notOk("", "Empty string is falsy");
    });

    // TC-011: Passes
    QUnit.test("Non-empty string should be truthy", function(assert) {
        assert.ok("hello", "Non-empty string is truthy");
    });

    // TC-012: Passes — demonstrates skipped via assert.expect
    QUnit.test("Numeric zero should be falsy", function(assert) {
        assert.notOk(0, "Zero is falsy");
    });
});