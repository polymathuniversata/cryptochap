import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { MessageProcessor } from '@/lib/whatsapp/message-processor';
import { WhatsAppTemplates } from '@/lib/whatsapp/templates';

interface WhatsAppWebhookMessage {
  messaging_product: string;
  to: string;
  type: string;
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
  };
  interactive?: any;
}

interface WhatsAppIncomingMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          interactive?: {
            type: string;
            button_reply?: {
              id: string;
              title: string;
            };
            list_reply?: {
              id: string;
              title: string;
            };
          };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.META_APP_SECRET || '')
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signature)
  );
}

async function sendWhatsAppMessage(message: WhatsAppWebhookMessage) {
  console.log('Sending WhatsApp message to:', message.to);
  console.log('Message type:', message.type);
  console.log('Phone number ID:', process.env.META_PHONE_NUMBER_ID);
  console.log('WhatsApp token available:', !!process.env.META_WHATSAPP_TOKEN);
  
  try {
    const apiUrl = `https://graph.facebook.com/v18.0/${process.env.META_PHONE_NUMBER_ID}/messages`;
    console.log('API URL:', apiUrl);
    
    const response = await fetch(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    );

    console.log('WhatsApp API response status:', response.status);
    const responseData = await response.text();
    console.log('WhatsApp API response:', responseData);

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status} - ${responseData}`);
    }

    return JSON.parse(responseData);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

async function processMessage(
  messageText: string, 
  fromNumber: string, 
  messageProcessor: MessageProcessor
): Promise<WhatsAppWebhookMessage> {
  try {
    const command = messageProcessor.parseCommand(messageText);
    const response = await messageProcessor.processCommand(command, fromNumber);
    
    return {
      messaging_product: 'whatsapp',
      to: fromNumber,
      type: 'text',
      text: {
        body: response,
      },
    };
  } catch (error) {
    console.error('Error processing message:', error);
    return {
      messaging_product: 'whatsapp',
      to: fromNumber,
      type: 'text',
      text: {
        body: '❌ Something went wrong. Please try again or type "help" for available commands.',
      },
    };
  }
}

async function processInteractiveMessage(
  interactive: any,
  fromNumber: string,
  messageProcessor: MessageProcessor
): Promise<WhatsAppWebhookMessage> {
  const buttonId = interactive.button_reply?.id || interactive.list_reply?.id;
  
  switch (buttonId) {
    case 'check_balance':
      return await processMessage('balance', fromNumber, messageProcessor);
    
    case 'buy_usdc':
      return WhatsAppTemplates.getBuyOptionsInteractive(fromNumber);
    
    case 'send_money':
      return {
        messaging_product: 'whatsapp',
        to: fromNumber,
        type: 'text',
        text: {
          body: 'To send money, use this format:\n\n"send 10 USDC to 0x1234..."\nor\n"send 5 USDC to +1234567890"\n\nHow much would you like to send?',
        },
      };
    
    case 'buy_25':
    case 'buy_50':
    case 'buy_100':
      const amount = buttonId.split('_')[1];
      return await processMessage(`buy ${amount}`, fromNumber, messageProcessor);
    
    case 'buy_custom':
      return {
        messaging_product: 'whatsapp',
        to: fromNumber,
        type: 'text',
        text: {
          body: 'Enter the amount you\'d like to purchase:\n\nExample: "buy 75" for $75 USDC',
        },
      };
    
    case 'main_menu':
      return WhatsAppTemplates.getMainMenuInteractive(fromNumber);
    
    default:
      return WhatsAppTemplates.getMainMenuInteractive(fromNumber);
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  console.log('WhatsApp Webhook GET Request:');
  console.log('- Mode:', mode);
  console.log('- Token:', token);
  console.log('- Challenge:', challenge);
  console.log('- Expected Token:', process.env.META_VERIFY_TOKEN);

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('Webhook verified successfully!');
    return new NextResponse(challenge);
  }

  console.log('Webhook verification failed!');
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  console.log('Webhook POST request received');
  try {
    const body = await request.text();
    console.log('Request body:', body.substring(0, 500) + (body.length > 500 ? '...' : ''));
    
    const signature = request.headers.get('x-hub-signature-256');
    console.log('Signature header:', signature);

    // Skip signature verification in development if APP_SECRET not available
    if (process.env.NODE_ENV === 'production' && (!signature || !verifyWebhookSignature(body, signature))) {
      console.log('Unauthorized request: signature verification failed');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let webhookData: WhatsAppIncomingMessage;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.error('Failed to parse webhook data:', error);
      return new NextResponse('Invalid JSON', { status: 400 });
    }

    if (webhookData.object !== 'whatsapp_business_account') {
      console.log(`Invalid webhook object: ${webhookData.object}`);
      return new NextResponse('Invalid webhook object', { status: 400 });
    }

    console.log('Creating MessageProcessor instance');
    const messageProcessor = new MessageProcessor();

    for (const entry of webhookData.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages' && change.value.messages) {
          for (const message of change.value.messages) {
            const fromNumber = message.from;
            console.log(`Processing message from ${fromNumber}:`, message);
            let replyMessage: WhatsAppWebhookMessage;

            // Handle text messages
            if (message.type === 'text' && message.text?.body) {
              const messageText = message.text.body;
              console.log(`Received text message: "${messageText}"`);
              
              // Check for welcome/greeting messages to trigger main menu
              const isGreeting = /^(hi|hello|hey|start|menu|help|welcome)$/i.test(messageText.trim());
              
              if (isGreeting) {
                console.log('Sending welcome message with main menu');
                replyMessage = WhatsAppTemplates.getMainMenuInteractive(fromNumber);
              } else {
                console.log(`Processing regular message: "${messageText}"`);
                replyMessage = await processMessage(messageText, fromNumber, messageProcessor);
              }
            }
            // Handle interactive message responses
            else if (message.type === 'interactive' && message.interactive) {
              console.log('Processing interactive message');
              replyMessage = await processInteractiveMessage(message.interactive, fromNumber, messageProcessor);
            }
            // Default fallback - send welcome menu for any unrecognized message
            else {
              console.log(`Unrecognized message type: ${message.type}, sending welcome menu`);
              replyMessage = {
                messaging_product: 'whatsapp',
                to: fromNumber,
                type: 'text',
                text: {
                  body: '👋 Welcome to CryptoChap!\n\nYour personal USDC wallet on Base network. Send "menu" to get started or use these commands:\n\n• "balance" - Check wallet balance\n• "address" - Get deposit address\n• "buy 50" - Purchase USDC\n• "help" - Show all commands\n\nWhat would you like to do? 💰'
                }
              };
            }

            console.log('Sending WhatsApp reply:', replyMessage);
            try {
              await sendWhatsAppMessage(replyMessage);
              console.log(`Successfully sent reply to ${fromNumber}`);
            } catch (error) {
              console.error('Failed to send WhatsApp message:', error);
              // Continue processing other messages even if one fails
            }
          }
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}