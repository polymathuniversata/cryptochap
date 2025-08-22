'use client';

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="typing-indicator shadow-message">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>CryptoChap is typing</span>
          <div className="flex gap-1 ml-2">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
      </div>
    </div>
  );
}