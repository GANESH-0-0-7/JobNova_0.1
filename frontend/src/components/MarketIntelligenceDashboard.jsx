import React, { useState, useEffect, useCallback } from 'react';
import marketIntelligenceAPI from '../services/marketIntelligenceAPI';

const DEFAULT_JOB_TITLE = 'Software Engineer';
const DEFAULT_LOCATION = 'Bengaluru, India';
const USD_TO_INR_EXCHANGE_RATE = 83; // Approximate USD→INR conversion used for API salary data
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const sanitizeNumericValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    return sanitizeNumericValue(value.value ?? value.amount ?? value.min ?? value.max);
  }
  return null;
};

const isValueAlreadyINR = (value) => {
  if (typeof value === 'string' && /₹|INR/i.test(value)) return true;
  if (typeof value === 'object' && typeof value.currency === 'string') {
    return value.currency.toUpperCase() === 'INR';
  }
  return false;
};

const convertToINR = (value) => {
  const numericValue = sanitizeNumericValue(value);
  if (numericValue === null) return null;
  if (isValueAlreadyINR(value)) return numericValue;
  return numericValue * USD_TO_INR_EXCHANGE_RATE;
};

const formatINRValue = (value) => {
  const converted = convertToINR(value);
  if (converted === null) return 'N/A';
  return inrFormatter.format(converted);
};

const formatINRRange = (range) => {
  if (!range) return 'N/A';
  if (Array.isArray(range)) {
    const [min, max] = range;
    const formattedMin = formatINRValue(min);
    const formattedMax = formatINRValue(max);
    if (formattedMin === 'N/A' && formattedMax === 'N/A') return 'N/A';
    return `${formattedMin} - ${formattedMax}`;
  }
  if (typeof range === 'object' && (range.min || range.max)) {
    return formatINRRange([range.min, range.max]);
  }
  if (typeof range === 'string' && range.includes('-')) {
    const [min, max] = range.split('-');
    return formatINRRange([min, max]);
  }
  return formatINRValue(range);
};

const normalizeTrendColor = (trend) => {
  if (!trend) return 'text-gray-500';
  const normalized = trend.toLowerCase();
  if (normalized.includes('increase') || normalized.includes('high') || normalized.includes('positive')) {
    return 'text-green-600';
  }
  if (normalized.includes('decrease') || normalized.includes('low') || normalized.includes('negative')) {
    return 'text-red-600';
  }
  return 'text-gray-600';
};

const MarketIntelligenceDashboard = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({
    jobTitle: DEFAULT_JOB_TITLE,
    location: DEFAULT_LOCATION,
  });

  const fetchMarketData = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketIntelligenceAPI.getMarketIntelligence(params.jobTitle, params.location);
      setMarketData(data);
    } catch (err) {
      const fallbackMessage = err.response?.data?.message || 'Unable to fetch market data right now.';
      setError(fallbackMessage);
      setMarketData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData({ jobTitle: DEFAULT_JOB_TITLE, location: DEFAULT_LOCATION });
  }, [fetchMarketData]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    fetchMarketData({
      jobTitle: formValues.jobTitle.trim() || DEFAULT_JOB_TITLE,
      location: formValues.location.trim() || DEFAULT_LOCATION,
    });
  };

  const salaryAverageDisplay = formatINRValue(marketData?.salaryData?.average);
  const salaryRangeDisplay = formatINRRange(marketData?.salaryData?.range);
  const companies = marketData?.topEmployers || [];
  const skills = marketData?.skillRequirements || [];

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl text-white p-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold">India Job Market Intelligence</h1>
              <p className="text-blue-100">Live insights tailored for Indian cities and industries</p>
            </div>

            <form onSubmit={handleSearch} className="bg-white/10 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">Job Title</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formValues.jobTitle}
                    onChange={handleInputChange}
                    placeholder="e.g. Data Scientist"
                    className="w-full px-3 py-2 bg-white/20 border border-white/40 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/60 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formValues.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Bengaluru, India"
                    className="w-full px-3 py-2 bg-white/20 border border-white/40 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/60 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-white text-blue-700 rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Analyzing...' : 'Analyze India'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div>
                <h3 className="font-medium text-red-800">Unable to fetch market data</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-blue-800">Analyzing the Indian job market...</h3>
                  <p className="text-blue-600">Gathering fresh insights from trusted local sources</p>
                </div>
              </div>
            </div>
          )}

          {marketData && !loading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Average Salary"
                  value={salaryAverageDisplay}
                  trend={marketData.salaryData?.trend}
                  color="green"
                />
                <StatCard
                  title="Job Demand"
                  value={marketData.demandTrends?.level || 'N/A'}
                  trend={marketData.demandTrends?.growth}
                  color="blue"
                />
                <StatCard
                  title="Remote Opportunities"
                  value={marketData.remoteOpportunities?.percentage ? `${marketData.remoteOpportunities.percentage}%` : 'N/A'}
                  trend={marketData.remoteOpportunities?.trend}
                  color="purple"
                />
                <StatCard
                  title="Market Confidence"
                  value={marketData.demandTrends?.confidence ? `${marketData.demandTrends.confidence}%` : 'N/A'}
                  trend={marketData.demandTrends?.sentiment}
                  color="indigo"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Insights (INR)</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Salary</span>
                      <span className="font-semibold text-green-600">{salaryAverageDisplay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Salary Range</span>
                      <span className="font-semibold">{salaryRangeDisplay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Market Trend</span>
                      <span className={`font-medium capitalize ${normalizeTrendColor(marketData.salaryData?.trend)}`}>
                        {marketData.salaryData?.trend || 'N/A'}
                      </span>
                    </div>
                    {marketData.salaryData?.dataPoints && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data Points</span>
                        <span className="font-medium">{marketData.salaryData.dataPoints} sources</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Hiring Companies in India</h3>
                  <div className="space-y-3">
                    {companies.length > 0 ? (
                      companies.slice(0, 6).map((company, index) => (
                        <CompanyCard key={`${company.name}-${index}`} company={company} index={index} />
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No company data available</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">In-Demand Skills</h3>
                <div className="flex flex-wrap">
                  {skills.length > 0 ? (
                    skills.map((skill, index) => <SkillBadge key={`${skill}-${index}`} skill={skill} />)
                  ) : (
                    <p className="text-gray-500">No skill data available</p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Remote Work Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {marketData.remoteOpportunities?.percentage || 'N/A'}%
                    </div>
                    <div className="text-gray-600">Remote Jobs Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 capitalize">
                      {marketData.remoteOpportunities?.availability || 'N/A'}
                    </div>
                    <div className="text-gray-600">Availability Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600 capitalize">
                      {marketData.remoteOpportunities?.trend || 'N/A'}
                    </div>
                    <div className="text-gray-600">Market Trend</div>
                  </div>
                </div>
              </div>

              <div className="text-center text-gray-500 text-sm">
                <p>
                  Last updated: {marketData.lastUpdated ? new Date(marketData.lastUpdated).toLocaleString() : 'N/A'}
                </p>
                <p className="text-xs text-gray-400">
                  Salary figures converted to INR at approx. ₹{USD_TO_INR_EXCHANGE_RATE}/$.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, color }) => {
  const colorMap = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value || 'N/A'}</p>
          </div>
      {trend && (
        <p className={`mt-2 text-sm font-medium ${normalizeTrendColor(trend)}`}>
          {typeof trend === 'number' ? `${trend}%` : trend}
        </p>
      )}
    </div>
  );
};

const CompanyCard = ({ company, index }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
    <div>
      <p className="font-medium text-gray-900">{company?.name || `Company ${index + 1}`}</p>
      <p className="text-sm text-gray-500">
        {company?.locations?.slice(0, 2).join(', ') || company?.industry || 'India'}
      </p>
    </div>
    <div className="text-right">
      {company?.medianSalary && <p className="text-xs text-gray-500">Median package</p>}
      <p className="text-sm font-semibold text-green-600">{formatINRValue(company?.medianSalary)}</p>
      {company?.openRoles && <p className="text-xs text-gray-500">{company.openRoles} open roles</p>}
    </div>
  </div>
);

const SkillBadge = ({ skill }) => (
  <span className="px-3 py-1 mr-2 mb-2 text-sm rounded-full bg-blue-50 text-blue-700 border border-blue-100">
    {skill}
  </span>
);

export default MarketIntelligenceDashboard;