/**
 * WhatsApp Interactive Message Templates
 * Defines types and structures for WhatsApp Business API interactive messages
 */

/**
 * Base interactive message structure
 */
export interface WhatsAppInteractiveMessage {
  messaging_product: string;
  to: string;
  type: string;
  interactive: WhatsAppInteractive;
}

/**
 * Interactive message content
 */
export interface WhatsAppInteractive {
  type: 'button' | 'list';
  header?: WhatsAppInteractiveHeader;
  body: WhatsAppInteractiveBody;
  footer?: WhatsAppInteractiveFooter;
  action: WhatsAppInteractiveAction;
}

/**
 * Interactive message header
 */
export interface WhatsAppInteractiveHeader {
  type: 'text' | 'image' | 'video' | 'document';
  text?: string;
  image?: {
    link: string;
  };
  video?: {
    link: string;
  };
  document?: {
    link: string;
  };
}

/**
 * Interactive message body
 */
export interface WhatsAppInteractiveBody {
  text: string;
}

/**
 * Interactive message footer
 */
export interface WhatsAppInteractiveFooter {
  text: string;
}

/**
 * Interactive message action
 */
export interface WhatsAppInteractiveAction {
  buttons?: WhatsAppInteractiveButton[];
  button?: string;
  sections?: WhatsAppInteractiveSection[];
}

/**
 * Interactive button
 */
export interface WhatsAppInteractiveButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

/**
 * Interactive list section
 */
export interface WhatsAppInteractiveSection {
  title: string;
  rows: WhatsAppInteractiveRow[];
}

/**
 * Interactive list row
 */
export interface WhatsAppInteractiveRow {
  id: string;
  title: string;
  description?: string;
}

/**
 * Predefined interactive message templates
 */
export class WhatsAppTemplates {
  /**
   * Create a button message template
   */
  static createButtonMessage(
    to: string,
    text: string,
    buttons: { id: string; title: string }[],
    header?: WhatsAppInteractiveHeader,
    footer?: string
  ): WhatsAppInteractiveMessage {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        ...(header && { header }),
        body: {
          text
        },
        ...(footer && {
          footer: {
            text: footer
          }
        }),
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply' as const,
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    };
  }

  /**
   * Create a list message template
   */
  static createListMessage(
    to: string,
    text: string,
    buttonText: string,
    sections: WhatsAppInteractiveSection[],
    header?: WhatsAppInteractiveHeader,
    footer?: string
  ): WhatsAppInteractiveMessage {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        ...(header && { header }),
        body: {
          text
        },
        ...(footer && {
          footer: {
            text: footer
          }
        }),
        action: {
          button: buttonText,
          sections
        }
      }
    };
  }

  /**
   * Create a simple menu with buttons
   */
  static createMenuMessage(to: string): WhatsAppInteractiveMessage {
    return this.createButtonMessage(
      to,
      'Welcome to CryptoChap! Choose an option:',
      [
        { id: 'balance', title: 'Check Balance' },
        { id: 'send', title: 'Send Crypto' },
        { id: 'receive', title: 'Receive Crypto' },
        { id: 'help', title: 'Help' }
      ],
      {
        type: 'text',
        text: '🚀 CryptoChap Menu'
      },
      'Select an option to continue'
    );
  }

  /**
   * Create a confirmation message
   */
  static createConfirmationMessage(
    to: string,
    action: string,
    details: string
  ): WhatsAppInteractiveMessage {
    return this.createButtonMessage(
      to,
      `Confirm ${action}:\n\n${details}`,
      [
        { id: 'confirm', title: '✅ Confirm' },
        { id: 'cancel', title: '❌ Cancel' }
      ],
      {
        type: 'text',
        text: '⚠️ Confirmation Required'
      }
    );
  }
}