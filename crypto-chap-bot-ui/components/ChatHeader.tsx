'use client';

import { ArrowLeft, MoreVertical, Video, Phone } from 'lucide-react';
import Image from 'next/image';

interface ChatHeaderProps {
  contactName: string;
  contactStatus: string;
  isOnline: boolean;
  onBack?: () => void;
}

export default function ChatHeader({ 
  contactName, 
  contactStatus, 
  isOnline,
  onBack 
}: ChatHeaderProps) {
  return (
    <div className="bg-whatsapp-green text-white px-4 py-3 flex items-center justify-between shadow-whatsapp">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors lg:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 bg-whatsapp-green-dark rounded-full flex items-center justify-center text-white font-semibold text-lg">
            🤖
          </div>
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex flex-col min-w-0">
          <h3 className="font-medium text-white truncate">{contactName}</h3>
          <p className="text-xs text-white/80 truncate">
            {isOnline ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {contactStatus}
              </span>
            ) : (
              contactStatus
            )}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Video size={20} />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Phone size={20} />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
}