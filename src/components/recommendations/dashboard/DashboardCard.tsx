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
  sharedUrl?: string;
}

// 마크다운 스타일 텍스트를 HTML로 변환하는 함수
const formatDescription = (text: string) => {
  // 설명 문구와 목록을 분리
  const [intro, ...sections] = text.split('###').map(t => t.trim());
  
  // 인트로 텍스트 변환
  let html = intro ? `<p class="text-gray-700 mb-4">${intro}</p>` : '';
  
  // 각 섹션 변환
  sections.forEach(section => {
    if (!section) return;
    
    const [title, ...content] = section.split('\n').map(t => t.trim()).filter(Boolean);
    
    html += `
      <div class="mb-4">
        <h3 class="text-lg font-bold text-gray-900 mb-2">${title}</h3>
        <ul class="space-y-2">
          ${content
            .filter(line => line.startsWith('-'))
            .map(line => line.replace(/^-\s*/, ''))
            .map(line => `
              <li class="text-gray-700 ml-4 relative before:content-['•'] before:absolute before:left-[-1rem] before:top-[2px]">
                ${line}
              </li>
            `)
            .join('')}
        </ul>
      </div>
    `;
  });

  return html;
};

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
  sharedUrl,
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
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-3">
            {!isContributor && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                disabled={disabled}
                className="h-3.5 w-3.5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 disabled:opacity-50"
              />
            )}
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Detail 버튼 */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs px-2.5 py-1 rounded-md transition-all duration-200 text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-medium flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isExpanded ? 'Hide' : 'Detail'}
            </button>

            {/* View 버튼 */}
            <button
              onClick={() => sharedUrl && window.open(sharedUrl, '_blank')}
              disabled={!sharedUrl || sharedUrl.trim() === ''}
              className={`text-xs px-2.5 py-1 rounded-md transition-all duration-200 flex items-center gap-1 ${
                sharedUrl && sharedUrl.trim() !== ''
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </button>

            {/* Download 버튼 */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`text-xs px-2.5 py-1 rounded-md transition-all duration-200 flex items-center gap-1 ${
                isDownloading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-500 text-white hover:bg-purple-600 shadow-sm hover:shadow'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>

            {/* Delete 버튼 (contributor만) */}
            {isContributor && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`text-xs px-2.5 py-1 rounded-md transition-all duration-200 flex items-center gap-1 ${
                  isDeleting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div 
            className="prose prose-sm mt-4 space-y-4"
            dangerouslySetInnerHTML={{ 
              __html: formatDescription(description) 
            }}
          />
        )}
        
        {isExpanded && sharedUrl && (
          <div className="mt-4">
            <a
              href={sharedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Original Dashboard
            </a>
          </div>
        )}
        
        {/* 태그와 기여자 정보를 한 줄로 정렬 */}
        <div className="flex justify-between items-center">
          {/* 왼쪽: 태그들 */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
              {target}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              {language}
            </span>
          </div>
          
          {/* 오른쪽: 기여자 정보 */}
          <div className="text-sm text-gray-500">
            Contributed by {contributor}
          </div>
        </div>
      </div>
    </div>
  );
} 