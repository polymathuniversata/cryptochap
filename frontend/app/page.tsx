'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { MessageCircle, Shield, Zap, Globe, ArrowRight } from 'lucide-react';

export default function Home() {
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return <ChatInterface onBack={() => setShowChat(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-whatsapp-green via-whatsapp-green-dark to-crypto-base">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen text-white px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo/Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-4">
              <span className="text-4xl">🔗</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              CryptoChap
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-2">
              WhatsApp-native USDC on Base
            </p>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Send, receive, and buy USDC on Base network through WhatsApp chat
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="glass-morphism rounded-2xl p-6 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-whatsapp-green" />
              <h3 className="font-semibold mb-2 text-gray-900">WhatsApp First</h3>
              <p className="text-sm text-gray-700">Native chat interface for all crypto operations</p>
            </div>

            <div className="glass-morphism rounded-2xl p-6 text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-crypto-base" />
              <h3 className="font-semibold mb-2 text-gray-900">Base Network</h3>
              <p className="text-sm text-gray-700">Fast, low-cost USDC transfers</p>
            </div>

            <div className="glass-morphism rounded-2xl p-6 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="font-semibold mb-2 text-gray-900">Auto Wallet</h3>
              <p className="text-sm text-gray-700">Unique wallet generated per user</p>
            </div>

            <div className="glass-morphism rounded-2xl p-6 text-center">
              <Globe className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="font-semibold mb-2 text-gray-900">Global Access</h3>
              <p className="text-sm text-gray-700">Mobile money & card support</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="space-y-6">
            <button
              onClick={() => setShowChat(true)}
              className="group bg-white text-whatsapp-green px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/90 transition-all duration-300 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Chatting
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Live Demo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Base Testnet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>No Signup Required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Supported Commands Preview */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="glass-morphism rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 text-center">Supported Commands</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-white/50 rounded-lg p-3">
                <code className="text-whatsapp-green-dark font-mono">balance</code>
                <span className="text-gray-700 ml-2">Check USDC & ETH balance</span>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <code className="text-whatsapp-green-dark font-mono">address</code>
                <span className="text-gray-700 ml-2">Get deposit address</span>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <code className="text-whatsapp-green-dark font-mono">buy 50</code>
                <span className="text-gray-700 ml-2">Purchase USDC</span>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <code className="text-whatsapp-green-dark font-mono">send 10 USDC to 0x...</code>
                <span className="text-gray-700 ml-2">Transfer tokens</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
        Built with ❤️ for global financial inclusion
      </div>
    </div>
  );
}