'use client';

import { datadogRum } from '@datadog/browser-rum';

// Window 타입에 DD_RUM 속성 추가
declare global {
  interface Window {
    DD_RUM?: boolean;
  }
}

// 전역 변수로 초기화 상태 추적
let isInitialized = false;

// 전역 스코프에서 초기화 시도
if (typeof window !== 'undefined' && !isInitialized) {
  // 이미 초기화되었는지 확인
  if (!window.DD_RUM && !datadogRum.getInternalContext()) {
    console.log('Initializing Datadog RUM');
    datadogRum.init({
      applicationId: '267deee3-0bfc-439b-a059-e20ac7c1afd2',
      clientToken: 'pub438544fdaf9c6399426a1fa39453ef00',
      site: 'datadoghq.com',
      service: 'dd-hub',
      env: process.env.DD_ENV || 'prod',
      version: '1.0.0',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 100,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input',
      allowedTracingUrls: [
        /^https?:\/\/.*\.leedoing\.com(:\d+)?\/.*$/,  // *.leedoing.com의 전체 URL
        /^http:\/\/localhost(:\d+)?\/.*$/              // localhost의 전체 URL
      ],
      traceSampleRate: 100
    });
    isInitialized = true;
    // 전역 변수에 초기화 상태 저장
    if (typeof window !== 'undefined') {
      window.DD_RUM = true;
    }
  } else {
    console.log('Datadog RUM already initialized');
  }
}

// 컴포넌트는 단순히 렌더링만 담당
export function DatadogRUM() {
  return null;
}