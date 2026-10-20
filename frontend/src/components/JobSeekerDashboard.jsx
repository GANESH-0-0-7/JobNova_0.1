import { useState, useEffect, useRef } from 'react';
import { jobAPI, applicationAPI } from '../services/api';
import { aiAPI } from '../services/enhancedAPI';
import JobApplicationModal from './JobApplicationModal';


const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out forwards;
  }
  
  .animate-slideIn {
    animation: slideIn 0.5s ease-out forwards;
  }
  
  .animate-pulse-subtle {
    animation: pulse 2s infinite;
  }
  
  .animate-bounce-subtle {
    animation: bounce 2s infinite;
  }
  
  .job-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateY(0);
  }
  
  .job-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  .JobNova-logo {
    transition: all 0.3s ease;
  }
  
  .JobNova-logo:hover {
    transform: scale(1.05) rotate(5deg);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const simplifyApplicationStatus = (status = 'submitted') => {
  if (status === 'selected') return 'selected';
  if (status === 'rejected' || status === 'not-selected') return 'rejected';
  return 'submitted';
};

const APPLICATION_STATUS_META = {
  submitted: {
    badge: 'Pending',
    classes: 'bg-gray-100 text-gray-800',
    message: 'The employer is still reviewing your application.',
  },
  selected: {
    badge: 'Selected',
    classes: 'bg-emerald-100 text-emerald-800',
    message: 'Great news! The employer marked you as selected.',
  },
  rejected: {
    badge: 'Not Selected',
    classes: 'bg-red-100 text-red-700',
    message: 'The employer marked you as not selected for this role.',
  },
};

const JobSeekerDashboard = ({ onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [jobSource, setJobSource] = useState('local'); // 'local' or 'remote'
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    employmentType: '',
    jobType: ''
  });
  const savedLocalFiltersRef = useRef({ location: '', jobType: '' });
  const filtersSnapshotRef = useRef(filters);

  // AI Cover Letter State
  const [aiJobDetails, setAiJobDetails] = useState({ title: '', company: '', description: '' });
  const [aiGeneratedLetter, setAiGeneratedLetter] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [copyState, setCopyState] = useState('idle');

  useEffect(() => {
    filtersSnapshotRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (jobSource === 'remote') {
      savedLocalFiltersRef.current = {
        location: filtersSnapshotRef.current.location,
        jobType: filtersSnapshotRef.current.jobType
      };
      setFilters(prev => ({
        ...prev,
        location: '',
        jobType: ''
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        location: savedLocalFiltersRef.current.location || '',
        jobType: savedLocalFiltersRef.current.jobType || ''
      }));
    }
  }, [jobSource]);

  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const posted = new Date(dateString);
    const diffTime = Math.abs(now - posted);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }
  };

  useEffect(() => {
    if (activeTab === 'jobs') {
      if (jobSource === 'local') {
        fetchJobs();
      } else {
        fetchRemoteJobs();
      }
    } else if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [activeTab, searchTerm, filters, jobSource]);

  
  useEffect(() => {
    if (activeTab === 'jobs' && jobSource === 'local') {
      const interval = setInterval(() => {
        fetchJobs();
      }, 30000); 

     
      const handleJobPosted = () => {
        console.log('New job posted, refreshing job list...');
        fetchJobs();
      };

      window.addEventListener('jobPosted', handleJobPosted);

      return () => {
        clearInterval(interval);
        window.removeEventListener('jobPosted', handleJobPosted);
      };
    }
  }, [activeTab, jobSource]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        category: filters.category || undefined,
        location: filters.location || undefined,
        employmentType: filters.employmentType || undefined,
        jobType: filters.jobType || undefined,
        limit: 50,
        page: 1
      };
      
      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
      
      console.log('Fetching jobs with params:', params);
      const response = await jobAPI.getAllJobs(params);
      console.log('Full API response:', response);
      
      // The response should have a jobs array
      if (response && response.jobs && Array.isArray(response.jobs)) {
        console.log('Jobs received:', response.jobs.length, response.jobs);
        
        const formattedJobs = response.jobs.map(job => ({
          _id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          employmentType: job.employmentType,
          jobType: job.jobType,
          description: job.description,
          requirements: job.requirements || [],
          responsibilities: job.responsibilities || [],
          skills: job.skills || [],
          benefits: job.benefits || [],
          postedAgo: job.createdAt ? getTimeAgo(job.createdAt) : 'Recently posted',
          applications: job.applicationsCount || 0,
          views: job.viewsCount || 0,
          status: job.isActive ? 'active' : 'inactive',
          category: job.category
        }));

        setJobs(formattedJobs);
      } else {
        console.error('Invalid response format:', response);
        setJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeFilterValue = (value = '') =>
    value.toLowerCase().replace(/[_\s]+/g, '-');

  const fetchRemoteJobs = async () => {
    try {
      setLoading(true);
      const searchQuery = searchTerm?.trim() || 'developer';
      const category = filters.category || '';
      const locationQuery = filters.location?.trim() || '';

      const params = new URLSearchParams({
        search: searchQuery,
        limit: '30'
      });

      if (category) {
        params.append('category', category);
      }

      if (locationQuery) {
        params.append('location', locationQuery);
      }


      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/remotive-jobs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch remote jobs');
      }

      const data = await response.json();
      const remoteJobs = data.jobs || [];
      

      const formattedJobs = remoteJobs.map(job => {
        const employmentType = normalizeFilterValue(job.job_type || 'full-time');
        const jobLocation = job.candidate_required_location || 'Remote • Worldwide';
        const categorySlug = job.category ? normalizeFilterValue(job.category) : '';

        return {
          _id: `remote_${job.id}`,
          title: job.title,
          company: job.company_name,
          location: jobLocation,
          salary: job.salary || 'Competitive salary',
          employmentType,
          jobType: 'remote',
          description: job.description?.replace(/<[^>]*>/g, '') || 'No description available',
          requirements: [],
          responsibilities: [],
          skills: [],
          benefits: [],
          postedAgo: job.publication_date ? getTimeAgo(job.publication_date) : 'Recently posted',
          applications: Math.floor(Math.random() * 50),
          views: Math.floor(Math.random() * 500),
          status: 'active',
          category: job.category || 'Technology',
          categorySlug,
          isRemote: true,
          originalUrl: job.url,
          companyLogo: job.company_logo
        };
      });

      const filteredJobs = formattedJobs.filter((job) => {
        if (filters.category) {
          if (job.categorySlug !== filters.category) {
            return false;
          }
        }

        if (locationQuery) {
          const jobLocationText = job.location?.toLowerCase() || '';
          if (!jobLocationText.includes(locationQuery.toLowerCase())) {
            return false;
          }
        }

        if (filters.employmentType) {
          const jobEmployment = normalizeFilterValue(job.employmentType || '');
          if (jobEmployment !== filters.employmentType) {
            return false;
          }
        }

        if (filters.jobType) {
          const jobTypeValue = normalizeFilterValue(job.jobType || 'remote');
          if (filters.jobType === 'remote') {
            if (!(job.isRemote || jobTypeValue === 'remote')) {
              return false;
            }
          } else if (jobTypeValue !== filters.jobType) {
            return false;
          }
        }

        return true;
      });

      setJobs(filteredJobs);
    } catch (error) {
      console.error('Error fetching remote jobs:', error);
      // Show some fallback jobs even on error
      const fallbackJobs = [
        {
          _id: 'fallback_1',
          title: 'Software Developer',
          company: 'Tech Solutions',
          location: 'Remote • Worldwide',
          salary: '$60,000 - $90,000',
          employmentType: 'full-time',
          jobType: 'remote',
          description: 'Join our team as a Software Developer working on innovative projects.',
          requirements: [],
          responsibilities: [],
          skills: ['JavaScript', 'React', 'Node.js'],
          benefits: [],
          postedAgo: 'Recently posted',
          applications: 15,
          views: 120,
          status: 'active',
          category: 'Technology',
          categorySlug: 'technology',
          isRemote: true,
          originalUrl: '#',
          companyLogo: 'https://via.placeholder.com/50'
        }
      ];
      setJobs(fallbackJobs);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationAPI.getMyApplications({ limit: 20 });
      setApplications(response.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([
        {
          _id: '1',
          job: {
            title: 'Frontend Developer',
            company: 'Tech Solutions',
            location: { city: 'Delhi', state: 'Delhi' }
          },
          status: 'under-review',
          appliedAgo: '3 days ago'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (jobSource === 'local') {
      fetchJobs();
    } else {
      fetchRemoteJobs();
    }
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      location: '',
      employmentType: '',
      jobType: ''
    });
    setSearchTerm('');
  };

  const handleApplyJob = (job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const handleApplicationSuccess = () => {
    setShowApplicationModal(false);
    setSelectedJob(null);
    fetchApplications(); // Refresh applications
  };

  const applyToJob = async (jobId) => {
    try {
      await applicationAPI.applyForJob(jobId, {
        coverLetter: 'I am interested in this position...'
      });
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying:', error);
      alert('Error submitting application');
    }
  };

  const handleBackToHome = () => {
    if (typeof onNavigateHome === 'function') {
      onNavigateHome();
    }
  };

  const handleGenerateStandaloneLetter = async () => {
    if (!aiJobDetails.title || !aiJobDetails.company || !aiJobDetails.description) {
      setAiError('Please fill in all job details to generate a cover letter.');
      return;
    }
    setIsGeneratingAI(true);
    setAiError('');
    try {
      const userProfile = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await aiAPI.generateCoverLetter({
        jobDetails: aiJobDetails,
        userProfile
      });
      setAiGeneratedLetter(response.coverLetter);
    } catch (err) {
      console.error('Failed to generate standalone cover letter:', err);
      const errorMessage = err.message || 'Failed to generate cover letter. Ensure your AI backend is running and configured.';
      setAiError(errorMessage);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCopyGeneratedLetter = async () => {
    if (!aiGeneratedLetter?.trim()) {
      return;
    }

    const fallbackCopy = () => {
      const textArea = document.createElement('textarea');
      textArea.value = aiGeneratedLetter;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textArea);
      return copied;
    };

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(aiGeneratedLetter);
      } else {
        const copied = fallbackCopy();
        if (!copied) {
          throw new Error('Copy failed');
        }
      }
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1500);
    } catch (error) {
      setCopyState('failed');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              {onNavigateHome && (
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 inline-flex items-center gap-2 mb-4"
                >
                  <span className="text-lg">←</span>
                  <span>Back to Home</span>
                </button>
              )}
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Job seeker workspace</p>
              <h1 className="text-3xl font-semibold text-gray-900 mt-2">Find roles that match your skills</h1>
              <p className="text-gray-500 mt-1">Keep things focused: search locally or browse curated remote roles.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 justify-end">
              {/* Job Source Toggle */}
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-100 p-1">
                <button
                  onClick={() => setJobSource('local')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    jobSource === 'local'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Local Jobs
                </button>
                <button
                  onClick={() => setJobSource('remote')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    jobSource === 'remote'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Remote Jobs
                </button>
              </div>

              <button
                onClick={jobSource === 'local' ? fetchJobs : fetchRemoteJobs}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? 'Refreshing...' : 'Refresh Jobs'}</span>
              </button>
              <div className="rounded-2xl bg-gray-900 px-4 py-3 text-white text-center">
                <div className="text-2xl font-semibold">{jobs.length}</div>
                <div className="text-xs text-gray-300 uppercase tracking-wide">
                  {jobSource === 'local' ? 'local jobs' : 'remote jobs'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-1">
          <nav className="flex gap-2">
            {[
              { id: 'jobs', label: 'Browse Jobs' },
              { id: 'applications', label: 'My Applications' },
              { id: 'ai-cover-letter', label: '✨ AI Cover Letter' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'jobs' && (
          <div className="space-y-8">
            {/* Enhanced Search and Filters */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Your Perfect Job</h2>
                <p className="text-gray-600">Discover opportunities tailored to your skills and preferences</p>
              </div>
              
              <form onSubmit={handleSearch} className="space-y-6">
                {/* Main Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by job title, company, or skills (e.g. React Developer, Google, JavaScript)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-32 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <span>Search</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>

                {/* Advanced Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="">All Categories</option>
                      <option value="software-development">Software Development</option>
                      <option value="data-science">Data Science</option>
                      <option value="design">Design</option>
                      <option value="marketing">Marketing</option>
                      <option value="finance">Finance</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="education">Education</option>
                    </select>
                  </div>

                  {jobSource === 'local' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="City, State"
                          value={filters.location}
                          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                    <select
                      value={filters.employmentType}
                      onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="">All Types</option>
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>

                  {jobSource === 'local' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Work Type</label>
                      <select
                        value={filters.jobType}
                        onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      >
                        <option value="">All Locations</option>
                        <option value="remote">Remote</option>
                        <option value="on-site">On-site</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  )}
                </div>

                {(searchTerm || Object.values(filters).some(v => v)) && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Clear all filters</span>
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Job Listings */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Finding amazing opportunities...</p>
                </div>
              </div>
            ) : jobs.length > 0 ? (
              <div className="grid gap-6">
                {jobs.map((job, index) => (
                  <div key={job._id} 
                       className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 animate-fadeIn"
                       style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                          {job.companyLogo ? (
                            <img 
                              src={job.companyLogo} 
                              alt={job.company}
                              className="w-full h-full object-cover rounded-2xl"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span className={`text-white font-bold text-xl ${job.companyLogo ? 'hidden' : 'block'}`}>
                            {(job.company || 'C').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                              {job.title}
                            </h3>
                            {job.isRemote && (
                              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full border border-green-200">
                                REMOTE
                              </span>
                            )}
                          </div>
                          <p className="text-lg text-gray-700 font-medium">{job.company}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-gray-500">
                              {job.isRemote ? job.location : `${job.location?.city}, ${job.location?.state}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg">
                          <p className="text-lg font-bold">
                            {job.isRemote 
                              ? job.salary 
                              : (job.salary?.min && job.salary?.max 
                                ? `₹${(job.salary.min/100000).toFixed(1)}L - ₹${(job.salary.max/100000).toFixed(1)}L`
                                : 'Negotiable')
                            }
                          </p>
                        </div>
                        <div className="flex justify-end space-x-2 mt-3">
                          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
                            {job.employmentType?.replace('-', ' ').toUpperCase()}
                          </span>
                          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full border border-purple-200">
                            {job.jobType?.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">{job.description}</p>
                    
                    {/* Skills */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 4).map((skill, skillIndex) => (
                            <span key={skillIndex} className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full border border-indigo-200">
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 4 && (
                            <span className="text-gray-500 text-xs font-medium px-3 py-1">
                              +{job.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Posted {job.postedAgo}</span>
                      </div>
                      <button 
                        onClick={() => job.isRemote ? window.open(job.originalUrl, '_blank') : handleApplyJob(job)}
                        className="group bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                      >
                        <span>{job.isRemote ? 'View Job' : 'Apply Now'}</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-16 text-center">
                <div className="w-24 h-24 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Jobs Found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  We couldn't find any jobs matching your criteria. Try adjusting your filters or check back later for new opportunities.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Applications</h2>
                <p className="text-gray-600 mt-1">Track your job application progress</p>
              </div>
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-blue-600 font-semibold text-lg">{applications.length}</span>
                <span className="text-blue-600 text-sm ml-1">
                  {applications.length === 1 ? 'application' : 'applications'}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading your applications...</p>
                </div>
              </div>
            ) : applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map(application => {
                  const simpleStatus = simplifyApplicationStatus(application.status);
                  const statusMeta = APPLICATION_STATUS_META[simpleStatus] || APPLICATION_STATUS_META.submitted;

                  return (
                  <div key={application._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {(application.job.company || 'C').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                {application.job.title}
                              </h3>
                              <p className="text-gray-600 font-medium">{application.job.company}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{application.job.location?.city}, {application.job.location?.state}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Applied {application.appliedAgo}</span>
                            </div>
                            {application.job.employmentType && (
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2M8 6v2a2 2 0 002 2m0 0h4m-4 0a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2" />
                                </svg>
                                <span className="capitalize">{application.job.employmentType.replace('-', ' ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right ml-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${statusMeta.classes}`}>
                            <span>{statusMeta.badge}</span>
                          </span>
                          <p className="text-xs text-gray-500 mt-2 max-w-xs ml-auto">
                            {statusMeta.message}
                          </p>
                        </div>
                      </div>

                      {/* Job details */}
                      {application.job.salary && (
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mt-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span>
                              ₹{application.job.salary.min?.toLocaleString()} - ₹{application.job.salary.max?.toLocaleString()}
                            </span>
                          </div>
                          {application.job.jobType && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="capitalize">{application.job.jobType.replace('-', ' ')}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Application metadata */}
                      <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-400">
                          Application ID: {application._id?.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-12 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No Applications Yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Ready to take the next step in your career? Start exploring amazing job opportunities and submit your first application.
                </p>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Browse Jobs
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai-cover-letter' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">✨ AI Cover Letter Generator</h2>
                <p className="text-gray-600">Enter the details of a job you're interested in, and our AI will craft a personalized cover letter for you instantly.</p>
              </div>

              {aiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {aiError}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left side: Input Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={aiJobDetails.title}
                      onChange={(e) => setAiJobDetails({...aiJobDetails, title: e.target.value})}
                      placeholder="e.g. Senior React Developer"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={aiJobDetails.company}
                      onChange={(e) => setAiJobDetails({...aiJobDetails, company: e.target.value})}
                      placeholder="e.g. Google"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                    <textarea
                      value={aiJobDetails.description}
                      onChange={(e) => setAiJobDetails({...aiJobDetails, description: e.target.value})}
                      placeholder="Paste the job description here..."
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <button
                    onClick={handleGenerateStandaloneLetter}
                    disabled={isGeneratingAI}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {isGeneratingAI ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating Magic...</span>
                      </>
                    ) : (
                      <>
                        <span>✨ Generate Cover Letter</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right side: Generated Letter */}
                <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-100 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-gray-800 uppercase tracking-wider">Generated Result</label>
                    {aiGeneratedLetter && (
                      <button 
                        onClick={handleCopyGeneratedLetter}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy to Clipboard'}
                      </button>
                    )}
                  </div>
                  <textarea
                    value={aiGeneratedLetter}
                    onChange={(e) => setAiGeneratedLetter(e.target.value)}
                    placeholder="Your AI generated cover letter will appear here..."
                    className="w-full flex-1 px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700 leading-relaxed min-h-[300px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Job Application Modal */}
      <JobApplicationModal 
        job={selectedJob}
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        onApplicationSuccess={handleApplicationSuccess}
      />
    </div>
  );
};

export default JobSeekerDashboard;