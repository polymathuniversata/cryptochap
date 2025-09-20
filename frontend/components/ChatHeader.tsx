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
    <div className="bg-gradient-to-r from-whatsapp-green to-whatsapp-green-dark dark:from-gray-800 dark:to-gray-900 text-white px-4 py-3 flex items-center justify-between shadow-lg relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl"></div>
      </div>
      
      {/* Left Section */}
      <div className="flex items-center gap-4 relative z-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/20 active:bg-white/10 rounded-full transition-all duration-200 lg:hidden transform hover:scale-105 active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        
        {/* Avatar */}
        <div className="relative group">
          <div className="w-11 h-11 bg-gradient-to-br from-whatsapp-green-dark to-whatsapp-green-light dark:from-gray-700 dark:to-gray-900 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg">
            <div className="relative text-2xl -mt-0.5">🤖</div>
          </div>
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full shadow-sm"></div>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex flex-col min-w-0">
          <h3 className="font-semibold text-white truncate flex items-center">
            {contactName}
            <span className="ml-2 bg-white/20 text-xs px-1.5 py-0.5 rounded text-white/90 font-normal">Bot</span>
          </h3>
          <p className="text-xs text-white/90 truncate flex items-center">
            {isOnline ? (
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="font-medium">{contactStatus}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span className="font-medium">{contactStatus}</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 relative z-10">
        <button className="p-2 hover:bg-white/20 active:bg-white/10 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95">
          <Video size={18} className="opacity-80 hover:opacity-100 transition-opacity" />
        </button>
        <button className="p-2 hover:bg-white/20 active:bg-white/10 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95">
          <Phone size={18} className="opacity-80 hover:opacity-100 transition-opacity" />
        </button>
        <button className="p-2 hover:bg-white/20 active:bg-white/10 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95">
          <MoreVertical size={18} className="opacity-80 hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  );
}