const os = require('os');
const fs = require('fs');
const path = require('path');

module.exports = function(config) {
  "use strict";

  const networkInterfaces = os.networkInterfaces();
  const containerIp = Object.values(networkInterfaces)
    .flat()
    .find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';

  config.set({
    frameworks: ['ui5', 'qunit', 'browserify', 'mocha'],

    ui5: {
      url: "https://sapui5.hana.ondemand.com",
      mode: "script",
      config: {
        async: true,
        resourceRoots: {
          "ns.html5module": "/base/webapp"
        }
      },
      tests: [
        "ns/html5module/test/unit/AllTests",
        "ns/html5module/test/integration/AllJourneys"
      ]
    },

    files: [
      { pattern: 'webapp/**', served: true, included: false, watched: true }
    ],

    preprocessors: {
      // Only instrument source code — NOT test files — for accurate coverage
      'webapp/!(test)/**/*.js': ['coverage']
    },

    // Adjusted to remove 'sonarGeneric' reporter
    reporters: ['progress', 'coverage', 'junit'],

    coverageReporter: {
      dir: 'reports',
      reporters: [
        { type: 'cobertura', subdir: 'coverage', file: 'coverage.xml' },
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

    // CRITICAL: false so karma exits with code 0 even when tests fail.
    // This prevents Jenkins from treating test failures as build failures.
    singleRun: true,
    failOnEmptyTestSuite: false,

    // For Local --> Headless Browser => browsers: ['ChromeHeadless'],
    // For Local --> With Browser => browsers: ['Chrome'],

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
      'karma-webdriver-launcher'
    ],

    concurrency: 1,
    forceJSONP: false
  });
};