"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { datadogRum } from '@datadog/browser-rum';
import { useSession } from 'next-auth/react';

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
      <div key={`code-${match.index}`} className="my-3 rounded-md overflow-hidden max-w-full">
        <div className="bg-gray-800 text-white text-xs px-3 py-1 flex justify-between items-center">
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
            className="text-xs text-gray-300 hover:text-white focus:outline-none px-2 py-0.5 rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
            title="Copy code"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copy</span>
          </button>
        </div>
        <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{ margin: 0, maxWidth: 'none' }}
            wrapLines={false}
            wrapLongLines={false}
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

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

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    // Track the Send button click with user email
    try {
      // Log session state for debugging
      console.log('BytesAI tracking - Session state:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasEmail: !!session?.user?.email
      });
      
      datadogRum.addAction('BytesAI_Send', {
        user_email: session?.user?.email || 'anonymous',
        has_session: !!session,
        has_user: !!session?.user,
        has_email: !!session?.user?.email,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking BytesAI action:', error);
    }

    // 사용자 메시지 추가
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      // 빈 assistant 메시지 추가 (스트리밍 효과를 위해)
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const response = await fetch('/api/bytes-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      // 스트리밍 효과 구현
      if (data.response) {
        const responseText = data.response;
        let displayedText = '';
        
        // 마지막 메시지 인덱스 찾기
        const lastIndex = messages.length;
        
        // 한 글자씩 추가하는 효과
        for (let i = 0; i < responseText.length; i++) {
          displayedText += responseText[i];
          
          setMessages((prev) => {
            const newMessages = [...prev];
            if (newMessages.length >= lastIndex) {
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: displayedText,
              };
            }
            return newMessages;
          });
          
          // 타이핑 효과를 위한 딜레이
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } else {
        // 응답이 없는 경우 에러 메시지 표시
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: '응답을 받지 못했습니다.',
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // 에러 메시지 표시
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: '죄송합니다, 요청을 처리하는 중에 오류가 발생했습니다.',
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[90%] flex flex-col bg-white rounded-lg shadow-lg max-h-[90vh] overflow-hidden">
      <div className="flex items-center p-3 border-b">
        <h2 className="text-lg font-bold text-purple-900">Bytes AI</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 overflow-x-hidden">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-lg font-semibold text-gray-600 mb-3">Ask a question related to Datadog!</h3>
            <p className="text-gray-500 mb-4">
              Bytes AI provides answers to questions based on Datadog <a href="https://docs.datadoghq.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline cursor-pointer">docs</a> and <a href="https://www.datadoghq.com/blog/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline cursor-pointer">blog</a>.
            </p>
            <div className="space-y-2 max-w-md mx-auto text-left">
              <div className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors" 
                   onClick={() => setInput("What's the process for installing the Datadog Agent?")}>
                "What's the process for installing the Datadog Agent?"
              </div>
              <div className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                   onClick={() => setInput("How does Datadog collect logs?")}>
                "How does Datadog collect logs?"
              </div>
              <div className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
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
                    className="w-8 h-8 rounded-full mr-2 flex-shrink-0 self-start mt-1 object-cover"
                  />
                )}
                <div
                  className={`max-w-[80%] p-2.5 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  } break-words whitespace-pre-wrap overflow-hidden`}
                  style={{ overflowWrap: 'break-word', wordWrap: 'break-word' }}
                >
                  <div className="overflow-hidden">
                    {message.role === 'assistant' 
                      ? formatMessageContent(message.content)
                      : message.content
                    }
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-12 h-12 bg-white rounded-full ml-2 flex-shrink-0 self-start mt-1 flex items-center justify-center">
                    <img src="/bone.jpg" alt="Bone Icon" className="w-12 h-12 object-contain" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t">
        <input
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder="Asking Bytes AI a question..."
          disabled={isLoading}
          className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="bg-purple-600 text-white px-5 py-2 rounded-md hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : 'Send'}
        </button>
      </form>
    </div>
  );
} 