'use client';

import { useState, useMemo } from 'react';
import Modal from '@/components/common/Modal';

interface SyncResult {
  success: boolean;
  data: {
    totalCount: number;
    successCount: number;
    failureCount: number;
    monitors: Array<{
      name: string;
      status: string;
      sourceId: string;
      targetId?: string;
      error?: string;
    }>;
  };
}

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  monitors: Array<{
    id: string;
    name: string;
    type: string;
    query: string;
    message: string;
    tags: string[];
    options: any;
  }>;
}

const API_URL_OPTIONS = [
  { value: 'US1', label: 'US1', url: 'https://api.datadoghq.com' },
  { value: 'US3', label: 'US3', url: 'https://api.us3.datadoghq.com' },
  { value: 'US5', label: 'US5', url: 'https://api.us5.datadoghq.com' },
  { value: 'EU', label: 'EU', url: 'https://api.datadoghq.eu' },
  { value: 'AP1', label: 'AP1', url: 'https://api.ap1.datadoghq.com' },
  { value: 'US1-FED', label: 'US1-FED', url: 'https://api.ddog-gov.com' },
];

interface SyncForm {
  apiKey: string;
  appKey: string;
  apiUrl: string;
}

export default function SyncModal({ isOpen, onClose, monitors }: SyncModalProps) {
  const [form, setForm] = useState<SyncForm>({
    apiKey: '',
    appKey: '',
    apiUrl: 'US1',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncComplete, setSyncComplete] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const getApiUrl = (value: string) => {
    return API_URL_OPTIONS.find(option => option.value === value)?.url || 'https://api.datadoghq.com';
  };

  const handleClose = () => {
    onClose();
    // Reset state after modal closes
    setTimeout(() => {
      setForm({
        apiKey: '',
        appKey: '',
        apiUrl: 'US1',
      });
      setIsProcessing(false);
      setError('');
      setSyncProgress(0);
      setSyncComplete(false);
      setResult(null);
    }, 300);
  };

  const handleSync = async () => {
    if (!form.apiKey || !form.appKey) {
      setError('API Key and Application Key are required');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSyncProgress(0);
    setSyncComplete(false);
    setResult(null);

    try {
      const results = [];
      
      for (let i = 0; i < monitors.length; i++) {
        const monitor = monitors[i];
        try {
          const response = await fetch('/api/sync/monitors', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              monitorData: {
                type: monitor.type,
                query: monitor.query,
                name: monitor.name,
                message: monitor.message,
                tags: Array.isArray(monitor.tags) && monitor.tags.length > 0 
                  ? monitor.tags.map(tag => String(tag))
                  : null,
                options: monitor.options,
              },
              apiKey: form.apiKey,
              appKey: form.appKey,
              apiUrl: getApiUrl(form.apiUrl),
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            results.push({
              name: monitor.name,
              status: 'failed',
              sourceId: monitor.id,
              error: data.error || 'Failed to sync monitor',
            });
          } else {
            results.push({
              name: monitor.name,
              status: 'success',
              sourceId: monitor.id,
              targetId: data.data?.id,
            });
          }
        } catch {
          results.push({
            name: monitor.name,
            status: 'failed',
            sourceId: monitor.id,
            error: 'Network error',
          });
        }
        
        // Update progress
        setSyncProgress(i + 1);
      }

      const successCount = results.filter((r) => r.status === 'success').length;
      const failureCount = results.filter((r) => r.status === 'failed').length;

      setResult({
        success: failureCount === 0,
        data: {
          totalCount: monitors.length,
          successCount,
          failureCount,
          monitors: results,
        },
      });
      
      setSyncComplete(true);
    } catch (error) {
      setError('Failed to sync monitors. Please try again.');
      console.error('Sync error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Button text calculation
  const buttonText = useMemo(() => {
    if (syncComplete) return 'Completed';
    if (isProcessing) return `Syncing (${syncProgress}/${monitors.length})...`;
    return `Sync ${monitors.length} monitor${monitors.length !== 1 ? 's' : ''}`;
  }, [isProcessing, syncProgress, monitors.length, syncComplete]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Sync Monitors" className="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Target API Key
          </label>
          <input
            type="text"
            value={form.apiKey}
            onChange={(e) => setForm(prev => ({ ...prev, apiKey: e.target.value }))}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Target APP Key
          </label>
          <input
            type="text"
            value={form.appKey}
            onChange={(e) => setForm(prev => ({ ...prev, appKey: e.target.value }))}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Target API URL
          </label>
          <select
            value={form.apiUrl}
            onChange={(e) => setForm(prev => ({ ...prev, apiUrl: e.target.value }))}
            className="w-full px-4 py-2 border border-purple-200 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
          >
            {API_URL_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Progress bar */}
        {isProcessing && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(syncProgress / monitors.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {`Syncing monitor ${syncProgress} of ${monitors.length}`}
            </p>
          </div>
        )}

        {/* Sync results */}
        {result && syncComplete && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-purple-900">Sync Results:</h3>
            <div className="bg-gray-50 p-6 rounded-md overflow-auto border border-purple-100">
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
                          {monitor.name}
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
                              Failed: {monitor.error}
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
                  <span className="font-semibold">Total:</span> {result.data.totalCount}
                </div>
                <div className="text-green-600">
                  <span className="font-semibold">Success:</span> {result.data.successCount}
                </div>
                <div className="text-red-600">
                  <span className="font-semibold">Failed:</span> {result.data.failureCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end space-x-3 mt-4">
          {!syncComplete && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
          )}
          <button
            onClick={syncComplete ? handleClose : handleSync}
            disabled={isProcessing || (!syncComplete && (!form.apiKey || !form.appKey))}
            className={`px-4 py-2 rounded ${
              syncComplete
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </Modal>
  );
} 