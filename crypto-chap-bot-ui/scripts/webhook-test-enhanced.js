/**
 * Enhanced WhatsApp Webhook Test Script
 * 
 * This script simulates different types of WhatsApp message events
 * to test your webhook endpoint thoroughly.
 */

const http = require('http');
const https = require('https');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Try to load .env.local for webhook URL
try {
  const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
  const webhookBaseUrl = envFile.match(/WEBHOOK_BASE_URL=(.+?)($|\r|\n)/)?.[1];
  if (webhookBaseUrl) {
    process.env.WEBHOOK_URL = `${webhookBaseUrl}/api/whatsapp/webhook`;
  }
} catch (error) {
  console.log('Could not load .env.local, will use provided webhook URL');
}

/**
 * Message test scenarios
 */
const TEST_SCENARIOS = {
  welcome: {
    description: 'Welcome/Greeting Message',
    message: 'hello'
  },
  balance: {
    description: 'Balance Check',
    message: 'balance'
  },
  address: {
    description: 'Get Wallet Address',
    message: 'address'
  },
  buy: {
    description: 'Buy USDC',
    message: 'buy 50'
  },
  send: {
    description: 'Send USDC',
    message: 'send 10 USDC to 0x742d35Cc6634C0532925a3b8D0C18C67b93a8E93'
  },
  history: {
    description: 'Transaction History',
    message: 'history'
  },
  help: {
    description: 'Help Command',
    message: 'help'
  },
  interactive: {
    description: 'Interactive Button Press',
    messageType: 'interactive',
    interactiveData: {
      type: 'button_reply',
      button_reply: {
        id: 'check_balance',
        title: 'Check Balance'
      }
    }
  },
  list: {
    description: 'Interactive List Selection',
    messageType: 'interactive',
    interactiveData: {
      type: 'list_reply',
      list_reply: {
        id: 'buy_50',
        title: '$50 USDC'
      }
    }
  },
  unknown: {
    description: 'Unknown Message',
    message: 'something random'
  }
};

/**
 * Create a WhatsApp message payload
 */
const createWhatsAppPayload = (options = {}) => {
  const {
    phoneNumber = '1234567890',
    messageType = 'text',
    messageContent = 'hello',
    interactiveData = null
  } = options;
  
  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '12345',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: `+${phoneNumber}`,
                phone_number_id: '751548871372266'
              },
              contacts: [
                {
                  profile: {
                    name: 'Test User'
                  },
                  wa_id: phoneNumber
                }
              ],
              messages: [
                {
                  from: phoneNumber,
                  id: `wamid.test${Date.now()}`,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: messageType
                }
              ]
            },
            field: 'messages'
          }
        ]
      }
    ]
  };
  
  // Add message content based on type
  if (messageType === 'text') {
    payload.entry[0].changes[0].value.messages[0].text = {
      body: messageContent
    };
  } else if (messageType === 'interactive') {
    payload.entry[0].changes[0].value.messages[0].interactive = interactiveData;
  }
  
  return payload;
};

/**
 * Send a webhook test request
 */
const sendWebhookRequest = (webhookUrl, payload) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const parsedUrl = new URL(webhookUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    // Choose http or https module based on the protocol
    const requestModule = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = requestModule.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
};

/**
 * Run a specific test scenario
 */
const runTestScenario = async (webhookUrl, scenarioKey) => {
  const scenario = TEST_SCENARIOS[scenarioKey];
  
  if (!scenario) {
    console.error(`Unknown test scenario: ${scenarioKey}`);
    return false;
  }
  
  console.log(`\n🧪 TESTING: ${scenario.description}`);
  
  const payload = createWhatsAppPayload({
    messageType: scenario.messageType || 'text',
    messageContent: scenario.message,
    interactiveData: scenario.interactiveData
  });
  
  try {
    console.log(`Sending ${scenario.messageType || 'text'} message to webhook: ${webhookUrl}`);
    if (scenario.messageType === 'text') {
      console.log(`Message content: "${scenario.message}"`);
    } else if (scenario.messageType === 'interactive') {
      console.log(`Interactive type: ${scenario.interactiveData.type}`);
      console.log(`Button ID: ${scenario.interactiveData.button_reply?.id || scenario.interactiveData.list_reply?.id}`);
    }
    
    const response = await sendWebhookRequest(webhookUrl, payload);
    
    console.log(`STATUS: ${response.statusCode}`);
    console.log(`RESPONSE: ${response.data}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Test passed!');
      return true;
    } else {
      console.log('❌ Test failed!');
      return false;
    }
  } catch (error) {
    console.error('Error during test:', error.message);
    return false;
  }
};

/**
 * Run all tests or a specific test
 */
const runTests = async (webhookUrl, testToRun = null) => {
  console.log('===========================================');
  console.log('🤖 WhatsApp Webhook Testing Tool');
  console.log('===========================================');
  console.log(`Target webhook: ${webhookUrl}`);
  
  if (testToRun) {
    // Run a specific test
    if (testToRun === 'all') {
      console.log('\n🔍 Running all tests');
      
      const results = {};
      for (const key of Object.keys(TEST_SCENARIOS)) {
        results[key] = await runTestScenario(webhookUrl, key);
      }
      
      // Print summary
      console.log('\n===========================================');
      console.log('📊 TEST RESULTS SUMMARY');
      console.log('===========================================');
      let passed = 0;
      for (const [key, result] of Object.entries(results)) {
        console.log(`${result ? '✅' : '❌'} ${TEST_SCENARIOS[key].description}`);
        if (result) passed++;
      }
      console.log(`\nPassed: ${passed}/${Object.keys(results).length} tests (${Math.round(passed/Object.keys(results).length*100)}%)`);
    } else if (TEST_SCENARIOS[testToRun]) {
      await runTestScenario(webhookUrl, testToRun);
    } else {
      console.error(`Unknown test: ${testToRun}`);
      showTestMenu(webhookUrl);
    }
  } else {
    showTestMenu(webhookUrl);
  }
};

/**
 * Display the test menu
 */
const showTestMenu = (webhookUrl) => {
  console.log('\n📋 Available Tests:');
  console.log('  0. Run all tests');
  
  let i = 1;
  for (const [, { description }] of Object.entries(TEST_SCENARIOS)) {
    console.log(`  ${i}. ${description}`);
    i++;
  }
  console.log('  q. Quit');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nChoose a test to run: ', async (answer) => {
    rl.close();
    
    if (answer.toLowerCase() === 'q') {
      console.log('Exiting...');
      process.exit(0);
    } else if (answer === '0') {
      await runTests(webhookUrl, 'all');
    } else {
      const testIndex = parseInt(answer, 10);
      if (isNaN(testIndex) || testIndex < 1 || testIndex > Object.keys(TEST_SCENARIOS).length) {
        console.error('Invalid selection');
        showTestMenu(webhookUrl);
      } else {
        const testKey = Object.keys(TEST_SCENARIOS)[testIndex - 1];
        await runTestScenario(webhookUrl, testKey);
        
        // Ask if they want to run another test
        const rl2 = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        rl2.question('\nRun another test? (y/n): ', (answer) => {
          rl2.close();
          if (answer.toLowerCase() === 'y') {
            showTestMenu(webhookUrl);
          } else {
            console.log('Exiting...');
            process.exit(0);
          }
        });
      }
    }
  });
};

// Main execution
(() => {
  // Get webhook URL from command line args or environment
  let webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/whatsapp/webhook';
  let testToRun = null;
  
  if (process.argv.length > 2) {
    webhookUrl = process.argv[2];
  }
  
  if (process.argv.length > 3) {
    testToRun = process.argv[3];
  }
  
  runTests(webhookUrl, testToRun);
})();
