'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Modal from '@/components/common/Modal';
import UploadModal from './UploadModal';
import DashboardCard from './DashboardCard';
import SyncModal from './SyncModal';
import { getDashboards, uploadDashboard, deleteDashboard } from '@/utils/aws';
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

export default function RecommendationDashboards() {
  const router = useRouter();
  const { data: session } = useSession();
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

  const handleRoleSelect = async (role: UserRole) => {
    setUserRole(role);
    if (role === 'user') {
      setIsModalOpen(false);
      setIsAuthenticated(true);
    } else if (role === 'contributor') {
      // Contributor 선택 시 권한 체크
      if (!session?.user?.isContributor) {
        // 권한 없음 메시지 표시
        setError('You currently don\'t have Contributor access. Please send an email to lluckyy77@gmail.com to request access.');
        return;
      }
      // 권한이 있으면 인증된 상태로 설정
      setIsAuthenticated(true);
      setIsModalOpen(false);
      // 업로드 버튼이 보이도록 userRole을 contributor로 설정
      setUserRole('contributor');
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
    setUserRole('user');
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

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-8 text-purple-900">Dashboard Recommendations</h2>
      
      <div className="flex gap-6 flex-1 min-h-0">
        <FilterSection />
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-6">
            {/* User 역할일 때만 Select all과 Sync 버튼 표시 */}
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
                  disabled={selectedCount === 0}
                  className={`px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 ${
                    selectedCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Sync Selected ({selectedCount})
                </button>
              </>
            ) : (
              /* Contributor 역할일 때는 Upload 버튼만 표시하고 오른쪽 정렬 */
              <div className="flex justify-end w-full">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
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
            
            {/* 안내 메시지 추가 */}
            <p className="text-sm text-gray-600 mt-4 italic">
            If you're interested in becoming a contributor, please email{' '}
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