import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SignUp from './components/SignUp';
import Welcome from './components/Welcome';
import PreDashboardSetup from './components/PreDashboardSetup';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authPage, setAuthPage] = useState('welcome'); // 'welcome', 'login', 'signup'
  const [user, setUser] = useState(null); // Store user info
  const [setupComplete, setSetupComplete] = useState(false);

  const handleLogin = (userInfo) => {
    setUser(userInfo);
    setIsLoggedIn(true);
    setSetupComplete(false); // Reset setup status on new login
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setSetupComplete(false);
    localStorage.removeItem('chatSettings');
    setAuthPage('welcome');
  };

  const handleSwitchToSignUp = () => {
    setAuthPage('signup');
  };

  const handleSwitchToLogin = () => {
    setAuthPage('login');
  };

  const handleSignUp = (userInfo) => {
    // You might want to automatically log in the user here,
    // but for now, we just go to the login page.
    setAuthPage('login');
  };

  const handleSwitchToWelcome = () => {
    setAuthPage('welcome');
  };

  const handleSetupComplete = (settings) => {
    // settings: { room, language, languageName }
    localStorage.setItem('chatSettings', JSON.stringify(settings));
    setSetupComplete(true);
  };

  return (
    <div>
      {isLoggedIn ? (
        setupComplete ? (
          <Dashboard onLogout={handleLogout} user={user} />
        ) : (
          <PreDashboardSetup user={user} onSetupComplete={handleSetupComplete} />
        )
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