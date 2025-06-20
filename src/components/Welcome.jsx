import React from 'react';

const Welcome = ({ onLoginClick, onSignUpClick }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#181e29]">
    <div className="bg-[#232b39] rounded-2xl shadow-lg p-10 w-full max-w-md flex flex-col items-center">
      <h1 className="text-4xl font-extrabold text-blue-400 mb-4">Welcome!</h1>
      <p className="text-white text-lg mb-8 text-center">Welcome to the Chat App. Please login or sign up to continue.</p>
      <div className="flex gap-4 w-full">
        <button
          onClick={onLoginClick}
          className="flex-1 py-3 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg transition"
        >
          Login
        </button>
        <button
          onClick={onSignUpClick}
          className="flex-1 py-3 rounded-md bg-gray-500 hover:bg-gray-600 text-white font-semibold text-lg transition"
        >
          Sign Up
        </button>
      </div>
    </div>
  </div>
);

export default Welcome; 