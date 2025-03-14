'use client';

import { useState } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface SyncResult {
  data?: {
    dashboards: Array<{
      title: string;
      status: 'success' | 'failed';
      errorMessage?: string;
    }>;
  };
  totalCount: number;
  successCount: number;
  failureCount: number;
}

const API_URL_OPTIONS = {
  'US1': 'https://api.datadoghq.com/api/v1',
  'US3': 'https://api.us3.datadoghq.com/api/v1',
  'US5': 'https://api.us5.datadoghq.com/api/v1',
  'EU': 'https://api.datadoghq.eu/api/v1',
  'AP1': 'https://api.ap1.datadoghq.com/api/v1',
  'US1-FED': 'https://api.ddog-gov.com/api/v1'
};

const DashboardSync = () => {
  const [formData, setFormData] = useState({
    sourceApiKey: '',
    sourceAppKey: '',
    sourceApiUrl: API_URL_OPTIONS['US1'],
    filterTitle: '',
    targetApiKey: '',
    targetAppKey: '',
    targetApiUrl: API_URL_OPTIONS['US1'],
  });
  const [result, setResult] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'sourceApiUrl' || name === 'targetApiUrl') {
      setFormData(prev => ({
        ...prev,
        [name]: API_URL_OPTIONS[value as keyof typeof API_URL_OPTIONS]
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/sync/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (key: string, value: string) => {
    if (key === 'sourceApiUrl' || key === 'targetApiUrl') {
      const currentRegion = Object.entries(API_URL_OPTIONS).find(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, url]) => url === value
      )?.[0] || 'US1';

      return (
        <select
          name={key}
          value={currentRegion}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-purple-200 rounded-md shadow-sm 
                   focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                   text-gray-900"
        >
          {Object.keys(API_URL_OPTIONS).map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      );
    }

    const placeholderText = {
      sourceApiKey: 'Enter source api key',
      sourceAppKey: 'Enter source app key',
      targetApiKey: `Enter ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
      targetAppKey: `Enter ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
      filterTitle: 'Enter Filter Title (Dashboards Synchronization that include text in the title'
    }[key] || `Enter ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`;

    return (
      <input
        type="text"
        name={key}
        value={value}
        onChange={handleChange}
        className="w-full px-4 py-2 border border-purple-200 rounded-md shadow-sm 
                 focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                 placeholder-purple-300 text-gray-900"
        placeholder={placeholderText}
      />
    );
  };

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-8">
      {loading && <LoadingSpinner />}
      <h2 className="text-2xl font-bold mb-8 text-purple-900">Dashboard Synchronization</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(formData).map(([key, value]) => {
            const labelText = {
              sourceApiKey: 'Source Api Key (e.g 8148f4a3951e42d82419fbdd96ffc3a0)',
              sourceAppKey: 'Source App Key (e.g 0011105ddbcd78164663875d3d3db8ba6401ee85)',
              sourceApiUrl: 'Source Api Url',
              filterTitle: 'Filter Title (e.g Datadog)',
              targetApiKey: 'Target Api Key',
              targetAppKey: 'Target App Key',
              targetApiUrl: 'Target Api Url'
            }[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

            return (
              <div key={key}>
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  {labelText}
                </label>
                {renderInput(key, value)}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-md 
                   hover:bg-purple-700 focus:outline-none focus:ring-2 
                   focus:ring-purple-500 focus:ring-offset-2 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
        >
          {loading ? 'Syncing...' : 'Sync'}
        </button>
      </form>

      {result && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-purple-900">Sync Results:</h3>
          <div className="bg-gray-50 p-6 rounded-md overflow-auto border border-purple-100">
            <pre className="text-gray-800 whitespace-pre-wrap font-mono text-sm">
              {JSON.stringify({
                dashboards: result.data?.dashboards.map(dashboard => ({
                  title: dashboard.title,
                  status: dashboard.status,
                  errorMessage: dashboard.errorMessage || ""
                })),
                totalCount: result.totalCount,
                successCount: result.successCount,
                failureCount: result.failureCount
              }, null, 2)}
            </pre>
            <div className="mt-4 flex gap-4 text-sm">
              <div className="text-purple-900">
                <span className="font-semibold">Total:</span> {result.totalCount}
              </div>
              <div className="text-green-600">
                <span className="font-semibold">Success:</span> {result.successCount}
              </div>
              <div className="text-red-600">
                <span className="font-semibold">Failed:</span> {result.failureCount}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSync; 