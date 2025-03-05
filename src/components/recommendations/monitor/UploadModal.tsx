'use client';

import { useState, useRef } from 'react';
import Modal from '@/components/common/Modal';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: any) => void;
  email: string;
}

export default function UploadModal({ isOpen, onClose, onUpload, email }: UploadModalProps) {
  const [step, setStep] = useState<'upload' | 'form'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [jsonContent, setJsonContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 폼 필드
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [priority, setPriority] = useState<number | null>(null);
  const [target, setTarget] = useState('devops'); // 기본값을 DevOps로 설정
  const [language, setLanguage] = useState('en');
  const [thresholds, setThresholds] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonContent(content);
        
        // JSON 파싱 및 필드 채우기
        const parsedData = JSON.parse(content);
        
        if (parsedData.name) setName(parsedData.name);
        if (parsedData.type) setType(parsedData.type);
        if (parsedData.query) setQuery(parsedData.query);
        if (parsedData.message) setMessage(parsedData.message);
        if (parsedData.tags) {
          if (Array.isArray(parsedData.tags)) {
            setTags(parsedData.tags);
          } else if (typeof parsedData.tags === 'string') {
            setTags([parsedData.tags]);
          }
        }
        if ('priority' in parsedData) {
          // priority가 숫자인지 확인하고 설정
          const priorityValue = parsedData.priority;
          if (priorityValue !== null && typeof priorityValue === 'number') {
            setPriority(priorityValue);
          } else if (priorityValue === null) {
            setPriority(null);
          }
        }
        
        // options.thresholds 정보 추출
        if (parsedData.options && parsedData.options.thresholds) {
          setThresholds(parsedData.options.thresholds);
        } else {
          setThresholds(null);
        }
        
        // 다음 단계로 이동
        setStep('form');
        setError('');
      } catch {
        setError('Invalid JSON file. Please check the file format.');
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read the file. Please try again.');
    };
    
    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setJsonContent('');
    setName('');
    setType('');
    setQuery('');
    setMessage('');
    setTags([]);
    setPriority(null);
    setThresholds(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManualJsonInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setJsonContent(content);
    
    try {
      if (content.trim()) {
        const parsedData = JSON.parse(content);
        
        if (parsedData.name) setName(parsedData.name);
        if (parsedData.type) setType(parsedData.type);
        if (parsedData.query) setQuery(parsedData.query);
        if (parsedData.message) setMessage(parsedData.message);
        if (parsedData.tags) {
          if (Array.isArray(parsedData.tags)) {
            setTags(parsedData.tags);
          } else if (typeof parsedData.tags === 'string') {
            setTags([parsedData.tags]);
          }
        }
        if ('priority' in parsedData) {
          // priority가 숫자인지 확인하고 설정
          const priorityValue = parsedData.priority;
          if (priorityValue !== null && typeof priorityValue === 'number') {
            setPriority(priorityValue);
          } else if (priorityValue === null) {
            setPriority(null);
          }
        }
        
        // options.thresholds 정보 추출
        if (parsedData.options && parsedData.options.thresholds) {
          setThresholds(parsedData.options.thresholds);
        } else {
          setThresholds(null);
        }
      }
    } catch {
      // JSON 파싱 오류는 무시 (사용자가 입력 중일 수 있음)
    }
  };

  const handleContinue = () => {
    try {
      // JSON 파싱 및 필드 채우기
      const parsedData = JSON.parse(jsonContent);
      
      if (parsedData.name) setName(parsedData.name);
      if (parsedData.type) setType(parsedData.type);
      if (parsedData.query) setQuery(parsedData.query);
      if (parsedData.message) setMessage(parsedData.message);
      if (parsedData.tags) {
        if (Array.isArray(parsedData.tags)) {
          setTags(parsedData.tags);
        } else if (typeof parsedData.tags === 'string') {
          setTags([parsedData.tags]);
        }
      }
      if ('priority' in parsedData) {
        // priority가 숫자인지 확인하고 설정
        const priorityValue = parsedData.priority;
        if (priorityValue !== null && typeof priorityValue === 'number') {
          setPriority(priorityValue);
        } else if (priorityValue === null) {
          setPriority(null);
        }
      }
      
      // options.thresholds 정보 추출
      if (parsedData.options && parsedData.options.thresholds) {
        setThresholds(parsedData.options.thresholds);
      } else {
        setThresholds(null);
      }
      
      // 다음 단계로 이동
      setStep('form');
      setError('');
    } catch {
      setError('Invalid JSON format. Please check your input.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 필수 필드 검증
      if (!name || !type || !query) {
        setError('Name, type, and query are required');
        setIsLoading(false);
        return;
      }

      // JSON 파싱
      let monitorData;
      try {
        monitorData = JSON.parse(jsonContent);
      } catch {
        setError('Invalid JSON format. Please check your input.');
        setIsLoading(false);
        return;
      }

      // 메타데이터 추가
      const timestamp = new Date().toISOString();
      const monitorWithMetadata = {
        ...monitorData,
        name,
        type,
        query,
        message,
        tags,
        priority, // 원본 JSON의 priority 값 사용
        // options 정보가 있으면 유지하고, thresholds가 있으면 업데이트
        options: {
          ...(monitorData.options || {}),
          ...(thresholds ? { thresholds } : {})
        },
        target,
        language,
        contributor: email,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await onUpload(monitorWithMetadata);
      
      // 성공 시 폼 초기화
      handleClose();
    } catch {
      setError('Failed to upload monitor. Please try again.');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // 모달 닫을 때 상태 초기화
    setStep('upload');
    setFile(null);
    setJsonContent('');
    setName('');
    setType('');
    setQuery('');
    setMessage('');
    setTags([]);
    setPriority(null);
    setThresholds(null);
    setTarget('devops');
    setLanguage('en');
    setError('');
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'upload' ? 'Upload Monitor' : 'Monitor Details'}
      className="max-w-4xl"
    >
      {step === 'upload' ? (
        // 첫 번째 단계: 파일 업로드 또는 JSON 입력
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload JSON file
              </label>
              <div className="flex items-center space-x-2">
                <label className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 cursor-pointer">
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {file && (
                  <span className="text-sm text-gray-600">{file.name}</span>
                )}
              </div>
            </div>
            
            <div className="my-4 text-center text-gray-500">OR</div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste JSON directly
              </label>
              <textarea
                rows={10}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                placeholder={`{\n  "name": "Monitor Name",\n  "type": "metric alert",\n  "query": "avg(last_5m):avg:system.cpu.user{*} > 80",\n  "message": "CPU usage is high",\n  "tags": ["env:production", "team:infrastructure"],\n  "priority": 1\n}`}
                value={jsonContent}
                onChange={handleManualJsonInput}
              />
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!jsonContent}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        // 두 번째 단계: 폼 작성
        <div className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-900">
                  Selected file: {file ? file.name : 'JSON input'}
                </p>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-50 cursor-not-allowed"
                    required
                    type="text"
                    value={name}
                    readOnly
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <input
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-50 cursor-not-allowed"
                    required
                    type="text"
                    value={type}
                    readOnly
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Query
                  </label>
                  <textarea
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-50 cursor-not-allowed"
                    required
                    value={query}
                    readOnly
                    rows={3}
                    style={{ resize: 'vertical', minHeight: '60px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-50 cursor-not-allowed"
                    value={message}
                    readOnly
                    style={{ resize: 'vertical', minHeight: '60px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tags
                  </label>
                  <textarea
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-50 cursor-not-allowed"
                    value={tags.join(', ')}
                    readOnly
                    rows={3}
                    style={{ resize: 'vertical', minHeight: '60px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  />
                </div>
                
                {thresholds && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Thresholds
                    </label>
                    <textarea
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-50 cursor-not-allowed"
                      value={JSON.stringify(thresholds, null, 2)}
                      readOnly
                      rows={3}
                      style={{ resize: 'vertical', minHeight: '60px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <input
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-50 cursor-not-allowed"
                    type="text"
                    value={priority === null ? 'Not specified' : priority.toString()}
                    readOnly
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Target
                  </label>
                  <select
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  >
                    <option value="devops">DevOps</option>
                    <option value="devsecops">DevSecOps</option>
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <select
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="ko">Korean</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contributor <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    type="text"
                    value={email}
                    readOnly
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  />
                </div>
              </div>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !name || !type || !query}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
} 