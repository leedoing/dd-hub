// AWS 클라이언트 제거 - 이제 서버 사이드 API를 통해 호출

export async function uploadDashboard(dashboardData: any, metadata: any) {
  try {
    const response = await fetch('/api/aws/dashboards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dashboardData, metadata }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload dashboard');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

// 모니터 업로드 함수
export async function uploadMonitor(monitorData: any, metadata: any) {
  try {
    const response = await fetch('/api/aws/monitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ monitorData, metadata }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload monitor');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

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
  s3Key: string;
  createdAt: string;
  updatedAt: string;
}

export async function getDashboards(): Promise<DashboardData[]> {
  try {
    const response = await fetch('/api/aws/dashboards');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch dashboards');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch dashboards:', error);
    throw error;
  }
}

export async function getMonitors(): Promise<MonitorData[]> {
  try {
    const response = await fetch('/api/aws/monitors');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch monitors');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch monitors:', error);
    throw error;
  }
}

export async function downloadDashboard(s3Key: string, title: string) {
  try {
    const response = await fetch(`/api/aws/s3/${encodeURIComponent(s3Key)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to download dashboard');
    }
    
    const data = await response.json();
    
    // JSON 파일로 다운로드 (파일명을 title로 설정)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // 파일명을 title 그대로 사용하고 .json 확장자만 추가
    const fileName = `${title}.json`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

export async function downloadMonitor(s3Key: string, name: string) {
  try {
    const response = await fetch(`/api/aws/s3/${encodeURIComponent(s3Key)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to download monitor');
    }
    
    const data = await response.json();
    
    // JSON 파일로 다운로드 (파일명을 name으로 설정)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // 파일명을 name으로 설정하고 특수문자 제거
    const fileName = `${name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

export async function deleteDashboard(id: string, s3Key: string) {
  try {
    const response = await fetch(`/api/aws/dashboards?id=${encodeURIComponent(id)}&s3Key=${encodeURIComponent(s3Key)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete dashboard');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete failed:', error);
    throw error;
  }
}

export async function deleteMonitor(id: string, s3Key: string) {
  try {
    const response = await fetch(`/api/aws/monitors?id=${encodeURIComponent(id)}&s3Key=${encodeURIComponent(s3Key)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete monitor');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete failed:', error);
    throw error;
  }
}

// S3에서 대시보드 데이터 가져오기
export async function getDashboardData(s3Key: string) {
  try {
    const response = await fetch(`/api/aws/s3/${encodeURIComponent(s3Key)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get dashboard data from S3');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get dashboard data:', error);
    throw error;
  }
}

// S3에서 모니터 데이터 가져오기
export async function getMonitorData(s3Key: string) {
  try {
    const response = await fetch(`/api/aws/s3/${encodeURIComponent(s3Key)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get monitor data from S3');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get monitor data:', error);
    throw error;
  }
}

interface DashboardResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export const createDatadogDashboard = async (
  dashboardData: Record<string, unknown>,
  apiKey: string,
  appKey: string,
  apiUrl: string
): Promise<DashboardResponse> => {
  try {
    console.log('Sending request to create dashboard');

    const response = await fetch('/api/datadog/create-dashboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dashboardData,
        apiKey,
        appKey,
        apiUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create dashboard');
    }

    return data;
  } catch (error) {
    console.error('Failed to create dashboard:', error);
    throw error;
  }
};