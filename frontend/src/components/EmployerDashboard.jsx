import { useState, useEffect } from 'react';
import { jobAPI, applicationAPI } from '../services/api';
import JobPostingModal from './JobPostingModal';
import ApplicationsModal from './ApplicationsModal';

// Add custom styles for animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out forwards;
  }
  
  .animate-slideUp {
    animation: slideUp 0.4s ease-out forwards;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const EmployerDashboard = ({ onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchDashboardData();

    // Listen for job posted events to refresh immediately
    const handleJobPosted = () => {
      console.log('Job posted, refreshing employer dashboard...');
      fetchDashboardData();
    };

    window.addEventListener('jobPosted', handleJobPosted);

    return () => {
      window.removeEventListener('jobPosted', handleJobPosted);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, jobsResponse] = await Promise.all([
        jobAPI.getJobStats().catch(() => ({ stats: { totalJobs: 0, totalApplications: 0, totalViews: 0, responseRate: 0 } })),
        jobAPI.getMyJobs({ limit: 50 }).catch(() => ({ jobs: [] }))
      ]);
      
      console.log('Employer dashboard - Stats:', statsResponse);
      console.log('Employer dashboard - Jobs:', jobsResponse);
      
      setStats(statsResponse.stats || {
        totalJobs: 0,
        totalApplications: 0,
        totalViews: 0,
        responseRate: 0
      });
      
      const fetchedJobs = (jobsResponse.jobs || []).filter((job) => job.isActive !== false);
      setJobs(fetchedJobs);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty defaults on error
      setStats({
        totalJobs: 0,
        totalApplications: 0,
        totalViews: 0,
        responseRate: 0
      });
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = () => {
    setShowPostModal(false);
    fetchDashboardData();
    setTimeout(() => {
      setActiveTab('jobs');
    }, 500);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowEditModal(true);
  };

  const handleViewApplications = (job) => {
    setSelectedJob(job);
    setShowApplicationsModal(true);
  };

  const handleDeleteJob = (job) => {
    setJobToDelete(job);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (jobToDelete) {
      try {
        await jobAPI.deleteJob(jobToDelete._id);
        setJobs(prevJobs => prevJobs.filter(job => job._id !== jobToDelete._id));
        setShowDeleteConfirm(false);
        setJobToDelete(null);
        fetchDashboardData();
        alert('Job deleted successfully!');
      } catch (error) {
        console.error('Error deleting job:', error);
        alert('Failed to delete job. Please try again.');
      }
    }
  };

  const handleJobUpdated = async (updatedJobData) => {
    try {
      await jobAPI.updateJob(editingJob._id, updatedJobData);
      setShowEditModal(false);
      setEditingJob(null);
      fetchDashboardData();
      alert('Job updated successfully!');
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Employer Dashboard</p>
              <h1 className="text-3xl font-semibold text-gray-900 mt-2">Manage postings and track applications</h1>
              <p className="text-gray-500 mt-1">Everything you need to hire in one clean view.</p>
            </div>
            <button
              onClick={() => setShowPostModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white font-medium shadow-sm hover:bg-indigo-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
              </svg>
              <span>Post New Job</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-1">
          <nav className="flex gap-2">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'jobs', label: 'My Jobs' },
              { id: 'applications', label: 'Applications' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
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
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center">
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalJobs || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center">
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.activeJobs || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center">
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Jobs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Recent Job Postings</h3>
              </div>
              <div className="p-6">
                {jobs.length > 0 ? (
                  <div className="space-y-4">
                    {jobs.slice(0, 5).map(job => (
                      <div key={job._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900">{job.title}</h4>
                          <p className="text-sm text-gray-500">{job.location?.city}, {job.location?.state}</p>
                          <p className="text-xs text-gray-400">{job.postedAgo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{job.applicationCount || 0} applications</p>
                          <p className="text-xs text-gray-500">{job.viewsCount} views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                    <p className="text-gray-500 mb-4">Start by posting your first job to attract candidates</p>
                    <button
                      onClick={() => setShowPostModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      Post Your First Job
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Job Postings</h2>
              <button
                onClick={() => setShowPostModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Post New Job
              </button>
            </div>
            
            {jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map(job => (
                  <div key={job._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-gray-500">{job.location?.city}, {job.location?.state}</p>
                        <p className="text-sm text-gray-400 mt-1">Posted {job.postedAgo}</p>
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            job.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {job.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{job.applicationCount} applications</p>
                        <p className="text-xs text-gray-500">{job.viewsCount} views</p>
                        <div className="mt-2 space-x-2">
                          <button 
                            onClick={() => handleEditJob(job)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleViewApplications(job)}
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            View Applications
                          </button>
                          <button 
                            onClick={() => handleDeleteJob(job)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs posted</h3>
                <p className="text-gray-500 mb-6">Create your first job posting to start hiring</p>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Post Your First Job
                </button>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'applications') && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Management</h2>
            
            {jobs.length > 0 ? (
              <div className="space-y-6">
                {jobs.map(job => (
                  <div key={job._id} id={`job-applications-${job._id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-gray-500">{job.company} • {job.location?.city}, {job.location?.state}</p>
                        <p className="text-sm text-gray-400 mt-1">Posted {job.postedAgo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{job.applicationCount || 0} Applications</p>
                        <p className="text-sm text-gray-500">{job.viewsCount || 0} Views</p>
                      </div>
                    </div>
                    
                    {job.applicationCount > 0 ? (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Recent Applications</h4>
                        <div className="space-y-3">
                          {Array.from({length: Math.min(3, job.applicationCount)}).map((_, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 text-sm font-medium">
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">Applicant {idx + 1}</p>
                                  <p className="text-sm text-gray-500">Applied {Math.floor(Math.random() * 5) + 1} days ago</p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  Under Review
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {job.applicationCount > 3 && (
                          <button className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">
                            View all {job.applicationCount} applications →
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="border-t pt-4 text-center py-4">
                        <p className="text-gray-500">No applications yet</p>
                        <p className="text-sm text-gray-400 mt-1">Applications will appear here once candidates apply</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Posted</h3>
                <p className="text-gray-500 mb-6">Post your first job to start receiving applications</p>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Post Your First Job
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {showPostModal && (
        <JobPostingModal 
          onClose={() => setShowPostModal(false)}
          onJobPosted={handleJobCreated}
        />
      )}

      {showEditModal && editingJob && (
        <JobPostingModal 
          isEdit={true}
          jobData={editingJob}
          onClose={() => {
            setShowEditModal(false);
            setEditingJob(null);
          }}
          onJobPosted={handleJobUpdated}
        />
      )}

      {showDeleteConfirm && jobToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Job Posting</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{jobToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setJobToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Applications Modal */}
      {showApplicationsModal && selectedJob && (
        <ApplicationsModal
          job={selectedJob}
          onClose={() => {
            setShowApplicationsModal(false);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
};

export default EmployerDashboard;