import { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './services/AuthContext';
import { applicationAPI } from './services/api';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import Dashboard from './components/Dashboard';
import JobSeekerDashboard from './components/JobSeekerDashboard';
import EmployerDashboard from './components/EmployerDashboard';
import Profile from './components/Profile';
import LoadingScreen from './components/LoadingScreen';
import BackendLoadingScreen from './components/BackendLoadingScreen';
import Footer from './components/Footer';
import Homepage from './components/Homepage';

const AppContent = () => {
  const [currentView, setCurrentView] = useState('homepage');
  const [dashboardView, setDashboardView] = useState('dashboard'); // dashboard, profile
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(true);
  const { user, isAuthenticated, loading, logout } = useAuth();
  const userMenuRef = useRef(null);
  const hasForcedDashboardRef = useRef(false);

  // Check backend health on app load
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "https://jobnova-mphs.onrender.com";

const response = await fetch(`${API_URL}/api/health`, {
  method: "GET",
        });
        if (response.ok) {
          setBackendReady(true);
        }
      } catch (error) {
        console.log('Backend still starting...');
        // Backend not ready yet, loading screen will handle retries
      } finally {
        setCheckingBackend(false);
      }
    };

    checkBackendHealth();
  }, []);

  const handleBackendReady = () => {
    setBackendReady(true);
    setCheckingBackend(false);
  };

  const handleAuthSuccess = () => {
    // When authentication succeeds, drop the user into their dashboard view
    setCurrentView('dashboard');
    setDashboardView('dashboard');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user && !hasForcedDashboardRef.current) {
      setCurrentView('dashboard');
      hasForcedDashboardRef.current = true;
    }

    if (!isAuthenticated) {
      hasForcedDashboardRef.current = false;
    }
  }, [isAuthenticated, user]);


  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      setDashboardView('dashboard');
      setCurrentView('homepage');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error logging out. Please try again.');
    }
  };

  if (loading) {
    return <LoadingScreen message="Initializing your workspace..." />;
  }

  // Show backend loading screen if backend is not ready and user is authenticated
  if (isAuthenticated && !backendReady) {
    return <BackendLoadingScreen onBackendReady={handleBackendReady} />;
  }

  
  if (isAuthenticated && user) {
    
    const NavHeader = () => (
      <div className="bg-white/95 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4 group cursor-pointer" onClick={() => setCurrentView('homepage')}>
                <div className="relative">
                  <img 
                    src="/images/JobNovalogo.png" 
                    alt="JobNova Logo" 
                    className="h-12 w-12 rounded-xl shadow-lg ring-2 ring-blue-100 group-hover:ring-blue-300 transition-all duration-300 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-purple-700 transition-all duration-300">JobNova</h1>
                  <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors duration-300">Professional Job Portal</p>
                </div>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-2 ml-8">
                <button
                  onClick={() => setCurrentView('homepage')}
                  className="px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setDashboardView('dashboard');
                  }}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                    dashboardView === 'dashboard'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setDashboardView('profile');
                  }}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    dashboardView === 'profile'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Profile
                </button>
                
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-500 hover:text-blue-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {(user.name || user.firstName || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name || user.firstName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user.role || 'User'}</p>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>


                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name || user.firstName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-blue-600 capitalize">{user.role} Account</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setDashboardView('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile Settings</span>
                    </button>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 pt-4 pb-3">
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setCurrentView('homepage');
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    setDashboardView('dashboard');
                    setCurrentView('dashboard');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    dashboardView === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setDashboardView('profile');
                    setCurrentView('dashboard');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    dashboardView === 'profile'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Profile
                </button>
                
              </div>
            </div>
          )}
        </div>
      </div>
    );

    return (
      <div>
        <NavHeader />
        {currentView === 'homepage' ? (
          <Homepage 
            onSignIn={() => setCurrentView('signin')}
            onSignUp={() => setCurrentView('signup')}
            onPostJob={() => setCurrentView('signup')}
            showStandaloneHeader={false}
          />
        ) : dashboardView === 'profile' ? (
          <Profile userType={user.role} />
        ) : user.role === 'employer' ? (
          <EmployerDashboard onNavigateHome={() => setCurrentView('homepage')} />
        ) : (
          <JobSeekerDashboard onNavigateHome={() => setCurrentView('homepage')} />
        )}

        {/* Notification Panel */}

        <Footer />
      </div>
    );
  }

  return (
    <div>
      {currentView === 'homepage' ? (
        <div>
          <Homepage 
            onSignIn={() => setCurrentView('signin')}
            onSignUp={() => setCurrentView('signup')}
            onPostJob={() => setCurrentView('signup')}
          />
          <Footer />
        </div>
      ) : (
        <div className="min-h-screen relative">
          {/* Top Navigation Bar */}
          <nav className="absolute top-0 left-0 right-0 z-10 p-4">
            <div className="flex justify-between items-center">
              <div className="text-gray-900">
                <button 
                  onClick={() => setCurrentView('homepage')}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <h1 className="text-2xl font-bold">JobNova</h1>
                  <p className="text-sm opacity-90">Find Your Dream Job</p>
                </button>
              </div>
              <div className="bg-white rounded-full shadow-lg p-1">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentView('signin')}
                    className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                      currentView === 'signin'
                        ? 'bg-blue-400 text-white shadow-md'
                        : 'text-gray-600 hover:text-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setCurrentView('signup')}
                    className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                      currentView === 'signup'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </nav>

        
          {currentView === 'signin' ? (
            <SignIn onSwitchToSignUp={() => setCurrentView('signup')} onAuthSuccess={handleAuthSuccess} onBackToHome={() => setCurrentView('homepage')} />
          ) : (
            <SignUp onSwitchToSignIn={() => setCurrentView('signin')} onAuthSuccess={handleAuthSuccess} onBackToHome={() => setCurrentView('homepage')} />
          )}
          <Footer />
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
