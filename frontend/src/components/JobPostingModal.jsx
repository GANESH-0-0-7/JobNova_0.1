import { useState } from 'react';
import { jobAPI } from '../services/enhancedAPI';

const buildInitialSalary = (salary) => {
  if (!salary) return '';
  const min = salary.min ? Number(salary.min) : null;
  const max = salary.max ? Number(salary.max) : null;

  if (min && max && min !== max) {
    return `${min} - ${max}`;
  }
  if (min) {
    return `${min}`;
  }
  if (max) {
    return `${max}`;
  }
  return '';
};

const buildInitialLocation = (location) => {
  if (!location) return '';
  const parts = [location.city, location.state].filter(Boolean);
  return parts.length ? parts.join(', ') : '';
};

const JobPostingModal = ({ onClose, onJobPosted, isEdit = false, jobData = null }) => {
  const [formData, setFormData] = useState({
    title: jobData?.title || '',
    company: jobData?.company || '',
    salaryInput: buildInitialSalary(jobData?.salary),
    location: buildInitialLocation(jobData?.location),
    jobType: jobData?.jobType || 'on-site',
    description: jobData?.description || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const parseSalaryInput = (input) => {
    if (!input) {
      return { min: 0, max: 0 };
    }

    const numbers = input
      .split(/[^0-9]+/)
      .filter(Boolean)
      .map((num) => Number(num));

    if (!numbers.length) {
      return { min: 0, max: 0 };
    }

    if (numbers.length === 1) {
      return { min: numbers[0], max: numbers[0] };
    }

    return {
      min: Math.min(...numbers),
      max: Math.max(...numbers)
    };
  };

  const deriveLocationParts = (text) => {
    if (!text) {
      return { city: 'Not specified', state: 'Not specified' };
    }

    const [city, state] = text.split(',').map((part) => part.trim()).filter(Boolean);
    if (city && state) {
      return { city, state };
    }

    return {
      city: city || state || text.trim(),
      state: state || city || text.trim()
    };
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.company.trim()) newErrors.company = 'Company is required';
    if (!formData.salaryInput.trim()) newErrors.salaryInput = 'Salary is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.jobType) newErrors.jobType = 'Job type is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';

    setFieldErrors(newErrors);
    setError(Object.values(newErrors)[0] || '');
    return newErrors;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      salaryInput: '',
      location: '',
      jobType: 'on-site',
      description: ''
    });
    setError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length) {
      return;
    }

    setIsSubmitting(true);

    const salary = parseSalaryInput(formData.salaryInput);
    const locationParts = deriveLocationParts(formData.location);

    const payload = {
      title: formData.title.trim(),
      company: formData.company.trim(),
      description: formData.description.trim(),
      salary: {
        min: salary.min,
        max: salary.max,
        currency: 'INR'
      },
      salaryText: formData.salaryInput.trim(),
      location: {
        city: locationParts.city,
        state: locationParts.state,
        country: 'India',
        remote: formData.jobType === 'remote'
      },
      locationText: formData.location.trim(),
      jobType: formData.jobType,
      employmentType: 'full-time',
      category: 'other',
      requirements: ['N/A'],
      benefits: ['N/A'],
      experience: {
        min: 0,
        max: 0
      },
      isActive: true
    };

    try {
      if (isEdit && jobData?._id) {
        await jobAPI.updateJob(jobData._id, payload);
        alert('Job updated successfully!');
      } else {
        const response = await jobAPI.createJob(payload);
        window.dispatchEvent(
          new CustomEvent('jobPosted', { detail: { job: response.job || response } })
        );
        alert('Job posted successfully!');
      }

      onJobPosted?.();
      resetForm();
      onClose();
    } catch (err) {
      console.error('Failed to submit job', err);
      alert(err?.message || 'Failed to submit job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">{isEdit ? 'Edit Job' : 'Quick Job Post'}</h2>
            <p className="text-sm text-white/80">Share the essentials. We will handle the rest.</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldErrors?.title ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="e.g., Frontend Developer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldErrors?.company ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Your company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salary *</label>
              <input
                type="text"
                name="salaryInput"
                value={formData.salaryInput}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldErrors?.salaryInput ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="e.g., 10-15 LPA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldErrors?.location ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="City, State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type *</label>
              <select
                name="jobType"
                value={formData.jobType}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldErrors?.jobType ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <option value="on-site">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                fieldErrors?.description ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Describe responsibilities, must-haves, and perks"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {isSubmitting ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPostingModal;
