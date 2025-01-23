'use client';

import { useState } from 'react';
import { downloadDashboard, deleteDashboard } from '@/utils/aws';

interface DashboardCardProps {
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
  isContributor: boolean;
  onDelete: () => void;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export default function DashboardCard({
  id,
  title,
  description,
  target,
  language,
  contributor,
  s3Key,
  downloads,
  createdAt,
  updatedAt,
  isContributor,
  onDelete,
  isSelected,
  onSelect,
  disabled = false,
}: DashboardCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadDashboard(s3Key, title);
    } catch (error) {
      console.error('Download failed:', error);
      // TODO: 에러 처리
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this dashboard?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDashboard(id, s3Key);
      onDelete();
    } catch (error) {
      console.error('Delete failed:', error);
      // TODO: 에러 처리
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${disabled ? 'opacity-75' : ''}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-3">
            {!isContributor && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                disabled={disabled}
                className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 disabled:opacity-50"
              />
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {isExpanded ? 'Hide' : 'Detail'}
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`text-sm px-3 py-1 rounded ${
                isDownloading 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
            {isContributor && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`text-sm px-3 py-1 rounded ${
                  isDeleting
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}
        
        {/* 태그 영역 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
            {target}
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            {language}
          </span>
        </div>
        
        {/* 기여자 정보 */}
        <div className="text-sm text-gray-500">
          Contributed by {contributor}
        </div>
      </div>
    </div>
  );
} 