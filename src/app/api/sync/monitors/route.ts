import { NextRequest, NextResponse } from 'next/server';
import { syncMonitors } from '@/lib/datadog-service';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    
    // 기존 sync/monitors 페이지에서의 요청 처리 (소스에서 타겟으로 동기화)
    if (requestData.sourceApiKey && requestData.sourceAppKey && requestData.targetApiKey && requestData.targetAppKey) {
      try {
        const result = await syncMonitors(requestData);
        return NextResponse.json(result);
      } catch (error) {
        console.error('Monitor sync error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
      }
    }
    
    // 단일 모니터 생성 요청 처리 (recommendation/monitors 페이지에서의 요청)
    const { monitorData, apiKey, appKey } = requestData;

    if (!monitorData || !apiKey || !appKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 모니터 데이터 복제 (원본 데이터 유지)
    const cleanedMonitorData = JSON.parse(JSON.stringify(monitorData));
    
    // Datadog API에 필요한 필드만 유지
    const requiredFields = ['name', 'type', 'query', 'message', 'tags', 'options', 'priority'];
    Object.keys(cleanedMonitorData).forEach(key => {
      if (!requiredFields.includes(key)) {
        delete cleanedMonitorData[key];
      }
    });
    
    // tags 필드 처리 - null이거나 배열이어야 함
    if (cleanedMonitorData.tags) {
      if (!Array.isArray(cleanedMonitorData.tags) || cleanedMonitorData.tags.length === 0) {
        cleanedMonitorData.tags = null;
      }
    } else {
      cleanedMonitorData.tags = null;
    }

    // trace-analytics alert 타입 모니터 처리
    if (cleanedMonitorData.type === 'trace-analytics alert' || cleanedMonitorData.type === 'network-performance alert') {
      // 기존 동작하는 모니터 구조를 참고하여 최대한 단순화
      
      // 1. 기본 구조 확인
      if (!cleanedMonitorData.options) {
        cleanedMonitorData.options = {};
      }
      
      // 2. variables 배열 처리 - 단순화된 접근법
      if (!cleanedMonitorData.options.variables || !Array.isArray(cleanedMonitorData.options.variables)) {
        // 기본 variables 구조 설정
        if (cleanedMonitorData.type === 'trace-analytics alert') {
          cleanedMonitorData.options.variables = [
            {
              "data_source": "spans",
              "name": "query",
              "compute": {
                "aggregation": "count"
              },
              "group_by": [
                {
                  "facet": "resource_name",
                  "limit": 1000,
                  "sort": {
                    "order": "desc",
                    "aggregation": "count"
                  }
                }
              ],
              "search": {
                "query": "@_trace_root:1"
              },
              "storage": "hot"
            }
          ];
        } else if (cleanedMonitorData.type === 'network-performance alert') {
          // network-performance alert 타입의 기본 variables 구조
          cleanedMonitorData.options.variables = [
            {
              "data_source": "network",
              "name": "a",
              "search": {
                "query": ""
              },
              "compute": {
                "metric": "network.retransmits",
                "aggregation": "sum"
              },
              "indexes": [
                "netflow-search-v2"
              ],
              "group_by": [
                {
                  "should_exclude_missing": true,
                  "limit": 10,
                  "facet": "network.client.auto_grouping_tags"
                },
                {
                  "should_exclude_missing": true,
                  "limit": 10,
                  "facet": "network.server.auto_grouping_tags"
                }
              ],
              "storage": "hot"
            }
          ];
        }
      }
      
      // 3. 쿼리 문자열 확인
      if (cleanedMonitorData.query && cleanedMonitorData.query.includes('formula(')) {
        // formula 쿼리는 그대로 유지
      }
      
      // 4. 기타 필수 옵션 확인
      if (!cleanedMonitorData.options.thresholds) {
        cleanedMonitorData.options.thresholds = { "critical": 20 };
      }
      
      if (cleanedMonitorData.options.groupby_simple_monitor === undefined) {
        cleanedMonitorData.options.groupby_simple_monitor = false;
      }
      
      if (cleanedMonitorData.options.silenced === undefined) {
        cleanedMonitorData.options.silenced = {};
      }
    }

    // Datadog API 호출
    try {
      // API URL을 정확히 지정 - Datadog API 공식 문서 형식
      const datadogApiUrl = 'https://api.datadoghq.com/api/v1/monitor';
      
      const response = await axios.post(
        datadogApiUrl,
        cleanedMonitorData,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'DD-API-KEY': apiKey,
            'DD-APPLICATION-KEY': appKey
          }
        }
      );
      
      return NextResponse.json({ success: true, data: response.data });
    } catch (error: any) {
      console.error('Monitor creation error:', error.response?.data || error.message);
      
      // 특정 모니터 타입에 대한 오류 메시지 개선
      if (cleanedMonitorData.type === 'trace-analytics alert' || cleanedMonitorData.type === 'network-performance alert') {
        const errorMessage = error.response?.data?.errors || error.message || 'An unknown error occurred';
        return NextResponse.json(
          { 
            success: false, 
            error: errorMessage,
            message: `${cleanedMonitorData.type} 타입의 모니터는 현재 계정에서 지원되지 않을 수 있습니다. 다른 타입의 모니터를 사용해보세요.`
          },
          { status: error.response?.status || 500 }
        );
      }
      
      const errorMessage = error.response?.data?.errors || error.message || 'An unknown error occurred';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error) {
    console.error('Request processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 