/* eslint-disable react/no-unescaped-entities */
'use client';

import React from 'react';

export default function Home() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="space-y-8 max-w-[960px] mx-auto">
        {/* 소개 섹션 */}
        <section>
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-medium">
            This is not an official Datadog service. This is a personal project created to enhance the convenience of using Datadog and for PoC (Proof of Concept) purposes. 
            Datadog API Keys and Application Keys used in this service are not stored.
            </p>
          </div>
          <p className="text-gray-600 text-lg font-sans">
          This service helps you find the best Dashboards and Monitors for your Datadog setup. 
        These resources are curated from Datadog's out-of-box content and real-world experience. 
        You can sync Dashboards and Monitors between your Datadog accounts in just a few clicks.
          </p>
        </section>

        {/* 주요 기능 섹션 - 순서 변경 및 이름 수정 */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-purple-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-purple-900 mb-3">Dashboard Recommendations</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Datadog Cost Estimate
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Infrastructure & AWS
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="flex flex-col">
                  <span>APM</span>
                  <span className="text-sm text-gray-500 mt-0.5">(Not Traced Metrics, e.g trace.servlet.request)</span>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                RUM
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                MySQL & PostgreSQL
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-purple-900 mb-3">Monitor Recommendations</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Infrastructure & Network
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Kubernetes
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="flex flex-col">
                  <span>APM</span>
                  <span className="text-sm text-gray-500 mt-0.5">(Not Traced Metrics, e.g trace.servlet.request)</span>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Logs
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                RUM
              </li>
            </ul>
          </div>
        </section>

        {/* 주요 기능 섹션 - 순서 변경 및 이름 수정 */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-purple-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-purple-900 mb-3">Dashboard Synchronization</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Clone dashboards between environments
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Title-based filtering support
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sync all dashboard components
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-purple-900 mb-3">Monitor Synchronization</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Clone monitors between environments
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Tag-based filtering support
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sync all monitor settings
              </li>
            </ul>
          </div>
        </section>

        {/* 지원 리전 섹션 */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-purple-900 mb-4">Supported Regions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              'US1 (api.datadoghq.com)',
              'US3 (api.us3.datadoghq.com)',
              'US5 (api.us5.datadoghq.com)',
              'EU (api.datadoghq.eu)',
              'AP1 (api.ap1.datadoghq.com)',
              'US1-FED (api.ddog-gov.com)'
            ].map((region) => (
              <div key={region} className="bg-white p-3 rounded border border-purple-100">
                <span className="text-gray-600 font-mono text-sm">{region}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 중요 안내사항 섹션 */}
        <section className="bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-purple-900 mb-3">Important Notes</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <svg className="h-6 w-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              API keys and Application keys must have appropriate permissions
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              No API keys or Application keys are stored in the application
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
} 