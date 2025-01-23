// 대시보드 타입 정의
export interface Dashboard {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  modified_at: string;
}

// 모니터 옵션 타입 정의
interface MonitorOptions {
  thresholds?: {
    critical?: number;
    warning?: number;
    ok?: number;
  };
  notify_no_data?: boolean;
  notify_audit?: boolean;
  timeout_h?: number;
  renotify_interval?: number;
  escalation_message?: string;
  include_tags?: boolean;
  require_full_window?: boolean;
  new_host_delay?: number;
  evaluation_delay?: number;
  no_data_timeframe?: number;
  [key: string]: unknown;  // 알 수 없는 추가 옵션을 위한 인덱스 시그니처
}

// 모니터 타입 정의
export interface Monitor {
  id: number;
  name: string;
  type: string;
  query: string;
  message?: string;
  tags?: string[];
  options?: MonitorOptions;  // any 대신 구체적인 타입 사용
  created_at: number;
  modified_at: number;
}

// 동기화 결과 데이터 타입 정의
interface SyncData {
  dashboards?: {
    sourceId: string;
    targetId?: string;
    title: string;
    status: 'success' | 'failed';
    error?: string;
  }[];
  monitors?: {
    sourceId: number;
    targetId?: number;
    name: string;
    status: 'success' | 'failed';
    error?: string;
  }[];
}

// 동기화 결과 타입 정의
export interface SyncResult {
  success: boolean;
  message: string;
  data?: SyncData;  // any 대신 구체적인 타입 사용
} 