'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/common/Modal';
import MonitorCard from './MonitorCard';
import SyncModal from './SyncModal';
import UploadModal from './UploadModal';
import { getMonitors, uploadMonitor } from '@/utils/aws';

type UserRole = 'contributor' | 'user' | null;

type Filter = {
  targets: string;
  language: string;
  contributor: string;
};

interface MonitorData {
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
}

// SearchBar 컴포넌트를 외부로 이동
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => (
  <div className="relative">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search by title or description..."
      className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
    />
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
    </div>
  </div>
);

export default function RecommendationMonitors() {
  const { data: session } = useSession();
  const [monitors, setMonitors] = useState<MonitorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filter>({
    targets: 'all',
    language: 'all',
    contributor: 'all',
  });
  const [contributors, setContributors] = useState<string[]>([]);

  const handleModalClose = () => {
    setIsRoleModalOpen(false);
    if (!userRole) {
      setUserRole('user');
    }
  };

  const handleRoleSelect = async (role: UserRole) => {
    setUserRole(role);
    setIsRoleModalOpen(false);
  };

  useEffect(() => {
    if (session) {
      fetchMonitors();
    }
  }, [session]);

  const handleFilterChange = (filterType: keyof Filter, value: string) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  };

  const handleUpload = async (monitor: any) => {
    try {
      // priority 값이 숫자인지 확인하고 처리
      const priorityValue = monitor.priority !== null && monitor.priority !== undefined
        ? monitor.priority
        : null;
      
      // tags가 배열인지 확인하고 처리
      const tagsArray = Array.isArray(monitor.tags) 
        ? monitor.tags 
        : [];
      
      await uploadMonitor(monitor, {
        id: monitor.id,
        name: monitor.name,
        type: monitor.type || 'unknown',
        query: monitor.query || '',
        message: monitor.message || '',
        tags: tagsArray,
        options: monitor.options || {},
        priority: priorityValue,
        contributor: monitor.contributor,
        language: monitor.language || 'en',
        target: monitor.target || 'backend',
      });
      setIsUploadModalOpen(false);
      fetchMonitors();
      setError('');
    } catch (err) {
      console.error('Error uploading monitor:', err);
      setError('Failed to upload monitor. Please try again.');
    }
  };

  const fetchMonitors = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await getMonitors();
      setMonitors(data);
      
      // 고유한 contributor 목록 추출
      const uniqueContributors = Array.from(new Set(data.map(item => item.contributor))).sort();
      setContributors(uniqueContributors);
    } catch (error) {
      console.error('Error fetching monitors:', error);
      setLoadError('Failed to load monitors. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredMonitors = (monitors: MonitorData[], query: string) => {
    // 먼저 날짜순으로 정렬 (생성 시간 기준 내림차순)
    const sortedMonitors = [...monitors].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sortedMonitors.filter((monitor) => {
      // 검색어 필터링
      const matchesQuery =
        query === '' ||
        monitor.name.toLowerCase().includes(query.toLowerCase()) ||
        monitor.message.toLowerCase().includes(query.toLowerCase()) ||
        (monitor.tags && Array.isArray(monitor.tags) && monitor.tags.some(tag => 
          typeof tag === 'string' && tag.toLowerCase().includes(query.toLowerCase())
        ));

      // 타겟 필터링
      const matchesTarget =
        filters.targets === 'all' ||
        (monitor.target && monitor.target.toLowerCase() === filters.targets.toLowerCase());

      // 언어 필터링
      const matchesLanguage =
        filters.language === 'all' ||
        (monitor.language && monitor.language.toLowerCase() === filters.language.toLowerCase());

      // 기여자 필터링
      const matchesContributor =
        filters.contributor === 'all' ||
        monitor.contributor === filters.contributor;

      return matchesQuery && matchesTarget && matchesLanguage && matchesContributor;
    });
  };

  const itemsPerPage = 5;
  const totalPages = Math.ceil(
    getFilteredMonitors(monitors, searchQuery).length / itemsPerPage
  );

  const paginatedMonitors = useMemo(() => {
    const filtered = getFilteredMonitors(monitors, searchQuery);
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [monitors, searchQuery, currentPage, filters]);

  const Pagination = () => {
    return (
      <div className="flex justify-center items-center space-x-2 mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="flex space-x-1">
          {Array.from({ length: Math.min(totalPages, 15) }, (_, i) => {
            const pageNumber = i + 1;
            return (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`px-3 py-1 rounded ${
                  currentPage === pageNumber
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  const handleDelete = async (monitorId: string) => {
    try {
      const response = await fetch(`/api/recommendation/monitors/${monitorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 삭제 성공 시 목록 새로고침
        fetchMonitors();
        setSelectedMonitors((prev) => prev.filter((id) => id !== monitorId));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete monitor');
      }
    } catch (err) {
      console.error('Error deleting monitor:', err);
      setError('Failed to delete monitor. Please try again.');
    }
  };

  const FilterPanel = () => {
    // 타겟 옵션
    const targetOptions = [
      { value: 'all', label: 'All' },
      { value: 'devops', label: 'DevOps' },
      { value: 'devsecops', label: 'DevSecOps' },
      { value: 'frontend', label: 'Frontend' },
      { value: 'backend', label: 'Backend' },
    ];

    // 언어 옵션
    const languageOptions = [
      { value: 'all', label: 'All' },
      { value: 'en', label: 'English' },
      { value: 'ko', label: 'Korean' },
      { value: 'ja', label: 'Japanese' },
    ];

    return (
      <div className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        
        {/* 타겟 필터 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Targets</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            value={filters.targets}
            onChange={(e) => handleFilterChange('targets', e.target.value)}
          >
            {targetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* 언어 필터 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Language</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            value={filters.language}
            onChange={(e) => handleFilterChange('language', e.target.value)}
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* 기여자 필터 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Contributor</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            value={filters.contributor}
            onChange={(e) => handleFilterChange('contributor', e.target.value)}
          >
            <option value="all">All</option>
            {contributors.map((contributor) => (
              <option key={contributor} value={contributor}>
                {contributor}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const handleMonitorSelect = (monitorId: string) => {
    setSelectedMonitors((prev) =>
      prev.includes(monitorId)
        ? prev.filter((id) => id !== monitorId)
        : [...prev, monitorId]
    );
  };

  const handleSelectAll = () => {
    // 현재 필터링된 모든 모니터의 ID를 가져옴
    const allFilteredMonitorIds = getFilteredMonitors(monitors, searchQuery).map(monitor => monitor.id);
    
    // 모든 필터링된 모니터가 선택되어 있는지 확인
    const allSelected = allFilteredMonitorIds.every(id => 
      selectedMonitors.includes(id)
    );
    
    if (allSelected) {
      // 모두 선택되어 있으면 필터링된 모니터들을 선택 해제
      setSelectedMonitors(prev => 
        prev.filter(id => !allFilteredMonitorIds.includes(id))
      );
    } else {
      // 모두 선택되어 있지 않으면 필터링된 모니터들을 모두 선택
      setSelectedMonitors(prev => [
        ...prev,
        ...allFilteredMonitorIds.filter(id => !prev.includes(id))
      ]);
    }
  };

  const isAllSelected = useMemo(() => {
    const filteredMonitors = getFilteredMonitors(monitors, searchQuery);
    return filteredMonitors.length > 0 && 
           filteredMonitors.every(monitor => selectedMonitors.includes(monitor.id));
  }, [monitors, searchQuery, selectedMonitors, filters]);

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-8 text-purple-900">Monitor Recommendations</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="flex gap-6 flex-1 min-h-0">
        <FilterPanel />
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-6">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          
          <div className="flex justify-between items-center mb-6">
            {userRole === 'contributor' ? (
              <div></div>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  disabled={getFilteredMonitors(monitors, searchQuery).length === 0}
                />
                <span className="text-sm text-gray-600">Select all</span>
              </div>
            )}
            
            {userRole === 'contributor' ? (
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload Monitor
              </button>
            ) : (
              <button
                className={`px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 ${
                  selectedMonitors.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={selectedMonitors.length === 0}
                onClick={() => setIsSyncModalOpen(true)}
              >
                Sync Selected ({selectedMonitors.length})
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-auto min-h-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : loadError ? (
              <div className="text-center text-red-500 p-4">{loadError}</div>
            ) : paginatedMonitors.length === 0 ? (
              <div className="text-center text-gray-500 p-4">
                No monitors found
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 pb-4">
                {paginatedMonitors.map((monitor) => (
                  <MonitorCard
                    key={monitor.id}
                    id={monitor.id}
                    name={monitor.name}
                    type={monitor.type}
                    query={monitor.query}
                    message={monitor.message}
                    tags={monitor.tags}
                    options={monitor.options}
                    priority={monitor.priority}
                    contributor={monitor.contributor}
                    language={monitor.language}
                    target={monitor.target}
                    createdAt={monitor.createdAt}
                    updatedAt={monitor.updatedAt}
                    isContributor={userRole === 'contributor'}
                    isSelected={selectedMonitors.includes(monitor.id)}
                    onSelect={() => handleMonitorSelect(monitor.id)}
                    onDelete={() => handleDelete(monitor.id)}
                  />
                ))}
              </div>
            )}
            
            {!isLoading && paginatedMonitors.length > 0 && <Pagination />}
          </div>
        </div>
      </div>
      
      {/* 역할 선택 모달 */}
      <Modal 
        isOpen={isRoleModalOpen} 
        onClose={handleModalClose}
        title="Select Your Role"
      >
        <div className="p-6 space-y-4">
          <button
            className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            onClick={() => handleRoleSelect('contributor')}
          >
            Contributor
          </button>
          <button
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={() => handleRoleSelect('user')}
          >
            User
          </button>
          <p className="text-sm text-gray-600 mt-4 italic">
            If you&apos;re interested in becoming a contributor, please leave a message on{' '}
            <a
              href="https://www.linkedin.com/in/hyunjin-lee-35a146b1/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700"
            >
              LinkedIn
            </a>{' '}
            with your reason for joining.
          </p>
        </div>
      </Modal>
      
      {/* 업로드 모달 */}
      {userRole === 'contributor' && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleUpload}
          email={session?.user?.email || ''}
        />
      )}
      
      {/* 동기화 모달 */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        monitors={selectedMonitors.map((id) => {
          const monitor = monitors.find((m) => m.id === id);
          return monitor!;
        })}
      />
    </div>
  );
} 