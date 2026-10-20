import { useState } from 'react';
import { applicationAPI } from '../services/api';

const ApplicationCard = ({ application }) => {
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status) => {
    const statusColors = {
      'submitted': 'bg-blue-100 text-blue-800',
      'under-review': 'bg-yellow-100 text-yellow-800',
      'shortlisted': 'bg-purple-100 text-purple-800',
      'interview-scheduled': 'bg-indigo-100 text-indigo-800',
      'interviewed': 'bg-cyan-100 text-cyan-800',
      'selected': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'withdrawn': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      'submitted': '',
      'under-review': '',
      'shortlisted': '',
      'interview-scheduled': '',
      'interviewed': '',
      'selected': '',
      'rejected': '',
      'withdrawn': ''
    };
    return statusIcons[status] || '';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (salary) => {
    if (!salary?.min && !salary?.max) return 'Not disclosed';
    if (salary.min && salary.max) {
      return `${salary.currency || 'INR'} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
    }
    if (salary.min) return `${salary.currency || 'INR'} ${salary.min.toLocaleString()}+`;
    return `Up to ${salary.currency || 'INR'} ${salary.max.toLocaleString()}`;
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    setLoading(true);
    try {
      await applicationAPI.withdrawApplication(application._id);
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('Failed to withdraw application');
    } finally {
      setLoading(false);
    }
  };

  const canWithdraw = !['selected', 'rejected', 'withdrawn'].includes(application.status);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">
                {application.job?.title || 'Job Title'}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                <span className="mr-1">{getStatusIcon(application.status)}</span>
                {application.status?.replace('-', ' ').toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center text-gray-600 mb-2">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{application.job?.company || 'Company Name'}</span>
            </div>
            
            <div className="flex items-center text-gray-500 text-sm">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>
                {application.job?.location?.city}, {application.job?.location?.state}
              </span>
            </div>
          </div>
          
          {canWithdraw && (
            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="text-red-600 hover:text-red-800 disabled:opacity-50 text-sm font-medium px-3 py-1 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Withdrawing...' : 'Withdraw'}
            </button>
          )}
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zM6 8H4v6h12V8h-2v1a1 1 0 11-2 0V8H8v1a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
            <span className="capitalize">
              {application.job?.employmentType?.replace('-', ' ') || 'Full-time'}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            <span>{formatSalary(application.job?.salary)}</span>
          </div>
        </div>

        {/* Application Timeline */}
        {application.timeline && application.timeline.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Application Timeline</h4>
            <div className="space-y-2">
              {application.timeline.slice(-3).reverse().map((step, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div className={`w-2 h-2 rounded-full mr-3 ${getStatusColor(step.status).replace('text-', 'bg-').split(' ')[0]}`}></div>
                  <div className="flex-1">
                    <span className="font-medium capitalize">
                      {step.status.replace('-', ' ')}
                    </span>
                    {step.notes && (
                      <span className="text-gray-500 ml-2">- {step.notes}</span>
                    )}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {formatDate(step.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interview Details */}
        {application.interviewDetails && application.status === 'interview-scheduled' && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Interview Scheduled
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div>
                <span className="font-medium">Date:</span> {application.interviewDetails.date}
              </div>
              <div>
                <span className="font-medium">Time:</span> {application.interviewDetails.time}
              </div>
              <div>
                <span className="font-medium">Mode:</span> {application.interviewDetails.mode}
              </div>
              {application.interviewDetails.meetingLink && (
                <div>
                  <span className="font-medium">Link:</span> 
                  <a 
                    href={application.interviewDetails.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    Join Meeting
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback */}
        {application.feedback && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Feedback
            </h4>
            {application.feedback.rating && (
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-gray-700 mr-2">Rating:</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${
                        i < application.feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            )}
            {application.feedback.comments && (
              <p className="text-sm text-gray-700">{application.feedback.comments}</p>
            )}
          </div>
        )}

        {/* Cover Letter Preview */}
        {application.coverLetter && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Cover Letter</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {application.coverLetter.length > 200 
                ? `${application.coverLetter.substring(0, 200)}...` 
                : application.coverLetter}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Applied {application.appliedAgo || formatDate(application.createdAt)}
          </div>
          
          {application.resume && (
            <a
              href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/resumes/${application.resume.filename}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              View Resume
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard;