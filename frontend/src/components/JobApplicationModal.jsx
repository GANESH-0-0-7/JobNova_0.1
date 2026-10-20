import { useState, useEffect } from 'react';
import { applicationAPI, aiAPI } from '../services/enhancedAPI';

const JobApplicationModal = ({ job, isOpen, onClose, onApplicationSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Get user profile from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserProfile(user);
  }, []);

  if (!isOpen || !job) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await applicationAPI.applyForJob(job._id, {
        profileData: userProfile,
        coverLetter
      });
      
      onApplicationSuccess?.();
      onClose();
      alert('Application submitted successfully with your profile!');
    } catch (error) {
      console.error('Application error:', error);
      setError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const response = await aiAPI.generateCoverLetter({
        jobDetails: {
          title: job.title,
          company: job.company,
          description: job.description
        },
        userProfile
      });
      setCoverLetter(response.coverLetter);
    } catch (err) {
      console.error('Failed to generate cover letter:', err);
      setError('Failed to generate cover letter using AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dim background overlay */}
      <div
        className="absolute inset-0 z-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Apply for Job</h2>
              <p className="text-gray-600 mt-1">{job.title}</p>
              <p className="text-sm text-gray-500">{job.company}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Apply with Your Profile</h3>
            <p className="text-gray-600 text-sm">
              Your application will be sent to {job.company} using your profile information.
            </p>
          </div>

          {userProfile && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Your Profile</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Name:</span> {userProfile.name || 'Not provided'}</p>
                <p><span className="font-medium">Email:</span> {userProfile.email || 'Not provided'}</p>
                <p><span className="font-medium">Role:</span> {userProfile.role || 'Job Seeker'}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Cover Letter</label>
              <button
                type="button"
                onClick={handleGenerateCoverLetter}
                disabled={isGenerating || !userProfile}
                className="text-sm flex items-center space-x-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400 font-medium"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-1">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating...</span>
                  </div>
                ) : (
                  <span>✨ Generate with AI</span>
                )}
              </button>
            </div>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows={5}
              placeholder="Write or generate a cover letter..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 px-6 py-3 text-white rounded-lg font-medium transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Applying...</span>
                </div>
              ) : (
                'Apply Now'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationModal;