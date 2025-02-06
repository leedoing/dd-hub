'use client';

import { useState, useEffect, useMemo } from 'react';
import Modal from '@/components/common/Modal';
import UploadModal from './UploadModal';
import DashboardCard from './DashboardCard';
import SyncModal from './SyncModal';
import { getDashboards, uploadDashboard, deleteDashboard } from '@/utils/aws';

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

export default function RecommendationDashboards() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [password, setPassword] = useState('');
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

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    if (role === 'user') {
      setIsModalOpen(false);
      setIsAuthenticated(true);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contributorPassword = process.env.NEXT_PUBLIC_CONTRIBUTOR_PASSWORD;
    
    if (password === contributorPassword) {
      setIsAuthenticated(true);
      setIsModalOpen(false);
      setError('');
    } else {
      setError('Invalid password');
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

  const getFilteredDashboards = (dashboards: DashboardData[], searchQuery: string) => {
    const filtered = dashboards.filter(dashboard => {
      const matchesTarget = filters.targets === 'all' || filters.targets === dashboard.target;
      const matchesLanguage = filters.language === 'all' || filters.language === dashboard.language;
      const matchesContributor = filters.contributor === 'all' || filters.contributor === dashboard.contributor;
      
      if (!searchQuery) return matchesTarget && matchesLanguage && matchesContributor;

      const query = searchQuery.toLowerCase();
      return (
        matchesTarget && 
        matchesLanguage && 
        matchesContributor &&
        (dashboard.title.toLowerCase().includes(query) ||
         dashboard.description.toLowerCase().includes(query))
      );
    });

    return filtered;
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredDashboards = useMemo(() => {
    return getFilteredDashboards(dashboards, searchQuery);
  }, [dashboards, searchQuery, filters]);

  const handleDelete = async (dashboardId: string) => {
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
    const currentPageIds = paginatedDashboards.map(d => d.id);
    const allSelected = currentPageIds.every(id => selectedDashboards.includes(id));
    
    if (allSelected) {
      setSelectedDashboards(prev => 
        prev.filter(id => !currentPageIds.includes(id))
      );
    } else {
      setSelectedDashboards(prev => [
        ...prev,
        ...currentPageIds.filter(id => !prev.includes(id))
      ]);
    }
  };

  const isAllSelected = useMemo(() => {
    return paginatedDashboards.length > 0 && 
           paginatedDashboards.every(d => selectedDashboards.includes(d.id));
  }, [paginatedDashboards, selectedDashboards]);

  const selectedCount = selectedDashboards.length;

  const handleModalClose = () => {
    setIsModalOpen(false);
    setUserRole('user');
    setIsAuthenticated(true);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-8 text-purple-900">Dashboard Recommendations</h2>
      
      <div className="flex gap-6 flex-1 min-h-0">
        <FilterSection />
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center space-x-4 mb-6">
            {userRole !== 'contributor' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedDashboards.length === dashboards.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  disabled={!isAuthenticated}
                />
                <span className="text-sm text-gray-600">Select all</span>
              </div>
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dashboards..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              disabled={!isAuthenticated}
            />
            {userRole === 'contributor' ? (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                disabled={!isAuthenticated}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload
              </button>
            ) : (
              <button
                onClick={() => setIsSyncModalOpen(true)}
                disabled={selectedCount === 0 || !isAuthenticated}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sync ({selectedCount})
              </button>
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
                      disabled={!isAuthenticated}
                    />
                  ))}
                  <Pagination />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      {!isAuthenticated && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          title="Select Your Role"
        >
          {!userRole ? (
            <div className="space-y-4">
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
            </div>
          ) : userRole === 'contributor' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contributor Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter password"
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                <p className="mt-2 text-sm text-gray-500 italic">
                  If you want to become a contributor, please contact lluckyy77@gmail.com
                </p>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Submit
              </button>
            </form>
          ) : null}
        </Modal>
      )}

      {/* Upload Modal */}
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