import React from 'react';

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full mx-4">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <img 
                src="/images/JobNovalogo.png" 
                alt="JobNova Logo" 
                className="h-16 w-16 rounded-xl shadow-xl ring-2 ring-blue-200 group-hover:ring-blue-400 transition-all duration-300" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">JobNova</h1>
          <p className="text-sm text-gray-500">Job Portal Platform</p>
        </div>

        {/* Loading Animation */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            {/* Outer ring */}
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
            {/* Inner ring */}
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin border-b-indigo-600 animate-reverse"></div>
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700 mb-2">{message}</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>

        {/* Progress hints */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Setting up your personalized experience...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;