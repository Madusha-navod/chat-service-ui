import React, { useState } from 'react';

const languages = [
  { name: 'English', code: 'en' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Hindi', code: 'hi' },
  { name: 'French', code: 'fr' },
  { name: 'Chinese', code: 'zh' },
  { name: 'German', code: 'de' },
  { name: 'Spanish', code: 'es' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Korean', code: 'ko' },
  { name: 'Russian', code: 'ru' },
  { name: 'Thai', code: 'th' },
  { name: 'Turkish', code: 'tr' },
];
const chatRooms = ['Tech'];

const PreDashboardSetup = ({ user, onSetupComplete }) => {
  const [room, setRoom] = useState(chatRooms[0]);
  const [language, setLanguage] = useState(languages[0].code);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedLang = languages.find(l => l.code === language);
    onSetupComplete({ room, language: language, languageName: selectedLang.name });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181e29]">
      <div className="bg-[#232b39] rounded-2xl shadow-lg p-10 w-full max-w-md flex flex-col items-center">
        <h2 className="text-3xl font-bold text-blue-400 mb-4">Welcome, {user?.first_name || 'User'}!</h2>
        <p className="text-white text-lg mb-8 text-center">Please select your chat room and language.</p>
        <form className="w-full" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="room" className="block text-white text-sm font-semibold mb-1">Chat Room</label>
            <select
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-[#31394a] text-white focus:outline-none focus:ring-2 focus:ring-blue-400 border-none"
            >
              {chatRooms.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="mb-6">
            <label htmlFor="language" className="block text-white text-sm font-semibold mb-1">Preferred Language</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-[#31394a] text-white focus:outline-none focus:ring-2 focus:ring-blue-400 border-none"
            >
              {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg transition"
          >
            Enter Chat
          </button>
        </form>
      </div>
    </div>
  );
};

export default PreDashboardSetup; 