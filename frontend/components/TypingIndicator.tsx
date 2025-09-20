'use client';

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4 px-1.5 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700 max-w-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-whatsapp-green to-whatsapp-green-dark flex items-center justify-center text-white">
            <span className="text-sm">🤖</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-whatsapp-green dark:text-whatsapp-green-light">
              CryptoChap Bot
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">typing</span>
              <div className="flex space-x-1 ml-1">
                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce animation-delay-0"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce animation-delay-150"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce animation-delay-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}