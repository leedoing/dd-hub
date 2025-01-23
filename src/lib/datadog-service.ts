/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { Dashboard, Monitor } from './types';

interface SyncDashboardsParams {
  sourceApiKey: string;
  sourceAppKey: string;
  sourceApiUrl: string;
  targetApiKey: string;
  targetAppKey: string;
  targetApiUrl: string;
  filterTitle?: string;
}

export async function syncDashboards({
  sourceApiKey,
  sourceAppKey,
  sourceApiUrl,
  targetApiKey,
  targetAppKey,
  targetApiUrl,
  filterTitle
}: SyncDashboardsParams) {
  try {
    // 소스 대시보드 목록 조회
    const sourceDashboards = await axios.get(
      `${sourceApiUrl}/dashboard`,
      {
        headers: {
          'Accept': 'application/json',
          'DD-API-KEY': sourceApiKey,
          'DD-APPLICATION-KEY': sourceAppKey
        }
      }
    );

    // 제목으로 대시보드 필터링 (대소문자 구분 유지)
    let filteredDashboards = sourceDashboards.data.dashboards;
    if (filterTitle) {
      filteredDashboards = filteredDashboards.filter((d: Dashboard) => 
        d.title.includes(filterTitle)
      );
    }

    // 각 대시보드를 타겟 환경에 복제
    const results = await Promise.all(
      filteredDashboards.map(async (dashboard: Dashboard) => {
        try {
          const sourceDetails = await axios.get(
            `${sourceApiUrl}/dashboard/${dashboard.id}`,
            {
              headers: {
                'Accept': 'application/json',
                'DD-API-KEY': sourceApiKey,
                'DD-APPLICATION-KEY': sourceAppKey
              }
            }
          );

          const createDashboardRequest = {
            title: sourceDetails.data.title,
            description: sourceDetails.data.description,
            widgets: sourceDetails.data.widgets,
            layout_type: sourceDetails.data.layout_type,
            template_variable_presets: sourceDetails.data.template_variable_presets,
            template_variables: sourceDetails.data.template_variables,
            notify_list: sourceDetails.data.notify_list,
            reflow_type: sourceDetails.data.reflow_type,
            tags: sourceDetails.data.tags
          };

          const createdDashboard = await axios.post(
            `${targetApiUrl}/dashboard`,
            createDashboardRequest,
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'DD-API-KEY': targetApiKey,
                'DD-APPLICATION-KEY': targetAppKey
              }
            }
          );

          return {
            sourceId: dashboard.id,
            targetId: createdDashboard.data.id,
            title: createdDashboard.data.title,
            status: 'success'
          };
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Unknown error occurred';
            
          return {
            sourceId: dashboard.id,
            title: dashboard.title,
            status: 'failed',
            error: errorMessage
          };
        }
      })
    );

    return {
      success: true,
      data: { dashboards: results },
      totalCount: results.length,
      successCount: results.filter(r => r.status === 'success').length,
      failureCount: results.filter(r => r.status === 'failed').length
    };
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    throw new Error(errorMessage);
  }
}

// 모니터 동기화 함수
// 소스 환경에서 모니터를 가져와서 타겟 환경에 복제
export async function syncMonitors(params: any) {
  console.log('DatadogService - syncMonitors called with params:', {
    ...params,
    sourceApiKey: '[HIDDEN]',
    sourceAppKey: '[HIDDEN]',
    targetApiKey: '[HIDDEN]',
    targetAppKey: '[HIDDEN]'
  });
  
  try {
    const { sourceApiKey, sourceAppKey, sourceApiUrl, targetApiKey, targetAppKey, targetApiUrl, filterTag } = params;
    
    console.log('DatadogService - Destructured values:', {
      sourceApiUrl,
      targetApiUrl,
      filterTag,
      hasSourceApiKey: !!sourceApiKey,
      hasSourceAppKey: !!sourceAppKey,
      hasTargetApiKey: !!targetApiKey,
      hasTargetAppKey: !!targetAppKey
    });

    // 소스 모니터 목록 조회
    const sourceMonitors = await axios.get(
      `${sourceApiUrl}/monitor`,
      {
        headers: {
          'Accept': 'application/json',
          'DD-API-KEY': sourceApiKey,
          'DD-APPLICATION-KEY': sourceAppKey
        }
      }
    );

    console.log('DatadogService - Source monitors count:', sourceMonitors.data.length);

    // 태그로 모니터 필터링
    let filteredMonitors = sourceMonitors.data;
    if (filterTag) {
      filteredMonitors = filteredMonitors.filter((m: Monitor) => 
        m.tags?.some((tag: string) => tag.includes(filterTag))
      );
    }

    console.log('DatadogService - Filtered monitors count:', filteredMonitors.length);

    // 각 모니터를 타겟 환경에 복제
    const results = await Promise.all(
      filteredMonitors.map(async (monitor: Monitor) => {
        try {
          const createMonitorRequest = {
            name: monitor.name,
            type: monitor.type,
            query: monitor.query,
            message: monitor.message,
            tags: monitor.tags,
            options: monitor.options
          };

          const createdMonitor = await axios.post(
            `${targetApiUrl}/monitor`,
            createMonitorRequest,
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'DD-API-KEY': targetApiKey,
                'DD-APPLICATION-KEY': targetAppKey
              }
            }
          );

          return {
            sourceId: monitor.id,
            targetId: createdMonitor.data.id,
            name: createdMonitor.data.name,
            status: 'success'
          };
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Unknown error occurred';
            
          return {
            sourceId: monitor.id,
            name: monitor.name,
            status: 'failed',
            error: errorMessage
          };
        }
      })
    );

    console.log('DatadogService - Sync results:', results);

    return {
      success: true,
      data: { monitors: results },
      totalCount: results.length,
      successCount: results.filter(r => r.status === 'success').length,
      failureCount: results.filter(r => r.status === 'failed').length
    };
  } catch (error) {
    console.error('DatadogService - Error:', error);
    throw error;
  }
}