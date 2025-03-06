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

// 동기화 결과 인터페이스 추가
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
  // 동기화 결과를 저장할 상태 추가
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  // 모달이 닫힐 때 상태를 초기화하는 함수
  const handleClose = () => {
    // 약간의 지연을 두어 애니메이션이 완료된 후 상태 초기화
    onClose();
    // 모달이 닫힌 후 상태 초기화
    setTimeout(() => {
      setForm({
        targetApiKey: '',
        targetAppKey: '',
        targetApiUrl: 'US1',
      });
      setError('');
      setSyncProgress(0);
      setSyncComplete(false);
      setSyncResult(null);
    }, 300);
  };

  const getApiUrl = (value: string) => {
    return API_URL_OPTIONS.find(option => option.value === value)?.url || '';
  };

  const handleSync = async () => {
    setIsProcessing(true);
    setError('');
    setSyncProgress(0);
    setSyncComplete(false);
    setSyncResult(null);

    try {
      // 선택된 모든 대시보드에 대해 순차적으로 처리
      const allResults: SyncResult = {
        data: { dashboards: [] },
        totalCount: dashboards.length,
        successCount: 0,
        failureCount: 0
      };

      for (let i = 0; i < dashboards.length; i++) {
        const dashboard = dashboards[i];
        // S3에서 대시보드 데이터 가져오기
        const dashboardData = await getDashboardData(dashboard.s3Key);
        
        try {
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
            // 개별 대시보드 실패 처리
            allResults.failureCount++;
            if (allResults.data) {
              allResults.data.dashboards.push({
                title: dashboard.title,
                status: 'failed',
                errorMessage: data.error || 'Failed to sync dashboard'
              });
            }
          } else {
            // 성공 처리
            allResults.successCount++;
            if (allResults.data) {
              allResults.data.dashboards.push({
                title: dashboard.title,
                status: 'success',
                errorMessage: ''
              });
            }
          }
        } catch (err) {
          // 예외 발생 시 실패 처리
          allResults.failureCount++;
          if (allResults.data) {
            allResults.data.dashboards.push({
              title: dashboard.title,
              status: 'failed',
              errorMessage: err instanceof Error ? err.message : 'Unknown error'
            });
          }
        }

        // 진행 상황 업데이트
        setSyncProgress(i + 1);
      }

      setSyncComplete(true);
      setSyncResult(allResults);
      
      // 결과를 표시하고 모달은 닫지 않음 (사용자가 결과를 확인할 수 있도록)
    } catch (err) {
      console.error('Sync failed:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // 버튼 텍스트 계산
  const buttonText = useMemo(() => {
    if (syncComplete) return 'Completed';
    if (isProcessing) return `Syncing (${syncProgress}/${dashboards.length})...`;
    return `Sync ${dashboards.length} dashboard${dashboards.length > 1 ? 's' : ''}`;
  }, [isProcessing, syncProgress, dashboards.length, syncComplete]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Sync Dashboards"
      className="max-w-[65rem]"
    >
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

        {/* 동기화 결과 표시 */}
        {syncResult && syncComplete && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-purple-900">Sync Results:</h3>
            <div className="bg-gray-50 p-6 rounded-md overflow-auto border border-purple-100">
              {syncResult && syncResult.data && syncResult.data.dashboards && syncResult.data.dashboards.length > 0 ? (
                <>
                  <div className="overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dashboard
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {syncResult.data.dashboards.map((dashboard, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {dashboard.title}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                              {dashboard.status === 'success' ? (
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
                                  Failed: {dashboard.errorMessage}
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
                      <span className="font-semibold">Total:</span> {syncResult.totalCount}
                    </div>
                    <div className="text-green-600">
                      <span className="font-semibold">Success:</span> {syncResult.successCount}
                    </div>
                    <div className="text-red-600">
                      <span className="font-semibold">Failed:</span> {syncResult.failureCount}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-600">No dashboard data available</p>
              )}
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
            disabled={isProcessing || (!syncComplete && (!form.targetApiKey || !form.targetAppKey || !form.targetApiUrl))}
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