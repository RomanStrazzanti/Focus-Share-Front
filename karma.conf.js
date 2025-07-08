// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  process.env.CHROME_BIN = require("puppeteer").executablePath();

  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    plugins: [
      require("karma-jasmine"),
      require("karma-chrome-launcher"), // <-- DOIT ÊTRE CE PLUGIN
      require("karma-jasmine-html-reporter"),
      require("karma-coverage"),
      require("@angular-devkit/build-angular/plugins/karma"),
    ],
    files: [
          { pattern: 'src/assets/**/*', watched: false, included: false, served: true },
        ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the html reporter will be shown in the browser
      },
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true, // suppresses all HTML comments (e.g. `<!-- result -->`)
    },
    coverageReporter: {
      dir: require("path").join(__dirname, "./coverage/AppAngular"),
      subdir: ".",
      reporters: [{ type: "html" }, { type: "text-summary" }],
    },
    reporters: ["progress", "kjhtml"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,

    // C'EST LA LIGNE CLÉ POUR LE NAVIGATEUR
    browsers: ["ChromeHeadless"], // <-- DOIT ÊTRE UNIQUEMENT 'ChromeHeadless'

    // ET C'EST LA CONFIGURATION DE CE NAVIGATEUR
    customLaunchers: {
      ChromeHeadless: {
        base: "Chrome", // Base sur le lanceur Chrome
        flags: [
          "--no-sandbox",
          "--headless", // Assurez-vous que '--headless' est bien là
          "--disable-gpu",
          "--remote-debugging-port=9222",
        ],
        binary: require("puppeteer").executablePath(), // <-- DOIT ÊTRE LA
      },
    },

    singleRun: false, // true pour une seule exécution, false pour le mode 'watch'
    restartOnFileChange: true,
  });
};
