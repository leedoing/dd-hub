/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';

interface SyncResult {
  data?: {
    monitors: Array<{
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

const MonitorSyncForm = () => {
  const [formData, setFormData] = useState({
    sourceApiKey: '',
    sourceAppKey: '',
    sourceApiUrl: API_URL_OPTIONS['US1'],
    filterTag: '',
    targetApiKey: '',
    targetAppKey: '',
    targetApiUrl: API_URL_OPTIONS['US1'],
  });
  const [result, setResult] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [totalMonitors, setTotalMonitors] = useState(0);
  const [currentMonitor, setCurrentMonitor] = useState('');

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
    setSyncProgress(0);
    setResult(null);

    try {
      const response = await fetch('/api/sync/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.type === 'progress') {
                  setSyncProgress(data.current);
                  setTotalMonitors(data.total);
                  setCurrentMonitor(data.currentMonitor || '');
                } else if (data.type === 'result') {
                  setResult(data);
                }
              } catch (e) {
                // JSON 파싱 에러 무시
              }
            }
          }
        }
      } else {
        // Fallback for non-streaming response
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error('MonitorSyncForm - Error:', error);
      if (error instanceof Error) {
        alert(`Sync failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (key: string, value: string) => {
    if (key === 'sourceApiUrl' || key === 'targetApiUrl') {
      // 현재 URL에 해당하는 리전 코드 찾기
      const currentRegion = Object.entries(API_URL_OPTIONS).find(
        ([_, url]) => url === value
      )?.[0] || 'US1';

      return (
        <select
          name={key}
          value={currentRegion}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-purple-200 rounded-md shadow-sm 
                   focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                   text-gray-900"  // 텍스트 색상을 검은색으로 변경
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
      filterTag: 'Enter Filter Tag (Monitors synchronization by filtering based on tag'
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
      <h2 className="text-2xl font-bold mb-8 text-purple-900">Monitor Synchronization</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(formData).map(([key, value]) => {
            const labelText = {
              sourceApiKey: 'Source Api Key (e.g 8148f4a3951e42d82419fbdd96ffc3a0)',
              sourceAppKey: 'Source App Key (e.g 0011105ddbcd78164663875d3d3db8ba6401ee85)',
              sourceApiUrl: 'Source Api Url',
              filterTag: 'Filter Tag (e.g managed_by:datadog-kr-hyunjin)',
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
          {loading ? (totalMonitors > 0 ? `Syncing (${syncProgress}/${totalMonitors})...` : 'Syncing...') : 'Sync'}
        </button>
      </form>

      {/* 진행 상황 표시 */}
      {loading && totalMonitors > 0 && (
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(syncProgress / totalMonitors) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {currentMonitor ? `Syncing: ${currentMonitor} (${syncProgress} of ${totalMonitors})` : `Syncing monitor ${syncProgress} of ${totalMonitors}`}
          </p>
        </div>
      )}

      {result && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-purple-900">Sync Results:</h3>
          <div className="bg-gray-50 p-6 rounded-md overflow-auto border border-purple-100">
            {result && result.data && result.data.monitors && result.data.monitors.length > 0 ? (
              <>
                <div className="overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monitor
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.data.monitors.map((monitor, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {monitor.title}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {monitor.status === 'success' ? (
                              <span className="text-green-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                Success
                              </span>
                            ) : (
                              <span className="text-red-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                                Failed: {monitor.errorMessage}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
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
              </>
            ) : (
              <p className="text-gray-600">No monitor data available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitorSyncForm; 