-- Database schema for CryptoChap
-- Run this script to initialize the database

-- Create database (run this manually if needed)
-- CREATE DATABASE cryptochap;

-- Use the database
-- \c cryptochap;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    whatsapp_id VARCHAR(50) UNIQUE NOT NULL,
    wallet_address VARCHAR(100),
    preferences JSONB DEFAULT '{
        "defaultCurrency": "USDC",
        "notifications": true,
        "language": "en",
        "timezone": "UTC"
    }'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(100) NOT NULL,
    network VARCHAR(50) NOT NULL DEFAULT 'base',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, address, network)
);

-- Create wallet_balances table
CREATE TABLE IF NOT EXISTS wallet_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    amount VARCHAR(100) NOT NULL DEFAULT '0',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_id, currency)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('send', 'receive', 'buy', 'sell', 'swap', 'deposit', 'withdraw')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    amount VARCHAR(100) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    from_address VARCHAR(100),
    to_address VARCHAR(100),
    network VARCHAR(50) NOT NULL DEFAULT 'base',
    tx_hash VARCHAR(200),
    gas_used VARCHAR(50),
    gas_price VARCHAR(50),
    fee VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'document', 'audio', 'location', 'contact', 'sticker', 'interactive')),
    content JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    message_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_tokens table for secure token storage
CREATE TABLE IF NOT EXISTS api_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    encrypted_token TEXT NOT NULL,
    iv VARCHAR(32) NOT NULL,
    auth_tag VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_valid BOOLEAN DEFAULT true,
    UNIQUE(type, created_at)
);

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(100) NOT NULL,
    endpoint VARCHAR(200) NOT NULL,
    requests INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, endpoint, window_start)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_id ON users(whatsapp_id);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_wallet_id ON wallet_balances(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_api_tokens_type ON api_tokens(type);
CREATE INDEX IF NOT EXISTS idx_api_tokens_valid ON api_tokens(is_valid);
CREATE INDEX IF NOT EXISTS idx_api_tokens_expires ON api_tokens(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_tokens_updated_at BEFORE UPDATE ON api_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default commands
INSERT INTO commands (name, description, parameters, handler) VALUES
('balance', 'Check wallet balance', '[]', 'balance'),
('send', 'Send cryptocurrency', '[{"name": "amount", "type": "amount", "required": true}, {"name": "currency", "type": "string", "required": true}, {"name": "to", "type": "address", "required": true}]', 'send'),
('buy', 'Buy cryptocurrency', '[{"name": "amount", "type": "amount", "required": true}]', 'buy'),
('address', 'Get wallet address', '[]', 'address'),
('history', 'View transaction history', '[{"name": "count", "type": "number", "required": false}]', 'history'),
('help', 'Show available commands', '[]', 'help'),
('menu', 'Show interactive menu', '[]', 'menu'),
('price', 'Get cryptocurrency price', '[{"name": "token", "type": "string", "required": false}]', 'price'),
('settings', 'Manage user settings', '[]', 'settings')
ON CONFLICT (name) DO NOTHING;

-- Insert sample data for testing (optional)
-- You can uncomment these lines for development/testing

/*
-- Sample user
INSERT INTO users (phone_number, whatsapp_id, wallet_address) VALUES
('1234567890', '1234567890@c.us', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e');

-- Sample wallet
INSERT INTO wallets (user_id, address, network) VALUES
((SELECT id FROM users WHERE whatsapp_id = '1234567890@c.us'), '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'base');

-- Sample wallet balance
INSERT INTO wallet_balances (wallet_id, currency, amount) VALUES
((SELECT id FROM wallets WHERE address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'), 'USDC', '1000.00'),
((SELECT id FROM wallets WHERE address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'), 'ETH', '0.5');

-- Sample transaction
INSERT INTO transactions (user_id, type, status, amount, currency, network, metadata) VALUES
((SELECT id FROM users WHERE whatsapp_id = '1234567890@c.us'), 'receive', 'completed', '100.00', 'USDC', 'base', '{"description": "Sample transaction"}');
*/