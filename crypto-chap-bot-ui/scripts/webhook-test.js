/**
 * WhatsApp Webhook Test Script
 * 
 * This script simulates a WhatsApp message event being sent to your webhook.
 * It helps test if your webhook endpoint is correctly processing incoming messages.
 * 
 * Run with: node webhook-test.js
 */

// Use CommonJS require for Node.js compatibility
const http = require('http');
const https = require('https');

/**
 * Simulates sending a WhatsApp message event to the webhook
 */
const simulateWhatsAppMessage = () => {
  // Construct a sample WhatsApp message payload
  const whatsappData = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '12345',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: '109876543210987654'
              },
              contacts: [
                {
                  profile: {
                    name: 'Test User'
                  },
                  wa_id: '1234567890'
                }
              ],
              messages: [
                {
                  from: '1234567890',
                  id: 'wamid.abcd1234',
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: {
                    body: 'hi'
                  },
                  type: 'text'
                }
              ]
            },
            field: 'messages'
          }
        ]
      }
    ]
  };

  const postData = JSON.stringify(whatsappData);
  
  // Change this URL to your webhook URL (can be local or ngrok URL)
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/whatsapp/webhook';
  
  const parsedUrl = new URL(webhookUrl);
  
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      // We're not adding a signature since we're in development mode
    }
  };
  
  console.log(`Sending test message to webhook: ${webhookUrl}`);
  console.log(`Message content: "balance"`);

  // Choose http or https module based on the protocol
  const requestModule = parsedUrl.protocol === 'https:' ? https : http;

  const req = requestModule.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('RESPONSE:', data);
      console.log('\nIf you received a 200 OK response, your webhook is working!');
      console.log('Check your server logs for more details on how the message was processed.');
    });
  });
  
  req.on('error', (error) => {
    console.error('Error sending test message:', error);
  });
  
  req.write(postData);
  req.end();
};

/**
 * Allow for command line arguments to specify webhook URL
 * Usage: node webhook-test.js https://your-ngrok-url.ngrok-free.app/api/whatsapp/webhook
 */
if (process.argv.length > 2) {
  process.env.WEBHOOK_URL = process.argv[2];
}

// Call the function
simulateWhatsAppMessage();
