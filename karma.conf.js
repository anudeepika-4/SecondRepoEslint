const os = require('os');
const fs = require('fs');
const path = require('path');

module.exports = function(config) {
  "use strict";

  const networkInterfaces = os.networkInterfaces();
  const containerIp = Object.values(networkInterfaces)
    .flat()
    .find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';

  // ─── Inline SonarQube Generic Test Execution reporter ───────────────
  function SonarGenericReporter(baseReporterDecorator) {
    baseReporterDecorator(this);
    const specResults = [];

    this.onSpecComplete = function(browser, result) {
      specResults.push({
        suite:   (result.suite || []).join(' '),
        name:    result.description || 'unnamed',
        time:    result.time || 1,
        success: result.success,
        skipped: result.skipped,
        log:     result.log || []
      });
    };

    this.onRunComplete = function() {
      var suiteMap = {};
      specResults.forEach(function(r) {
        var key = r.suite || 'General';
        (suiteMap[key] = suiteMap[key] || []).push(r);
      });

      function escapeXml(str) {
        return String(str || '')
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      }

      // Map suite name → REAL test file path under sonar.tests (webapp/test)
      // NO "HTML5Module/" prefix — pipeline uses sonar.tests=webapp/test
      function suiteToFilePath(suite) {
        var lc = suite.toLowerCase();
        var base = 'webapp/test/';
        if (lc.indexOf('navigation') !== -1 || lc.indexOf('journey') !== -1)
          return base + 'integration/NavigationJourney.js';
        if (lc.indexOf('model') !== -1)
          return base + 'unit/model/models.js';
        if (lc.indexOf('formatter') !== -1)
          return base + 'unit/util/formatter.js';
        if (lc.indexOf('view1') !== -1 || lc.indexOf('controller') !== -1)
          return base + 'unit/controller/View1.controller.js';
        return base + 'unit/AllTests.js';   // safe fallback: a file that exists
      }

      var xml = '<testExecutions version="1">\n';
      Object.keys(suiteMap).forEach(function(suite) {
        xml += '  <file path="' + escapeXml(suiteToFilePath(suite)) + '">\n';
        suiteMap[suite].forEach(function(tc) {
          var duration = Math.max(Math.round(tc.time), 1);
          var name = escapeXml(tc.name);
          if (tc.skipped) {
            xml += '    <testCase name="' + name + '" duration="' + duration + '">\n';
            xml += '      <skipped message="skipped"/>\n';
            xml += '    </testCase>\n';
          } else if (!tc.success) {
            var msg = escapeXml((tc.log[0] || 'Test failed').substring(0, 500));
            xml += '    <testCase name="' + name + '" duration="' + duration + '">\n';
            xml += '      <failure message="' + msg + '"/>\n';
            xml += '    </testCase>\n';
          } else {
            xml += '    <testCase name="' + name + '" duration="' + duration + '"/>\n';
          }
        });
        xml += '  </file>\n';
      });
      xml += '</testExecutions>\n';

      var reportsDir = path.join(__dirname, 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
      // Capital T to match the pipeline: reports/Test-execution.xml
      var outputPath = path.join(reportsDir, 'Test-execution.xml');
      fs.writeFileSync(outputPath, xml, 'utf8');
      console.log('[SonarGeneric] Written: ' + outputPath);
    };
  }
  SonarGenericReporter.$inject = ['baseReporterDecorator'];
  // ────────────────────────────────────────────────────────────────────

  config.set({
    frameworks: ['ui5', 'qunit', 'browserify', 'mocha'],

    ui5: {
      url: "https://sapui5.hana.ondemand.com",
      mode: "script",
      config: {
       async: true,
       resourceRoots: {
         "ns.html5module": "/base/webapp"      // lowercase — matches the app
      }
      },
    tests: [
      "ns/html5module/test/unit/AllTests",       // lowercase
      "ns/html5module/test/integration/AllJourneys"
    ] 
    },

    files: [
      { pattern: 'webapp/**', served: true, included: false, watched: true }
    ],

    preprocessors: {
      'webapp/!(test)/**/*.js': ['coverage']
    },

    reporters: ['progress', 'coverage', 'junit', 'sonarGeneric'],

    coverageReporter: {
      dir: 'reports',
      reporters: [
        // cobertura moved to its own subdir to avoid EEXIST collision
        { type: 'cobertura', subdir: 'coverage-cobertura', file: 'coverage.xml' },
        // lcov MUST stay in 'coverage' — pipeline reads reports/coverage/lcov.info
        { type: 'lcov',      subdir: 'coverage' },
        { type: 'text-summary' }
      ]
    },

    junitReporter: {
      outputDir: 'reports',
      outputFile: 'TESTS-karma.xml',
      useBrowserName: false,
      suite: 'KarmaTests'
    },

    port: 9876,
    hostname: containerIp,
    listenAddress: '0.0.0.0',
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    singleRun: true,             // runs once & exits; correct for CI
    failOnEmptyTestSuite: false,

    browsers: ['SeleniumChrome'],
    customLaunchers: {
      SeleniumChrome: {
        base: 'WebDriver',
        config: {
          hostname: process.env.PIPER_SELENIUM_WEBDRIVER_HOSTNAME || 'selenium',
          port: parseInt(process.env.PIPER_SELENIUM_WEBDRIVER_PORT) || 4444
        },
        browserName: 'chrome',
        name: 'Karma',
        flags: ['--no-sandbox', '--disable-dev-shm-usage', '--headless'],
        pseudoActivityInterval: 30000
      }
    },

    captureTimeout: 210000,
    browserDisconnectTimeout: 210000,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 210000,

    plugins: [
      'karma-ui5',
      'karma-qunit',
      'karma-mocha',
      'karma-chrome-launcher',
      'karma-junit-reporter',
      'karma-browserify',
      'karma-coverage',
      'karma-webdriver-launcher',
      { 'reporter:sonarGeneric': ['type', SonarGenericReporter] }
    ],

    concurrency: 1,
    forceJSONP: false
  });
};