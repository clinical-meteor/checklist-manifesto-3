// tests/nightwatch.conf.js
const chromedriver = require('chromedriver');
const geckodriver = require('geckodriver');

module.exports = {
  src_folders: ['tests/nightwatch/tests'],
  output_folder: 'tests/nightwatch/reports',
  custom_commands_path: ['tests/nightwatch/commands'],
  custom_assertions_path: ['tests/nightwatch/assertions'],
  page_objects_path: ['tests/nightwatch/pages'],
  
  webdriver: {
    start_process: true,
    server_path: chromedriver.path,
    port: 9515
  },
  
  test_settings: {
    default: {
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
          args: ['--headless', '--no-sandbox', '--disable-gpu', '--window-size=1280,800']
        }
      },
      screenshots: {
        enabled: true,
        path: 'tests/nightwatch/screenshots',
        on_failure: true
      },
      globals: {
        waitForConditionTimeout: 5000,
        retryAssertionTimeout: 5000
      }
    },
    
    firefox: {
      webdriver: {
        server_path: geckodriver.path,
        port: 4444
      },
      desiredCapabilities: {
        browserName: 'firefox',
        alwaysMatch: {
          'moz:firefoxOptions': {
            args: ['--headless']
          }
        }
      }
    },
    
    chrome: {
      webdriver: {
        server_path: chromedriver.path,
        port: 9515
      },
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
          args: ['--headless', '--no-sandbox', '--disable-gpu', '--window-size=1280,800']
        }
      }
    },
    
    "chrome-debug": {
      webdriver: {
        server_path: chromedriver.path,
        port: 9515
      },
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
          args: ['--no-sandbox', '--window-size=1280,800']
        }
      }
    }
  }
};