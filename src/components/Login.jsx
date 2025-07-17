import React, { useState } from 'react';
import { LOGIN_URL } from '../constants';

const Login = ({ onLogin, onSwitchToSignUp, onSwitchToWelcome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid email or password.');
        return;
      }
      // Login successful, get user info
      const userInfo = await response.json();
      onLogin(userInfo);
    } catch (err) {
      setError('Network error. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181e29]">
      <div className="bg-[#232b39] rounded-2xl shadow-lg p-10 w-full max-w-md flex flex-col items-center">
        <h2 className="text-3xl font-bold text-blue-400 mb-8">Login</h2>
        <form className="w-full" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="email" className="block text-white text-sm font-semibold mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 rounded-md bg-[#31394a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 border-none"
            />
          </div>
          <div className="mb-6 relative">
            <label htmlFor="password" className="block text-white text-sm font-semibold mb-1">Password</label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 rounded-md bg-[#31394a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 border-none pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-9 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                // Eye-off SVG
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.234.938-4.675M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.062-4.675A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.675-.938M3 3l18 18" /></svg>
              ) : (
                // Eye SVG
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" /></svg>
              )}
            </button>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg transition mb-4"
          >
            Login
          </button>
        </form>
        <div className="text-center text-sm mb-2">
          <span className="text-blue-300">Don't have an account?</span>
          <button className="ml-1 text-white font-semibold hover:underline" onClick={onSwitchToSignUp}>Sign Up</button>
        </div>
        <button className="text-white text-sm hover:underline mt-2" onClick={onSwitchToWelcome}>Back to Welcome</button>
      </div>
    </div>
  );
};

export default Login; 