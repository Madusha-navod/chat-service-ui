import React, { useState, useRef, useEffect } from 'react';
import { SOCKET_URL, CHAT_UPLOAD_URL } from '../constants';
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
  const [file, setFile] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('chatSettings'));
    if (settings) {
      // Connect to socket server
      socketRef.current = io(SOCKET_URL);
      socketRef.current.emit('joinRoom', {
        room: settings.room,
        language: settings.language,
        first_name: user?.first_name || '',
        last_name: user?.last_name || ''
      });
      // Listen for new messages
      socketRef.current.on('newMessage', (data) => {
        const sender = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        const currentUser = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
        if (sender !== currentUser) {
          setMessages((prev) => [
            ...prev,
            {
              id: prev.length + 1,
              text: data.message,
              sender,
              first_name: data.first_name,
              last_name: data.last_name,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              self: false,
              sentiment_score: data.sentiment_score ?? null
            }
          ]);
        } else {
          // Update the last message (optimistically sent) with the sentiment score from the server
          setMessages((prev) => {
            const lastIdx = prev.length - 1;
            if (lastIdx < 0) return prev;
            const lastMsg = prev[lastIdx];
            // Optionally, check text match or other fields for more robust matching
            if (lastMsg.self && lastMsg.text === data.message && lastMsg.sentiment_score === null) {
              const updatedMsg = { ...lastMsg, sentiment_score: data.sentiment_score ?? null };
              return [...prev.slice(0, lastIdx), updatedMsg];
            }
            return prev;
          });
        }
      });
      socketRef.current.on('newFile', (data) => {
        // Do not echo own file
        const sender = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        const currentUser = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
        if (sender !== currentUser) {
          setMessages((prev) => [
            ...prev,
            {
              id: prev.length + 1,
              text: '',
              fileName: data.fileName,
              fileType: data.fileType,
              fileData: data.fileData,
              sender,
              first_name: data.first_name,
              last_name: data.last_name,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              self: false
            }
          ]);
        }
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

  // Helper to map sentiment score to label
  function getSentimentLabel(score) {
    if (score === null || score === undefined) return { label: '', score: null };
    if (score > 1) return { label: '🙂 Positive', score };
    if (score < -1) return { label: '🙁 Negative', score };
    return { label: '😐 Neutral', score };
  }

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // We'll optimistically set sentiment_score to null until server responds
      const userMsg = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'You',
        time,
        self: true,
        sentiment_score: null // placeholder until server returns
      };
      setMessages(prev => [...prev, userMsg]);
      setNewMessage('');
      // Emit to server
      const settings = JSON.parse(localStorage.getItem('chatSettings'));
      if (socketRef.current && settings) {
        socketRef.current.emit('sendMessage', {
          room: settings.room,
          message: newMessage,
          language: settings.language,
          first_name: user?.first_name || '',
          last_name: user?.last_name || ''
        });
      }
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSendFile = async (e) => {
    e.preventDefault();
    if (!file) return;
    const settings = JSON.parse(localStorage.getItem('chatSettings'));
    // Only handle images for this flow
    if (file.type && file.type.startsWith('image/')) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch(CHAT_UPLOAD_URL, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        const imageUrl = data.path;
        // Emit image URL to chat group
        if (socketRef.current && settings) {
          socketRef.current.emit('sendFile', {
            room: settings.room,
            language: settings.language,
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            fileName: file.name,
            fileType: file.type,
            fileData: imageUrl, // Now this is a URL, not base64
          });
        }
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            text: '',
            fileName: file.name,
            fileType: file.type,
            fileData: imageUrl,
            sender: 'You',
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            self: true
          }
        ]);
        setFile(null);
      } catch (err) {
        alert('Image upload failed.');
      }
    } else {
      // Fallback: send as base64 for non-images (existing logic)
      const reader = new FileReader();
      reader.onload = function(evt) {
        if (socketRef.current && settings) {
          socketRef.current.emit('sendFile', {
            room: settings.room,
            language: settings.language,
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            fileName: file.name,
            fileType: file.type,
            fileData: evt.target.result // base64
          });
        }
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            text: '',
            fileName: file.name,
            fileType: file.type,
            fileData: evt.target.result,
            sender: 'You',
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            self: true
          }
        ]);
        setFile(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to highlight @mentions
  function renderMessageText(text, darkMode) {
    if (!text) return null;
    return text.split(/(\s+)/).map((part, i) => {
      if (/^@\w+/.test(part)) {
        return <span key={i} className={darkMode ? 'bg-yellow-700 text-yellow-200 px-1 rounded' : 'bg-blue-100 text-blue-700 px-1 rounded'}>{part}</span>;
      }
      return part;
    });
  }

  return (
    <div className={
      `${darkMode ? 'dark' : ''} min-h-screen font-sans ` +
      (darkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-[#181e29] via-[#232b39] to-[#1e2746]')
    }>
      {/* App Bar */}
      <div className={
        `w-full h-16 flex items-center px-6 shadow-lg relative z-10 ` +
        (darkMode
          ? 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900'
          : 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500')
      }>
        <span className="text-white text-2xl font-bold tracking-wide flex-1">Chat App</span>
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode((v) => !v)}
          className={
            `mr-4 w-10 h-10 rounded-full flex items-center justify-center border-2 transition ` +
            (darkMode
              ? 'bg-gray-700 border-gray-400 text-yellow-300 hover:bg-gray-600'
              : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-100')
          }
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>
          )}
        </button>
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
      <div className={
        `w-full flex justify-center items-center py-2 shadow ` +
        (darkMode ? 'bg-gray-800' : 'bg-[#232b39]')
      }>
        <span className="text-white text-base font-semibold mr-6">Room: <span className={darkMode ? 'text-yellow-300' : 'text-blue-300'}>{chatSettings.room}</span></span>
        <span className="text-white text-base font-semibold">Language: <span className={darkMode ? 'text-yellow-300' : 'text-blue-300'}>{chatSettings.languageName}</span></span>
      </div>

      <div className="flex flex-col items-center justify-center py-10 px-2 min-h-[calc(100vh-64px)]">
        <h1 className="text-4xl font-extrabold text-white mb-8 drop-shadow">Group Chat</h1>
        <div className={
          (darkMode ? 'bg-gray-900/80 backdrop-blur-md border-gray-700' : 'bg-white/80 backdrop-blur-md border-blue-100') +
          ' rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col min-h-[500px] border'
        } style={{ height: 520 }}>
          <div className={
            'flex-1 overflow-y-auto p-6 ' + (darkMode ? 'text-gray-100' : '')
          } style={{ minHeight: 0 }}>
            {messages.map((msg) => (
              <>
                <div key={msg.id} className={`mb-8 flex ${msg.self ? 'justify-end' : 'justify-start'} w-full`}>
                  <div className="relative flex flex-col w-fit min-w-[120px]">
                    <div className={
                      `relative max-w-md px-6 py-4 shadow-md font-medium ` +
                      (msg.self
                        ? (darkMode ? 'bg-gradient-to-br from-yellow-600 to-yellow-500 text-white rounded-2xl rounded-br-none' : 'bg-gradient-to-br from-blue-500 to-blue-400 text-white rounded-2xl rounded-br-none')
                        : (darkMode ? 'bg-gray-800 text-gray-100 rounded-2xl rounded-bl-none border border-gray-700' : 'bg-white text-gray-900 rounded-2xl rounded-bl-none border border-blue-100'))
                    }>
                      {msg.self ? (
                        <span className="absolute right-0 top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-blue-400"></span>
                      ) : (
                        <span className="absolute left-0 top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></span>
                      )}
                      <div className="text-base break-words leading-relaxed">
                        {renderMessageText(msg.text, darkMode)}
                        {msg.fileName && (
                          <div className="mt-2">
                            {msg.fileType && msg.fileType.startsWith('image/') ? (
                              // If fileData is a URL, use it directly; if base64, use as before
                              <img src={msg.fileData} alt={msg.fileName} className="max-w-xs max-h-48 rounded shadow border mb-2" />
                            ) : null}
                            <a href={msg.fileData} download={msg.fileName} className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">
                              {msg.fileName}
                            </a>
                          </div>
                        )}
                      </div>
                      <div className={
                        `text-xs mt-3 flex flex-row justify-between items-center gap-4 ` +
                        (msg.self ? (darkMode ? 'text-yellow-200' : 'text-blue-100') : (darkMode ? 'text-gray-400' : 'text-gray-500'))
                      }>
                        <span className="text-xs font-light opacity-80">{msg.time}</span>
                        {msg.sentiment_score !== null && msg.sentiment_score !== undefined && (
                          <span className="ml-2 font-semibold px-2 py-0.5 rounded-full bg-white/20 dark:bg-gray-700/40 text-base flex items-center" style={{minWidth: 80, justifyContent: 'flex-end'}}>{getSentimentLabel(msg.sentiment_score).label}</span>
                        )}
                      </div>
                      <div className={`text-xs flex flex-col gap-1 mt-1 ${msg.self ? (darkMode ? 'items-end' : 'items-end') : (darkMode ? 'items-start' : 'items-start')}`}>
                        <span className={
                          msg.self
                            ? (darkMode ? 'text-yellow-300 font-bold text-[13px]' : 'text-blue-700 font-bold text-[13px]')
                          : (darkMode ? 'text-blue-200 font-bold text-[13px]' : 'text-blue-700 font-bold text-[13px]')
                        }>
                          {msg.self ? 'You' : `${msg.first_name || ''} ${msg.last_name || ''}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className={
            `border-t flex items-center gap-2 px-4 py-3 rounded-b-3xl ` +
            (darkMode ? 'border-gray-700 bg-gray-900/70' : 'border-blue-100/60 bg-white/70 backdrop-blur')
          }>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded-full border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 bg-white/80 font-medium shadow-sm"
            />
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-3 py-2 rounded-full mr-2">
              📎
            </label>
            {file && (
              <span className="text-sm text-gray-700 bg-gray-100 rounded px-2 py-1 mr-2">{file.name}</span>
            )}
            <button
              type="button"
              onClick={handleSendFile}
              disabled={!file}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition text-white text-md shadow-md ${file ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              Send File
            </button>
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
