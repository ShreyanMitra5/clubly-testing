"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { XIcon } from '@heroicons/react/outline';
import { ChatAlt2Icon, PaperAirplaneIcon, MicrophoneIcon, EmojiHappyIcon } from '@heroicons/react/solid';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  system?: boolean;
}

export default function ClubAdvisorPage() {
  const params = useParams();
  const router = useRouter();
  const clubName = decodeURIComponent(params.clubName as string);
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello! I'm your AI Club Advisor for ${clubName}. I'm here to help you plan exciting events, manage your club activities, and provide guidance on running a successful club. What would you like to discuss today?`,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from localStorage
  useEffect(() => {
    if (!user) return;
    const key = `advisorChatHistory_${user.id}_${clubName}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setMessages(JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    }
  }, [user, clubName]);

  // Save chat history to localStorage
  useEffect(() => {
    if (!user) return;
    const key = `advisorChatHistory_${user.id}_${clubName}`;
    localStorage.setItem(key, JSON.stringify(messages));
  }, [messages, user, clubName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/clubs/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          clubName: clubName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm here to help! What would you like to know about managing your club?",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }).toLowerCase();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Chat Card */}
      <div className="w-full max-w-4xl h-[85vh] flex flex-col rounded-2xl shadow-2xl bg-white overflow-hidden relative mx-4 md:mx-auto" style={{ minWidth: 350 }}>
        {/* Back to Club Features Button */}
        <button
          className="px-5 py-2 rounded-lg border border-blue-200 bg-white text-blue-700 font-medium shadow hover:bg-blue-50 transition m-4 self-start"
          onClick={() => router.push(`/clubs/${encodeURIComponent(clubName)}`)}
        >
          ← Back to Club Features
        </button>
        {/* Header */}
        <div className="flex flex-col bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Image 
                  src="/logo-rounded.png" 
                  alt="Club Logo" 
                  width={40} 
                  height={40} 
                  className="rounded-full border-2 border-indigo-100 bg-white"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">AI Club Advisor</h1>
                <p className="text-sm text-gray-500">{clubName}</p>
              </div>
            </div>
            <button 
              onClick={() => router.back()} 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <XIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>
          <div className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Online</span>
            </div>
            <span className="text-indigo-200">•</span>
            <span className="text-indigo-50 text-xs">Instant responses</span>
          </div>
        </div>

        {/* Chat Area */}
        <div 
          className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-gradient-to-b from-gray-50 to-white" 
          style={{scrollBehavior: 'smooth'}}
        >
          {messages.map((message, idx) => (
            <div 
              key={message.id} 
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} w-full animate-fade-in`}
            >
              {message.system ? (
                <div className="bg-gray-100 text-gray-500 text-xs px-4 py-2 rounded-lg max-w-[80%] shadow-sm">
                  {message.content}
                  <div className="text-[10px] text-gray-400 mt-1">{formatTime(message.timestamp)}</div>
                </div>
              ) : message.isUser ? (
                <div className="flex flex-col items-end max-w-[80%]">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white px-5 py-3 rounded-2xl rounded-br-sm shadow-sm text-sm">
                    {message.content}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 pr-1">{formatTime(message.timestamp)}</div>
                </div>
              ) : (
                <div className="flex items-end max-w-[80%] group">
                  <div className="relative flex-shrink-0">
                    <Image 
                      src="/logo-rounded.png" 
                      alt="Clubly Logo" 
                      width={32} 
                      height={32} 
                      className="rounded-full border-2 border-indigo-100 bg-white mr-3 transition-transform duration-200 group-hover:scale-110" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="bg-white border border-gray-100 text-gray-900 px-5 py-3 rounded-2xl rounded-bl-sm shadow-sm text-sm">
                      {message.content}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 pl-1">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start w-full animate-fade-in">
              <div className="relative flex-shrink-0">
                <Image 
                  src="/logo-rounded.png" 
                  alt="Clubly Logo" 
                  width={32} 
                  height={32} 
                  className="rounded-full border-2 border-indigo-100 bg-white mr-3" 
                />
              </div>
              <div className="bg-white border border-gray-100 px-6 py-4 rounded-2xl rounded-bl-sm shadow-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-100 bg-white px-6 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <button 
              type="button" 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-400 hover:text-gray-600"
            >
              <EmojiHappyIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-5 py-3 bg-gray-50 rounded-full pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-shadow duration-200"
                disabled={isLoading}
                style={{ fontFamily: 'Inter, sans-serif' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { handleSubmit(e); } }}
              />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 text-gray-400 hover:text-gray-600"
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 active:scale-95"
            >
              <PaperAirplaneIcon className="w-6 h-6 rotate-90" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 