import { useState } from 'react';
import { jobAPI } from '../services/api';

const PostJobModal = ({ onClose, onJobCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    salaryInput: '',
    location: '',
    jobType: 'on-site',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.salaryInput.trim()) newErrors.salaryInput = 'Salary is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.jobType) newErrors.jobType = 'Job type is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const parseSalaryInput = (input) => {
    if (!input) {
      return { min: 0, max: 0 };
    }

    const numbers = input
      .split(/[^0-9]+/)
      .filter(Boolean)
      .map(num => Number(num));

    if (numbers.length === 0) {
      return { min: 0, max: 0 };
    }

    if (numbers.length === 1) {
      return { min: numbers[0], max: numbers[0] };
    }

    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    return { min, max };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    let jobPayload;

    try {
      const { min, max } = parseSalaryInput(formData.salaryInput);
      const [cityInput, stateInput] = formData.location.split(',').map(part => part.trim()).filter(Boolean);
      const city = cityInput || formData.location.trim();
      const state = stateInput || city;

      jobPayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        company: formData.company.trim(),
        location: {
          city,
          state,
          country: 'India',
          remote: formData.jobType !== 'on-site'
        },
        salary: {
          min,
          max,
          currency: 'INR'
        },
        experience: {
          min: 0,
          max: 0
        },
        skills: [],
        employmentType: 'full-time',
        jobType: formData.jobType,
        category: 'other',
        requirements: ['N/A'],
        benefits: ['N/A'],
        deadline: null
      };

      await jobAPI.createJob(jobPayload);
      onJobCreated();
      onClose?.();
    } catch (error) {
      console.error('Error creating job:', error);
      if (jobPayload) {
        console.error('Failed job data:', jobPayload);
      }
      
      let errorMessage = 'Failed to create job. Please try again.';
      
      if (error.message && error.message.includes('Validation failed')) {
        errorMessage = 'Please check that all required fields are filled correctly.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Post a New Job</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-500">Share only the essentials. Everything else will be auto-filled for you.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Frontend Developer"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.company ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Your company name"
                />
                {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary *</label>
                <input
                  type="text"
                  name="salaryInput"
                  value={formData.salaryInput}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.salaryInput ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 10-15 LPA"
                />
                <p className="text-xs text-gray-500 mt-1">Numbers only. Use range or single value.</p>
                {errors.salaryInput && <p className="mt-1 text-sm text-red-600">{errors.salaryInput}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.location ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="City, State"
                />
                {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type *</label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.jobType ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                {errors.jobType && <p className="mt-1 text-sm text-red-600">{errors.jobType}</p>}
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
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe the role and what makes this opportunity special"
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                {loading ? 'Posting Job...' : 'Post Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostJobModal;