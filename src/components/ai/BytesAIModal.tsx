import React, { useState, useRef, useEffect } from 'react';

interface BytesAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const BytesAIModal: React.FC<BytesAIModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 스크롤을 항상 최신 메시지로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-600 rounded-full"></span>
            BytesAI
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4 max-h-[50vh]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 my-8">
              BytesAI에게 Datadog에 관한 질문을 해보세요!
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
          <input
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="BytesAI에게 질문하기..."
            disabled={isLoading}
            className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리 중
              </span>
            ) : '전송'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BytesAIModal; 