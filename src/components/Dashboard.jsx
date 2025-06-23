import React, { useState, useRef, useEffect } from 'react';
import { SOCKET_URL } from '../constants';
import { io } from 'socket.io-client';

const initialMessages = [
  { id: 1, text: "Welcome to the group chat!", sender: "System", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), self: false }
];

const Dashboard = ({ onLogout, user }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const [chatSettings] = useState(() => {
    return (
      JSON.parse(localStorage.getItem('chatSettings')) || { room: '', language: '', languageName: '' }
    );
  });

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('chatSettings'));
    if (settings) {
      // Connect to socket server
      socketRef.current = io(SOCKET_URL);
      socketRef.current.emit('joinRoom', { room: settings.room, language: settings.language });
      // Listen for new messages
      socketRef.current.on('newMessage', (data) => {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: data.message,
            sender: data.sender,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            self: false
          }
        ]);
      });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMsg = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'You',
        time,
        self: true
      };
      setMessages(prev => [...prev, userMsg]);
      setNewMessage('');
      // Emit to server
      const settings = JSON.parse(localStorage.getItem('chatSettings'));
      if (socketRef.current && settings) {
        socketRef.current.emit('sendMessage', { room: settings.room, message: newMessage, language: settings.language });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181e29] via-[#232b39] to-[#1e2746] font-sans">
      {/* App Bar */}
      <div className="w-full h-16 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 flex items-center px-6 shadow-lg relative z-10">
        <span className="text-white text-2xl font-bold tracking-wide flex-1">Chat App</span>
        {/* Profile Avatar */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(v => !v)}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white hover:ring-2 hover:ring-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
            title="User profile"
          >
            <span>{user?.first_name ? user.first_name[0].toUpperCase() : 'U'}</span>
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl py-2 z-20 border border-gray-100 animate-fade-in">
              <div className="px-4 py-3 text-gray-700 text-sm font-semibold border-b flex items-center gap-2">
                <span className="inline-block w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{user?.first_name ? user.first_name[0].toUpperCase() : 'U'}</span>
                {user?.email || 'user@gmail.com'}
              </div>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-3 text-red-600 hover:bg-gray-100 text-sm font-semibold rounded-b-xl"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Chat Room and Language Info */}
      <div className="w-full flex justify-center items-center py-2 bg-[#232b39] shadow">
        <span className="text-white text-base font-semibold mr-6">Room: <span className="text-blue-300">{chatSettings.room}</span></span>
        <span className="text-white text-base font-semibold">Language: <span className="text-blue-300">{chatSettings.languageName}</span></span>
      </div>

      <div className="flex flex-col items-center justify-center py-10 px-2 min-h-[calc(100vh-64px)]">
        <h1 className="text-4xl font-extrabold text-white mb-8 drop-shadow">Group Chat</h1>
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col min-h-[500px] border border-blue-100" style={{ height: 520 }}>
          <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`mb-8 flex ${msg.self ? 'justify-end' : 'justify-start'} w-full`}>
                <div className="relative flex flex-col w-fit min-w-[120px]">
                  <div className={`relative max-w-md ${msg.self ? 'bg-gradient-to-br from-blue-500 to-blue-400 text-white rounded-2xl rounded-br-none' : 'bg-white text-gray-900 rounded-2xl rounded-bl-none border border-blue-100'} px-6 py-4 shadow-md font-medium`}>
                    {msg.self ? (
                      <span className="absolute right-0 top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-blue-400"></span>
                    ) : (
                      <span className="absolute left-0 top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></span>
                    )}
                    <div className="text-base break-words leading-relaxed">{msg.text}</div>
                    <div className={`text-xs mt-3 flex items-center gap-2 ${msg.self ? 'justify-end text-blue-100' : 'justify-start text-gray-500'}`}>
                      {msg.sender} &bull; {msg.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="border-t border-blue-100/60 bg-white/70 backdrop-blur flex items-center gap-2 px-4 py-3 rounded-b-3xl">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded-full border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 bg-white/80 font-medium shadow-sm"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition text-white text-lg shadow-md ${newMessage.trim() ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
