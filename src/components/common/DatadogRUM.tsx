'use client';

import { datadogRum } from '@datadog/browser-rum';

// 전역 스코프에서 초기화 시도
if (typeof window !== 'undefined' && !datadogRum.getInternalContext()) {
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
    defaultPrivacyLevel: 'allow',
    allowedTracingUrls: [
      window.location.origin,
      /^https?:\/\/.*\.leedoing\.com(:\d+)?\/.*$/,  // *.leedoing.com의 전체 URL
      /^http:\/\/localhost(:\d+)?\/.*$/,             // localhost의 전체 URL
      'https://tevypdyuwkuqnedfkcrfbwkvxa0gmueq.lambda-url.ap-northeast-2.on.aws/'
    ],
    traceSampleRate: 100
  });
  console.log('Datadog RUM initialization successful');
}

// 컴포넌트는 단순히 렌더링만 담당
export function DatadogRUM() {
  return null;
}