'use client';

import { useState, useMemo } from 'react';
import Modal from '@/components/common/Modal';
import { getDashboardData } from '@/utils/aws';

interface DashboardData {
  id: string;
  title: string;
  description: string;
  target: string;
  language: string;
  contributor: string;
  s3Key: string;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboards: DashboardData[];
}

const API_URL_OPTIONS = [
  { value: 'US1', label: 'US1', url: 'https://api.datadoghq.com/api/v1' },
  { value: 'US3', label: 'US3', url: 'https://us3.datadoghq.com/api/v1' },
  { value: 'US5', label: 'US5', url: 'https://us5.datadoghq.com/api/v1' },
  { value: 'EU', label: 'EU', url: 'https://api.datadoghq.eu/api/v1' },
  { value: 'AP1', label: 'AP1', url: 'https://ap1.datadoghq.com/api/v1' },
  { value: 'US1-FED', label: 'US1-FED', url: 'https://api.ddog-gov.com/api/v1' },
];

interface SyncForm {
  targetApiKey: string;
  targetAppKey: string;
  targetApiUrl: string;
}

export default function SyncModal({ isOpen, onClose, dashboards }: SyncModalProps) {
  const [form, setForm] = useState<SyncForm>({
    targetApiKey: '',
    targetAppKey: '',
    targetApiUrl: 'US1',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncComplete, setSyncComplete] = useState(false);

  const getApiUrl = (value: string) => {
    return API_URL_OPTIONS.find(option => option.value === value)?.url || '';
  };

  const handleSync = async () => {
    setIsProcessing(true);
    setError('');
    setSyncProgress(0);
    setSyncComplete(false);

    try {
      // 선택된 모든 대시보드에 대해 순차적으로 처리
      for (let i = 0; i < dashboards.length; i++) {
        const dashboard = dashboards[i];
        // S3에서 대시보드 데이터 가져오기
        const dashboardData = await getDashboardData(dashboard.s3Key);
        
        // 수정된 엔드포인트 주소 (/dashboard -> /dashboards)
        const response = await fetch('/api/sync/dashboards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dashboardData: dashboardData,
            apiKey: form.targetApiKey,
            appKey: form.targetAppKey,
            apiUrl: getApiUrl(form.targetApiUrl)
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to sync dashboard');
        }

        // 진행 상황 업데이트
        setSyncProgress(i + 1);
      }

      setSyncComplete(true);
      // 3초 후에 모달 닫기
      setTimeout(() => {
        onClose();
        setSyncComplete(false);
        setSyncProgress(0);
      }, 3000);
    } catch (err) {
      console.error('Sync failed:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // 버튼 텍스트 계산
  const buttonText = useMemo(() => {
    if (syncComplete) return 'Completed!';
    if (isProcessing) return `Syncing (${syncProgress}/${dashboards.length})...`;
    return `Sync ${dashboards.length} dashboard${dashboards.length > 1 ? 's' : ''}`;
  }, [isProcessing, syncProgress, dashboards.length, syncComplete]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sync Dashboards">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Target API Key</label>
          <input
            type="text"
            value={form.targetApiKey}
            onChange={(e) => setForm(prev => ({ ...prev, targetApiKey: e.target.value }))}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Target APP Key</label>
          <input
            type="text"
            value={form.targetAppKey}
            onChange={(e) => setForm(prev => ({ ...prev, targetAppKey: e.target.value }))}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Target API URL</label>
          <select
            value={form.targetApiUrl}
            onChange={(e) => setForm(prev => ({ ...prev, targetApiUrl: e.target.value }))}
            className="w-full px-4 py-2 border border-purple-200 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
          >
            {API_URL_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 진행 상황 표시 */}
        {isProcessing && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(syncProgress / dashboards.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {`Syncing dashboard ${syncProgress} of ${dashboards.length}`}
            </p>
          </div>
        )}

        {syncComplete && (
          <div className="text-center text-green-600 font-medium">
            All dashboards have been successfully synchronized!
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSync}
            disabled={isProcessing || !form.targetApiKey || !form.targetAppKey || !form.targetApiUrl || syncComplete}
            className={`px-4 py-2 rounded ${
              syncComplete
                ? 'bg-green-600 text-white cursor-not-allowed opacity-75'
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