export interface WhatsAppTemplate {
  name: string;
  language: {
    code: string;
  };
  components?: Array<{
    type: string;
    parameters?: Array<{
      type: string;
      text?: string;
      currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
      };
    }>;
  }>;
}

export interface WhatsAppInteractiveMessage {
  messaging_product: string;
  to: string;
  type: 'interactive';
  interactive: {
    type: 'button' | 'list' | 'flow';
    header?: {
      type: 'text';
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
      sections?: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description: string;
        }>;
      }>;
    };
  };
}

export class WhatsAppTemplates {
  static getWelcomeTemplate(userName: string): WhatsAppTemplate {
    return {
      name: 'welcome_crypto',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: userName
            }
          ]
        }
      ]
    };
  }

  static getTransactionConfirmation(amount: string, currency: string, recipient: string): WhatsAppTemplate {
    return {
      name: 'transaction_confirmation',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'currency',
              currency: {
                fallback_value: `${amount} ${currency}`,
                code: 'USD',
                amount_1000: parseFloat(amount) * 1000
              }
            },
            {
              type: 'text',
              text: recipient
            }
          ]
        }
      ]
    };
  }

  static getMainMenuInteractive(to: string): WhatsAppInteractiveMessage {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '🤖 CryptoChap Menu'
        },
        body: {
          text: 'What would you like to do with your USDC wallet?'
        },
        footer: {
          text: 'Powered by Base Network'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'check_balance',
                title: '💰 Check Balance'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'buy_usdc',
                title: '🛒 Buy USDC'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'send_money',
                title: '📤 Send Money'
              }
            }
          ]
        }
      }
    };
  }

  static getBuyOptionsInteractive(to: string): WhatsAppInteractiveMessage {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: {
          type: 'text',
          text: '🛒 Purchase USDC'
        },
        body: {
          text: 'Choose an amount to purchase:'
        },
        footer: {
          text: 'All amounts in USD'
        },
        action: {
          sections: [
            {
              title: 'Popular Amounts',
              rows: [
                {
                  id: 'buy_25',
                  title: '$25 USDC',
                  description: 'Perfect for getting started'
                },
                {
                  id: 'buy_50',
                  title: '$50 USDC',
                  description: 'Most popular amount'
                },
                {
                  id: 'buy_100',
                  title: '$100 USDC',
                  description: 'Great for regular users'
                },
                {
                  id: 'buy_custom',
                  title: 'Custom Amount',
                  description: 'Enter your own amount'
                }
              ]
            }
          ]
        }
      }
    };
  }

  static getTransactionConfirmInteractive(
    to: string,
    amount: string,
    currency: string,
    recipient: string,
    fee: string
  ): WhatsAppInteractiveMessage {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '📤 Confirm Transfer'
        },
        body: {
          text: `Send ${amount} ${currency} to:\n${recipient.slice(0, 8)}...${recipient.slice(-6)}\n\nNetwork fee: ${fee} ETH\nEstimated total: ${amount} ${currency}`
        },
        footer: {
          text: 'Transaction will be processed on Base network'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'confirm_transfer',
                title: '✅ Confirm'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'cancel_transfer',
                title: '❌ Cancel'
              }
            }
          ]
        }
      }
    };
  }

  static getReceiptInteractive(
    to: string,
    txHash: string,
    amount: string,
    currency: string
  ): WhatsAppInteractiveMessage {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '✅ Transaction Complete'
        },
        body: {
          text: `Successfully sent ${amount} ${currency}\n\nTransaction Hash:\n${txHash.slice(0, 10)}...${txHash.slice(-8)}\n\nStatus: Confirmed ✅`
        },
        footer: {
          text: 'Transaction processed on Base network'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'view_receipt',
                title: '🔍 View on Explorer'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'main_menu',
                title: '🏠 Main Menu'
              }
            }
          ]
        }
      }
    };
  }

  static getErrorInteractive(to: string, errorMessage: string): WhatsAppInteractiveMessage {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '❌ Error Occurred'
        },
        body: {
          text: `Something went wrong:\n\n${errorMessage}\n\nPlease try again or contact support if the issue persists.`
        },
        footer: {
          text: 'CryptoChap Support'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'retry_action',
                title: '🔄 Try Again'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'contact_support',
                title: '📞 Contact Support'
              }
            }
          ]
        }
      }
    };
  }

  static getBalanceInteractive(
    to: string,
    usdcBalance: string,
    ethBalance: string,
    address: string
  ): WhatsAppInteractiveMessage {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '💰 Your Wallet Balance'
        },
        body: {
          text: `USDC: ${usdcBalance}\nETH: ${ethBalance}\n\nWallet Address:\n${address.slice(0, 8)}...${address.slice(-6)}\n\nNetwork: Base`
        },
        footer: {
          text: 'Real-time balance on Base network'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'refresh_balance',
                title: '🔄 Refresh'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'buy_more',
                title: '🛒 Buy More'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'send_money',
                title: '📤 Send Money'
              }
            }
          ]
        }
      }
    };
  }
}