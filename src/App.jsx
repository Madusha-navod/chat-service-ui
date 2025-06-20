import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SignUp from './components/SignUp';
import Welcome from './components/Welcome';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authPage, setAuthPage] = useState('welcome'); // 'welcome', 'login', 'signup'
  const [user, setUser] = useState(null); // Store user info

  const handleLogin = (userInfo) => {
    setUser(userInfo);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setAuthPage('welcome');
  };

  const handleSwitchToSignUp = () => {
    setAuthPage('signup');
  };

  const handleSwitchToLogin = () => {
    setAuthPage('login');
  };

  const handleSignUp = (userInfo) => {
    setUser(userInfo);
    setAuthPage('login');
  };

  const handleSwitchToWelcome = () => {
    setAuthPage('welcome');
  };

  return (
    <div>
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} user={user} />
      ) : authPage === 'welcome' ? (
        <Welcome onLoginClick={handleSwitchToLogin} onSignUpClick={handleSwitchToSignUp} />
      ) : authPage === 'login' ? (
        <Login onLogin={handleLogin} onSwitchToSignUp={handleSwitchToSignUp} onSwitchToWelcome={handleSwitchToWelcome} />
      ) : (
        <SignUp onSignUp={handleSignUp} onSwitchToLogin={handleSwitchToLogin} onSwitchToWelcome={handleSwitchToWelcome} />
      )}
    </div>
  );
}

export default App; 