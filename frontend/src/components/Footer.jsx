import React from "react";
import { Link } from "react-router-dom";
import {
  FaGithub,
  FaLinkedin,
  FaEnvelope,
} from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";

const Footer = () => {
  return (
    <footer className="bg-[#0B1220] pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6">

        {/* Main Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ================= Left Card ================= */}
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(59,130,246,0.35)]">

            <div className="flex items-center mb-6">

              <img
                src="/images/JobNovalogo.png"
                alt="JobNova Logo"
                className="w-16 h-16 rounded-xl mr-4 shadow-lg"
              />

              <div>
                <h2 className="text-4xl font-extrabold text-white">
                  JobNova
                </h2>

                <p className="text-xl font-semibold text-white mt-1">
                  Professional Job Portal
                </p>
              </div>

            </div>

            <p className="text-gray-400 text-lg leading-8">
              Connecting talented professionals with leading employers
              worldwide.
            </p>

          </div>

          {/* ================= Middle Card ================= */}
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(59,130,246,0.35)]">

            <h3 className="text-3xl font-bold text-white mb-8">
              Quick Links
            </h3>

            <div className="space-y-5">

              <Link
                to="/"
                className="block text-lg text-gray-300 hover:text-blue-400 transition duration-300"
              >
                Home
              </Link>

              <Link
                to="/jobs"
                className="block text-lg text-gray-300 hover:text-blue-400 transition duration-300"
              >
                Jobs
              </Link>

              <Link
                to="/companies"
                className="block text-lg text-gray-300 hover:text-blue-400 transition duration-300"
              >
                Companies
              </Link>

              <Link
                to="/about"
                className="block text-lg text-gray-300 hover:text-blue-400 transition duration-300"
              >
                About
              </Link>

              <Link
                to="/contact"
                className="block text-lg text-gray-300 hover:text-blue-400 transition duration-300"
              >
                Contact
              </Link>

            </div>

          </div>

          {/* ================= Right Card ================= */}
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(59,130,246,0.35)]">

            <h3 className="text-3xl font-bold text-white mb-8">
              Connect With Us
            </h3>

            <div className="grid grid-cols-2 gap-8">

              {/* GitHub */}
              <a
                href="https://github.com/GANESH-0-0-7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center group"
              >
                <div className="w-20 h-20 rounded-full border border-blue-500 flex items-center justify-center text-blue-400 text-4xl shadow-[0_0_25px_rgba(59,130,246,0.5)] transition duration-300 group-hover:scale-110 group-hover:bg-blue-500/10">
                  <FaGithub />
                </div>

                <span className="mt-3 text-gray-300 group-hover:text-white">
                  GitHub
                </span>
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/ganesh-c-5124063bb/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center group"
              >
                <div className="w-20 h-20 rounded-full border border-blue-500 flex items-center justify-center text-blue-400 text-4xl shadow-[0_0_25px_rgba(59,130,246,0.5)] transition duration-300 group-hover:scale-110 group-hover:bg-blue-500/10">
                  <FaLinkedin />
                </div>

                <span className="mt-3 text-gray-300 group-hover:text-white">
                  LinkedIn
                </span>
              </a>

              {/* LeetCode */}
              <a
                href="https://leetcode.com/u/SAITMAN/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center group"
              >
                <div className="w-20 h-20 rounded-full border border-blue-500 flex items-center justify-center text-blue-400 text-4xl shadow-[0_0_25px_rgba(59,130,246,0.5)] transition duration-300 group-hover:scale-110 group-hover:bg-blue-500/10">
                  <SiLeetcode />
                </div>

                <span className="mt-3 text-gray-300 group-hover:text-white">
                  LeetCode
                </span>
              </a>

              {/* Email */}
              <a
                href="mailto:manhwamanhwa725@gmail.com"
                className="flex flex-col items-center group"
              >
                <div className="w-20 h-20 rounded-full border border-blue-500 flex items-center justify-center text-blue-400 text-4xl shadow-[0_0_25px_rgba(59,130,246,0.5)] transition duration-300 group-hover:scale-110 group-hover:bg-blue-500/10">
                  <FaEnvelope />
                </div>

                <span className="mt-3 text-gray-300 group-hover:text-white">
                  Email
                </span>
              </a>

            </div>

          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">

          <p className="text-gray-400 text-sm text-center md:text-left">
            © 2026 JobNova. All Rights Reserved.
          </p>

          <p className="text-gray-400 text-sm text-center">
            Built with{" "}
            <span className="text-white font-semibold">React</span> •{" "}
            <span className="text-white font-semibold">Node.js</span> •{" "}
            <span className="text-white font-semibold">Express</span> •{" "}
            <span className="text-white font-semibold">MongoDB</span>
          </p>

        </div>

      </div>
    </footer>
  );
};

export default Footer;