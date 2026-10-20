import React, { useEffect, useState } from "react";

const BackendLoadingScreen = ({ onBackendReady }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [status, setStatus] = useState("Starting backend...");

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://jobnova-mphs.onrender.com";

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let intervalId;

    const checkBackend = async () => {
      try {
        const controller = new AbortController();

        const timeout = setTimeout(() => {
          controller.abort();
        }, 5000);

        const response = await fetch(`${API_URL}/api/health`, {
          signal: controller.signal,
          cache: "no-store",
        });

        clearTimeout(timeout);

        if (response.ok) {
          setStatus("Backend Ready!");

          clearInterval(intervalId);

          setTimeout(() => {
            onBackendReady();
          }, 800);

          return;
        }
      } catch (err) {
        setRetryCount((prev) => prev + 1);
        setStatus("Waking up backend...");
      }
    };

    checkBackend();

    intervalId = setInterval(checkBackend, 2000);

    return () => clearInterval(intervalId);
  }, [API_URL, onBackendReady]);

  const progress = Math.min((elapsedTime / 60) * 100, 95);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center">

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 w-[420px] text-center">

        <img
          src="/images/JobNovalogo.png"
          alt="JobNova"
          className="w-20 h-20 rounded-2xl mx-auto mb-6"
        />

        <h1 className="text-4xl font-bold text-white mb-2">
          JobNova
        </h1>

        <p className="text-blue-100 mb-8">
          Professional Job Portal
        </p>

        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>

        <h2 className="text-2xl text-white font-semibold mb-2">
          {status}
        </h2>

        <p className="text-blue-100 mb-6">
          Please wait while the Render server wakes up...
        </p>

        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between mt-2 text-sm text-blue-100">
          <span>{Math.round(progress)}%</span>
          <span>{elapsedTime}s</span>
        </div>

        <div className="mt-6 text-sm text-blue-100 space-y-2">
          <div className="flex justify-between">
            <span>Status</span>
            <span>{status}</span>
          </div>

          <div className="flex justify-between">
            <span>Attempts</span>
            <span>{retryCount + 1}</span>
          </div>
        </div>

        <div className="mt-8 bg-white/10 rounded-xl p-4 text-sm text-blue-100">
          Free Render servers sleep after inactivity.
          <br />
          The first request usually takes <b>30–60 seconds</b>.
        </div>
      </div>

    </div>
  );
};

export default BackendLoadingScreen;