"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { datadogRum } from '@datadog/browser-rum';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 코드 블록 추출 및 포맷팅 함수
const formatMessageContent = (content: string) => {
  // 코드 블록 패턴 (```language code ```)
  const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g;
  
  let formattedContent = content;
  let lastIndex = 0;
  const parts: JSX.Element[] = [];
  
  // 코드 블록 처리
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // 코드 블록 이전 텍스트 추가
    if (match.index > lastIndex) {
      const textBeforeCode = content.substring(lastIndex, match.index);
      parts.push(<span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: processText(textBeforeCode) }} />);
    }
    
    // 코드 블록 추가
    const language = match[1] || 'text';
    const code = match[2].trim();
    parts.push(
      <div key={`code-${match.index}`} className="my-2 sm:my-3 rounded-md overflow-hidden w-full">
        <div className="bg-gray-800 text-white text-xs px-2 sm:px-3 py-1 flex justify-between items-center">
          <span>{language}</span>
          <button 
            onClick={(e) => {
              navigator.clipboard.writeText(code);
              // Visual feedback for copy
              const button = e.currentTarget;
              const originalInnerHTML = button.innerHTML;
              button.innerHTML = '<span class="text-green-400">Copied!</span>';
              setTimeout(() => {
                button.innerHTML = originalInnerHTML;
              }, 2000);
            }}
            className="text-xs text-gray-300 hover:text-white focus:outline-none px-1 sm:px-2 py-0.5 rounded hover:bg-gray-700 transition-colors flex items-center gap-0.5 sm:gap-1"
            title="Copy code"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="hidden xs:inline">Copy</span>
          </button>
        </div>
        <div className="overflow-x-auto w-full" style={{ 
          maxWidth: '100%',
          overflowX: 'auto'
        }}>
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{ 
              margin: 0, 
              fontSize: '0.8rem',
              padding: '1em',
              overflowWrap: 'break-word',
              maxWidth: '100%',
              wordBreak: 'break-all'
            }}
            codeTagProps={{
              style: {
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                overflowWrap: 'break-word'
              }
            }}
            wrapLines={true}
            wrapLongLines={true}
            showLineNumbers={false}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // 남은 텍스트 추가
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    parts.push(<span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: processText(remainingText) }} />);
  }
  
  return parts.length > 0 ? <>{parts}</> : <span dangerouslySetInnerHTML={{ __html: processText(formattedContent) }} />;
};

// 텍스트 처리 함수 (줄바꿈 및 링크 처리)
const processText = (text: string) => {
  // 모든 URL 패턴 (http:// 또는 https://로 시작하는 모든 URL)
  // URL 끝에 HTML 태그가 포함되지 않도록 수정
  const urlRegex = /(https?:\/\/[^\s<]+)/gi;
  
  // 링크 변환 (먼저 URL을 처리)
  let processedText = text.replace(urlRegex, (match) => {
    return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-medium hover:underline break-all inline-block max-w-full cursor-pointer" style="word-break: break-all; overflow-wrap: break-word;">${match}</a>`;
  });
  
  // 줄바꿈 처리 (URL 처리 후에 줄바꿈 처리)
  processedText = processedText.replace(/\n/g, '<br />');
  
  return processedText;
};

export default function BytesAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isNewSession, setIsNewSession] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize or retrieve session ID on component mount
  useEffect(() => {
    // Try to get existing session ID from localStorage
    let storedSessionId = localStorage.getItem('bytesai_session_id');
    
    // 페이지 로드 타입 확인 (새로고침 감지)
    let isPageRefresh = false;
    
    // 최신 Performance API 사용
    if (window.performance) {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0 && navEntries[0] instanceof PerformanceNavigationTiming) {
        isPageRefresh = (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
      }
    }
    
    // 새로고침 또는 새 창/탭에서 열린 경우 새 세션으로 처리
    const isNewPageLoad = document.referrer === '' || isPageRefresh;
    
    // If no session ID exists, create a new one
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      localStorage.setItem('bytesai_session_id', storedSessionId);
      setIsNewSession(true);
    } else {
      // 세션 ID가 있어도 새로고침이나 직접 URL 접근인 경우 새 세션으로 처리
      setIsNewSession(isNewPageLoad);
    }
    
    setSessionId(storedSessionId);
    console.log('BytesAI session ID:', storedSessionId, 'isNewSession:', isNewPageLoad, 'isPageRefresh:', isPageRefresh);
  }, []);

  // Prevent scrolling on initial mount
  useEffect(() => {
    // Do nothing on initial mount - this prevents auto-scrolling when component first loads
  }, []);

  // 스크롤을 항상 최신 메시지로 이동 - only when messages change and there are messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // 사용자 메시지 추가
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    // BytesAI 세션 추적
    datadogRum.addAction('bytes_ai_query', {
      query: userMessage,
      session_id: sessionId,
      is_new_session: isNewSession,
      hasSession: !!sessionId,
      hasUser: !!session?.user,
      hasEmail: !!session?.user?.email
    });
    console.log('BytesAI tracking - Session state: ', {
      hasSession: !!sessionId,
      hasUser: !!session?.user,
      hasEmail: !!session?.user?.email,
      sessionId,
      isNewSession
    });

    try {
      // 빈 assistant 메시지 추가 (로딩 표시를 위해)
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      console.log('Sending request to BytesAI API:', userMessage);
      
      // 요청 헤더 설정
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Datadog RUM 트레이싱 헤더 명시적으로 추가
      try {
        if (datadogRum.getInternalContext) {
          const rumContext = datadogRum.getInternalContext() as any;
          console.log('Datadog RUM context:', rumContext);
          
          if (rumContext && rumContext.traceId) {
            // 트레이스 ID와 스팬 ID가 문자열인지 확인
            const traceId = String(rumContext.traceId);
            const spanId = String(rumContext.spanId);
            
            console.log('Adding Datadog tracing headers:', {
              traceId,
              spanId
            });
            
            // 명시적으로 트레이싱 헤더 추가 (소문자로 통일)
            headers['x-datadog-trace-id'] = traceId;
            headers['x-datadog-parent-id'] = spanId;
            headers['x-datadog-sampling-priority'] = '1';
            headers['x-datadog-origin'] = 'rum';
          } else {
            console.log('No Datadog RUM traceId available in context');
          }
        } else {
          console.log('Datadog RUM getInternalContext not available');
        }
      } catch (error) {
        console.error('Error adding Datadog tracing headers:', error);
      }
      
      console.log('Request headers:', headers);
      
      const response = await fetch('/api/bytes-ai', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ 
          query: userMessage,
          session_id: sessionId,
          user_id: session?.user?.email || 'anonymous',
          is_new_session: isNewSession
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // 응답 처리
      const responseData = await response.json();
      
      // 응답 텍스트 추출
      let assistantResponse = '';
      if (responseData.response) {
        assistantResponse = responseData.response;
      } else if (responseData.body && responseData.body.response) {
        assistantResponse = responseData.body.response;
      } else {
        assistantResponse = JSON.stringify(responseData);
      }

      // 스트리밍 효과 시뮬레이션
      setIsTyping(true);
      let displayedText = '';
      const textLength = assistantResponse.length;
      
      // 타이핑 효과 설정
      const chunkSize = 1; // 한 글자씩 표시 (최소 단위)
      const baseDelay = 17; // 기본 딜레이 (밀리초, 자연스러운 타이핑 속도)
      const variance = 9; // 랜덤 딜레이를 추가해서 자연스럽게 만들기
      
      for (let i = 0; i < textLength; i += chunkSize) {
        const end = Math.min(i + chunkSize, textLength);
        displayedText = assistantResponse.substring(0, end);
        
        // 메시지 업데이트
        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: displayedText,
            };
          }
          return newMessages;
        });
        
        // 스크롤을 최신 메시지로 이동
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        
        // 타이핑 효과를 위한 딜레이 (문장 부호에 따라 다른 딜레이 적용)
        const currentChar = assistantResponse[i] || '';
        let delay = baseDelay;
        
        // 문장 부호에 따라 딜레이 조정
        if (['.', '!', '?', '\n'].includes(currentChar)) {
          delay = 300; // 문장 끝이나 줄바꿈에서 더 긴 딜레이
        } else if ([',', ';', ':'].includes(currentChar)) {
          delay = 150; // 쉼표 등에서 중간 딜레이
        }
        
        // 랜덤 딜레이 추가 (자연스러운 타이핑 효과)
        const randomVariance = Math.floor(Math.random() * variance);
        delay += randomVariance;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      setIsTyping(false);

      if (isNewSession) {
        setIsNewSession(false);
      }
    } catch (error) {
      console.error('Error calling BytesAI API:', error);
      
      // 에러 메시지 표시
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages.length > 0) {
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.',
          };
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 바 컴포넌트
  const LoadingBar = () => (
    <div className="flex items-center justify-center text-xs text-gray-500">
      <svg className="animate-spin mr-2 h-3 w-3 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Processing...</span>
    </div>
  );

  return (
    <div className="h-[90%] flex flex-col bg-white rounded-lg shadow-lg max-h-[90vh] overflow-hidden">
      <div className="flex items-center p-2 sm:p-3 border-b">
        <h2 className="text-base sm:text-lg font-bold text-purple-900">Bytes AI</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 sm:space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 sm:py-16">
            <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2 sm:mb-3">Ask a question related to Datadog!</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4 px-2">
              Bytes AI provides answers to questions based on Datadog <a href="https://docs.datadoghq.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline cursor-pointer">docs</a> and <a href="https://www.datadoghq.com/blog/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline cursor-pointer">blog</a>.
            </p>
            <div className="space-y-2 max-w-md mx-auto text-left px-2 sm:px-0">
              <div className="p-2 sm:p-2.5 text-sm sm:text-base bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors" 
                   onClick={() => setInput("What's the process for installing the Datadog Agent?")}>
                "What's the process for installing the Datadog Agent?"
              </div>
              <div className="p-2 sm:p-2.5 text-sm sm:text-base bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                   onClick={() => setInput("How does Datadog collect logs?")}>
                "How does Datadog collect logs?"
              </div>
              <div className="p-2 sm:p-2.5 text-sm sm:text-base bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                   onClick={() => setInput("What's the best way to configure APM in Datadog?")}>
                "What's the best way to configure APM in Datadog?"
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <img 
                    src="/main.png" 
                    alt="Datadog Logo" 
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-1 sm:mr-2 flex-shrink-0 self-start mt-1 object-cover"
                  />
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-2.5 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  } break-words whitespace-pre-wrap overflow-hidden text-sm sm:text-base`}
                  style={{ 
                    overflowWrap: 'break-word',
                    maxWidth: '100%',
                    width: message.role === 'assistant' ? '100%' : 'fit-content'
                  }}
                >
                  <div className={`overflow-hidden ${message.role === 'assistant' ? 'w-full' : 'w-auto'}`}>
                    {message.role === 'assistant' && message.content === '' && isLoading ? (
                      <LoadingBar />
                    ) : (
                      message.role === 'assistant' 
                        ? formatMessageContent(message.content)
                        : message.content
                    )}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-full ml-1 sm:ml-2 flex-shrink-0 self-start mt-1 flex items-center justify-center">
                    <img src="/bone.jpg" alt="Bone Icon" className="w-8 h-8 sm:w-12 sm:h-12 object-contain" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-1 sm:gap-2 p-2 sm:p-3 border-t">
        <input
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder="Asking Bytes AI a question..."
          disabled={isLoading || isTyping}
          className="flex-1 border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button 
          type="submit" 
          disabled={isLoading || isTyping || !input.trim()}
          className="bg-purple-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-md hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {isLoading || isTyping ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs sm:text-sm">Processing...</span>
            </span>
          ) : 'Send'}
        </button>
      </form>
    </div>
  );
} 