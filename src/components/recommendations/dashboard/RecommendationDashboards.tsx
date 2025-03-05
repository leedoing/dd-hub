'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/common/Modal';
import UploadModal from './UploadModal';
import DashboardCard from './DashboardCard';
import SyncModal from './SyncModal';
import { getDashboards, uploadDashboard } from '@/utils/aws';
import { datadogRum } from '@datadog/browser-rum';

type UserRole = 'contributor' | 'user' | null;

type Filter = {
  targets: string;
  language: string;
  contributor: string;
};

interface DashboardData {
  id: string;
  title: string;
  description: string;
  target: string;
  language: string;
  contributor: string;
  s3Key: string;
  downloads: number;
  sharedUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// SearchBar 컴포넌트를 외부로 이동
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => (
  <div className="mb-6">
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  </div>
);

export default function RecommendationDashboards() {
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [dashboards, setDashboards] = useState<DashboardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;  // 페이지당 아이템 수

  const [filters, setFilters] = useState<Filter>({
    targets: 'all',
    language: 'all',
    contributor: 'all'
  });

  const [contributors, setContributors] = useState<string[]>([]);

  const filterOptions = {
    targets: [
      { value: 'all', label: 'All' },
      { value: 'devops', label: 'DevOps' },
      { value: 'devsecops', label: 'DevSecOps' },
      { value: 'frontend', label: 'Frontend' },
      { value: 'backend', label: 'Backend' },
    ],
    language: [
      { value: 'all', label: 'All' },
      { value: 'en', label: 'English' },
      { value: 'ko', label: 'Korean' },
      { value: 'ja', label: 'Japanese' },
    ],
    contributor: [
      { value: 'all', label: 'All' },
      // DynamoDB에서 가져올 예정
    ],
  };

  const handleRoleSelect = async (role: UserRole) => {
    if (role === 'user') {
      setIsModalOpen(false);
      setIsAuthenticated(true);
    } else if (role === 'contributor') {
      try {
        // DynamoDB에서 직접 사용자 권한 확인
        const response = await fetch('/api/auth/check-contributor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: session?.user?.email
          }),
        });

        const data = await response.json();
        
        if (!data.isContributor) {
          setError('You currently don\'t have Contributor access. Please send an email to lluckyy77@gmail.com to request access.');
          return;
        }

        setUserRole('contributor');
        setIsModalOpen(false);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to check contributor status:', error);
        setError('Failed to verify contributor status. Please try again.');
      }
    }
  };

  const handleFilterChange = (filterType: keyof Filter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleUpload = async (dashboard: any) => {
    try {
      await uploadDashboard(dashboard.dashboardData, dashboard.metadata);
      // 업로드 성공 후 대시보드 목록 새로고침
      await fetchDashboards();
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
      // TODO: 에러 처리
    }
  };

  const fetchDashboards = async () => {
    try {
      const data = await getDashboards();
      setDashboards(data);
      
      // 중복 제거된 contributor 목록 생성
      const uniqueContributors = Array.from(
        new Set(data.map(dashboard => dashboard.contributor))
      ).sort();
      
      setContributors(uniqueContributors);
      setLoadError('');
    } catch (err) {
      setLoadError('Failed to load dashboards');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();  // 인증 상태와 관계없이 초기에 데이터 로드
  }, []); // isAuthenticated 의존성 제거

  const getFilteredDashboards = (dashboards: DashboardData[], query: string) => {
    // 먼저 날짜순으로 정렬
    const sortedDashboards = [...dashboards].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 그 다음 필터링
    const filtered = sortedDashboards.filter(dashboard => {
      const matchesTarget = filters.targets === 'all' || filters.targets === dashboard.target;
      const matchesLanguage = filters.language === 'all' || filters.language === dashboard.language;
      const matchesContributor = filters.contributor === 'all' || filters.contributor === dashboard.contributor;
      
      if (!query) return matchesTarget && matchesLanguage && matchesContributor;

      const searchLower = query.toLowerCase();
      return (
        matchesTarget && 
        matchesLanguage && 
        matchesContributor &&
        (
          dashboard.title.toLowerCase().includes(searchLower) ||
          dashboard.description.toLowerCase().includes(searchLower)
        )
      );
    });

    return filtered;
  };

  // 검색어 상태 관리
  const [searchQuery, setSearchQuery] = useState('');

  // 검색어 변경 핸들러
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const filteredDashboards = useMemo(() => {
    return getFilteredDashboards(dashboards, searchQuery);
  }, [dashboards, searchQuery, filters]);

  const handleDelete = async (_dashboardId: string) => {
    await fetchDashboards();  // 목록 새로고침
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center space-x-2 mt-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <div className="flex space-x-1">
          {Array.from({ length: Math.min(totalPages, 15) }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  const paginatedDashboards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDashboards.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDashboards, currentPage]);

  const totalPages = Math.ceil(filteredDashboards.length / itemsPerPage);

  const FilterSection = () => {
    const contributorOptions = [
      { value: 'all', label: 'All' },
      ...contributors.map(contributor => ({
        value: contributor,
        label: contributor
      }))
    ];

    return (
      <div className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        
        {/* Targets Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Targets</label>
          <select
            value={filters.targets}
            onChange={(e) => handleFilterChange('targets', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          >
            {filterOptions.targets.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Language Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Language</label>
          <select
            value={filters.language}
            onChange={(e) => handleFilterChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          >
            {filterOptions.language.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Contributor Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Contributor</label>
          <select
            value={filters.contributor}
            onChange={(e) => handleFilterChange('contributor', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          >
            {contributorOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const [selectedDashboards, setSelectedDashboards] = useState<string[]>([]);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const handleDashboardSelect = (dashboardId: string) => {
    setSelectedDashboards(prev => 
      prev.includes(dashboardId)
        ? prev.filter(id => id !== dashboardId)
        : [...prev, dashboardId]
    );
  };

  const handleSelectAll = () => {
    // 현재 필터링된 모든 대시보드의 ID를 가져옴
    const allFilteredDashboardIds = filteredDashboards.map(d => d.id);
    
    // 모든 필터링된 대시보드가 선택되어 있는지 확인
    const allSelected = allFilteredDashboardIds.every(id => 
      selectedDashboards.includes(id)
    );
    
    if (allSelected) {
      // 모두 선택되어 있으면 필터링된 대시보드들을 선택 해제
      setSelectedDashboards(prev => 
        prev.filter(id => !allFilteredDashboardIds.includes(id))
      );
    } else {
      // 모두 선택되어 있지 않으면 필터링된 대시보드들을 모두 선택
      setSelectedDashboards(prev => [
        ...prev,
        ...allFilteredDashboardIds.filter(id => !prev.includes(id))
      ]);
    }
  };

  const isAllSelected = useMemo(() => {
    return filteredDashboards.length > 0 && 
           filteredDashboards.every(d => selectedDashboards.includes(d.id));
  }, [filteredDashboards, selectedDashboards]);

  const selectedCount = selectedDashboards.length;

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsAuthenticated(true);
  };

  // 세션 정보가 변경될 때마다 Datadog RUM 사용자 정보 업데이트
  useEffect(() => {
    if (session?.user?.email) {
      datadogRum.setUser({
        id: session.user.email,
        email: session.user.email,
        isContributor: session.user.isContributor || false,
        userRole: userRole || 'anonymous'
      });
    } else {
      // 로그인하지 않은 경우 사용자 정보 초기화
      datadogRum.clearUser();
    }
  }, [session, userRole]);

  // 세션 변경 시 로깅 추가
  useEffect(() => {
    // console.log('Session updated:', session);
    // console.log('User role:', userRole);
    // console.log('Is authenticated:', isAuthenticated);
  }, [session, userRole, isAuthenticated]);

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-8 text-purple-900">Dashboard Recommendations</h2>
      
      <div className="flex gap-6 flex-1 min-h-0">
        <FilterSection />
        <div className="flex-1 flex flex-col min-h-0">
          <SearchBar 
            value={searchQuery}
            onChange={handleSearchChange}
          />
          
          <div className="flex justify-between items-center mb-6">
            {userRole === 'user' ? (
              <>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    disabled={!isAuthenticated}
                  />
                  <span className="text-sm text-gray-600">Select all</span>
                </div>

                <button
                  onClick={() => setIsSyncModalOpen(true)}
                  disabled={selectedCount === 0 || !isAuthenticated}
                  className={`px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 ${
                    selectedCount === 0 || !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Sync Selected ({selectedCount})
                </button>
              </>
            ) : (
              <div className="flex justify-end w-full">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  disabled={!isAuthenticated}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload Dashboard
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            <div className="grid grid-cols-1 gap-4 pb-4">
              {loadError ? (
                <div className="col-span-full text-center py-12 text-red-600">
                  {loadError}
                </div>
              ) : isLoading ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="text-gray-600">Loading dashboards...</p>
                </div>
              ) : filteredDashboards.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  {dashboards.length === 0 ? 'No dashboards found' : 'No matching dashboards'}
                </div>
              ) : (
                <>
                  {paginatedDashboards.map((dashboard) => (
                    <DashboardCard
                      key={dashboard.id}
                      {...dashboard}
                      isContributor={userRole === 'contributor'}
                      onDelete={() => handleDelete(dashboard.id)}
                      isSelected={selectedDashboards.includes(dashboard.id)}
                      onSelect={() => handleDashboardSelect(dashboard.id)}
                    />
                  ))}
                  <Pagination />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isAuthenticated && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          title="Select Your Role"
        >
          <div className="p-6 space-y-4">
            <button
              onClick={() => handleRoleSelect('contributor')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Contributor
            </button>
            <button
              onClick={() => handleRoleSelect('user')}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              User
            </button>
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
            
            <p className="text-sm text-gray-600 mt-4 italic">
              If you&apos;re interested in becoming a contributor, please email{' '}
              <a 
                href="mailto:lluckyy77@gmail.com"
                className="text-purple-600 hover:text-purple-700"
              >
                lluckyy77@gmail.com
              </a>
              {' '}with your reason for joining.
            </p>
          </div>
        </Modal>
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        dashboards={dashboards.filter(d => selectedDashboards.includes(d.id))}
      />
    </div>
  );
} 