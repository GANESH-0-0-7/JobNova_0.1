import { useState, useEffect, useMemo } from 'react';
import { applicationAPI } from '../services/api';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'submitted', label: 'Pending' },
  { id: 'selected', label: 'Selected' },
  { id: 'rejected', label: 'Not Selected' }
];

const STATUS_LABELS = {
  submitted: 'Pending',
  selected: 'Selected',
  rejected: 'Not Selected'
};

const STATUS_COLORS = {
  submitted: 'bg-gray-100 text-gray-700',
  selected: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700'
};

const simplifyStatus = (status = 'submitted') => {
  if (status === 'selected') return 'selected';
  if (status === 'rejected' || status === 'not-selected') return 'rejected';
  return 'submitted';
};

const ApplicationsModal = ({ job, onClose }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [error, setError] = useState('');
  const jobId = job?._id || job?.id;

  useEffect(() => {
    if (!jobId) {
      setApplications([]);
      return;
    }

    setSelectedStatus('all');

    const fetchApplications = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await applicationAPI.getJobApplications(jobId, {
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
        setApplications(response.applications || []);
      } catch (err) {
        console.error('Failed to load applications:', err);
        setApplications([]);
        setError(err.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [jobId]);

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await applicationAPI.updateApplicationStatus(applicationId, { status: newStatus });
      setApplications((prev) =>
        prev.map((application) =>
          application._id === applicationId
            ? { ...application, status: newStatus }
            : application
        )
      );
    } catch (err) {
      console.error('Failed to update application status:', err);
      alert(err.message || 'Failed to update application status. Please try again.');
    }
  };

  const statusCounts = useMemo(() => {
    return applications.reduce((acc, application) => {
      const status = simplifyStatus(application.status);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (selectedStatus === 'all') {
      return applications;
    }
    return applications.filter((application) => simplifyStatus(application.status) === selectedStatus);
  }, [applications, selectedStatus]);

  const formatStatus = (status) => {
    if (status === 'all') return 'All';
    return STATUS_LABELS[simplifyStatus(status)] || 'Pending';
  };
  const getStatusColor = (status) => STATUS_COLORS[simplifyStatus(status)] || STATUS_COLORS.submitted;

  const getApplicantName = (application) =>
    application.applicant?.name || application.profileData?.name || 'Unknown candidate';

  const getApplicantEmail = (application) =>
    application.applicant?.email || application.profileData?.email || '';

  const getAppliedDate = (application) => {
    if (application.appliedAgo) return application.appliedAgo;
    if (application.createdAt) {
      return new Date(application.createdAt).toLocaleDateString();
    }
    return 'Date unavailable';
  };

  const applicantLocation = (application) =>
    application.profileData?.location || 'Location not shared';

  const applicantExperience = (application) =>
    application.profileData?.experience || 'Experience not shared';

  const noApplicationsMessage =
    applications.length === 0
      ? 'No applications have been submitted for this job yet.'
      : `No applications with status "${formatStatus(selectedStatus)}".`;

  if (!job) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-[0_20px_70px_rgba(15,23,42,0.25)] ring-1 ring-black/5">
        <div className="max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Applications for {job?.title}</h2>
              <p className="text-gray-600 mt-1">
                {(job?.company || job?.employer?.name || 'Your company')} • {applications.length} applications
              </p>
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

          <div className="mt-4 flex space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status.id}
                onClick={() => setSelectedStatus(status.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedStatus === status.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {status.label}
                {status.id !== 'all' && (
                  <span className="ml-1 text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {statusCounts[status.id] || 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 text-red-700 text-sm border-b border-red-100">
            {error}
          </div>
        )}

        <div className="p-6 pb-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading applications...</span>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">{noApplicationsMessage}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((application) => {
                const email = getApplicantEmail(application);
                return (
                  <div
                    key={application._id}
                    className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{getApplicantName(application)}</p>
                        {email && <p className="text-sm text-gray-500">{email}</p>}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(application.status)}`}>
                        {formatStatus(application.status)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-3">
                      <span>Applied: {getAppliedDate(application)}</span>
                      <span>Experience: {applicantExperience(application)}</span>
                      <span>Location: {applicantLocation(application)}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm">
                      {application.resume && (
                        <button
                          onClick={() => console.log('View resume:', application._id)}
                          className="text-blue-600 font-medium"
                        >
                          View Resume
                        </button>
                      )}
                      {email && (
                        <a href={`mailto:${email}`} className="text-green-600 font-medium">
                          Contact
                        </a>
                      )}
                      <div className="ml-auto flex gap-2">
                        {simplifyStatus(application.status) === 'submitted' && (
                          <>
                            <button
                              onClick={() => updateApplicationStatus(application._id, 'selected')}
                              className="px-3 py-1 border border-emerald-200 text-emerald-600 rounded-md"
                            >
                              Mark Selected
                            </button>
                            <button
                              onClick={() => updateApplicationStatus(application._id, 'rejected')}
                              className="px-3 py-1 border border-red-200 text-red-600 rounded-md"
                            >
                              Mark Not Selected
                            </button>
                          </>
                        )}
                        {simplifyStatus(application.status) === 'selected' && (
                          <button
                            onClick={() => updateApplicationStatus(application._id, 'rejected')}
                            className="px-3 py-1 border border-red-200 text-red-600 rounded-md"
                          >
                            Mark Not Selected
                          </button>
                        )}
                        {simplifyStatus(application.status) === 'rejected' && (
                          <button
                            onClick={() => updateApplicationStatus(application._id, 'selected')}
                            className="px-3 py-1 border border-emerald-200 text-emerald-600 rounded-md"
                          >
                            Mark Selected
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsModal;
