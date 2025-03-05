'use client';

import { useState } from 'react';
import { downloadMonitor } from '@/utils/aws';

interface MonitorCardProps {
  id: string;
  name: string;
  type: string;
  query: string;
  message: string;
  tags: string[];
  options: any;
  priority: string | number | null;
  contributor: string;
  language?: string;
  target?: string;
  createdAt: string;
  updatedAt: string;
  isContributor: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export default function MonitorCard({
  id,
  name,
  type,
  query,
  message,
  tags,
  options,
  priority,
  contributor,
  language = 'en',
  target = 'backend',
  createdAt,
  updatedAt: _updatedAt,
  isContributor,
  isSelected,
  onSelect,
  onDelete
}: MonitorCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadMonitor(`monitors/${id}.json`, name);
    } catch (error) {
      console.error('Error downloading monitor:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="h-3.5 w-3.5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 disabled:opacity-50"
            />
            <h3 className="text-base font-semibold text-gray-900">{name}</h3>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => setIsDetailOpen(!isDetailOpen)}
              className="text-xs px-2.5 py-1 rounded-md transition-all duration-200 text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-medium flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Detail
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="text-xs px-2.5 py-1 rounded-md transition-all duration-200 flex items-center gap-1 bg-purple-500 text-white hover:bg-purple-600 shadow-sm hover:shadow"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
            {isContributor && (
              <button
                onClick={onDelete}
                className="text-xs px-2.5 py-1 rounded-md transition-all duration-200 flex items-center gap-1 bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">{target}</span>
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">{language}</span>
            {priority && (
              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">{priority}</span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Contributed by {contributor} • {formatDate(createdAt)}
          </div>
        </div>
      </div>

      {isDetailOpen && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Type</h4>
              <p className="text-sm text-gray-600">{type}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700">Query</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded">{query}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700">Message</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{message}</p>
            </div>
            {tags && tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Tags</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tags.map((tag, index) => (
                    <span key={index} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {options && options.thresholds && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Thresholds</h4>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(options.thresholds, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 