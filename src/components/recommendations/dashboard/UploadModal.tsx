'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/common/Modal';
import { uploadDashboard } from '@/utils/aws';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (dashboard: any) => void;
}

interface DashboardForm {
  title: string;
  description: string;
  target: string;
  language: string;
  contributor: string;
  sharedUrl?: string;
}

interface UploadResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export default function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const { data: session } = useSession();
  const [error, setError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [form, setForm] = useState<DashboardForm>({
    title: '',
    description: '',
    target: 'devops',
    language: 'en',
    contributor: session?.user?.email || '',
    sharedUrl: ''
  });

  const targetOptions = [
    { value: 'devops', label: 'DevOps' },
    { value: 'devsecops', label: 'DevSecOps' },
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ko', label: 'Korean' },
    { value: 'ja', label: 'Japanese' },
  ];

  const extractTitleFromFilename = (filename: string) => {
    // First remove the .json extension if present
    const withoutExtension = filename.endsWith('.json') 
      ? filename.slice(0, -5) // Remove .json (5 characters)
      : filename;
    
    // Then split by -- if present (for Datadog export format)
    return withoutExtension.split('--')[0];
  };

  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          setDashboardData(jsonData);
          setForm(prev => ({
            ...prev,
            title: extractTitleFromFilename(selectedFile.name),
            description: jsonData.description || ''
          }));
        } catch (err) {
          setError('Invalid JSON format');
        }
      };
      reader.readAsText(selectedFile);
    }
  }, [selectedFile]);

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Please select a JSON file');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFormChange = (field: keyof DashboardForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setSelectedFile(null);
    setDashboardData(null);
    setError('');
    setIsProcessing(false);
    setIsDragging(false);
    setForm({
      title: '',
      description: '',
      target: 'devops',
      language: 'en',
      contributor: session?.user?.email || '',
      sharedUrl: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleUpload = async () => {
    if (!dashboardData || !form.title || !form.contributor) {
      setError('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      const metadata = {
        title: form.title,
        description: form.description,
        target: form.target,
        language: form.language,
        contributor: form.contributor,
        sharedUrl: form.sharedUrl,
      };

      await onUpload({
        dashboardData,
        metadata
      });
      resetForm();
    } catch (err: unknown) {
      console.error('Upload failed:', err instanceof Error ? err.message : 'Unknown error');
      setError('Failed to upload dashboard');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Dashboard">
      <div className="space-y-4">
        {!selectedFile ? (
          <div
            className={`space-y-2 ${
              isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
            } border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ease-in-out`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-4 flex text-sm text-gray-600">
                <p className="text-center w-full">
                  Drag and drop JSON file here
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-900">Selected file: {selectedFile.name}</p>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={form.title}
                  readOnly
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  readOnly
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Target</label>
                <select
                  value={form.target}
                  onChange={(e) => handleFormChange('target', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
                >
                  {targetOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => handleFormChange('language', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
                >
                  {languageOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shared URL (Optional)
                </label>
                <input
                  type="url"
                  value={form.sharedUrl || ''}
                  onChange={(e) => handleFormChange('sharedUrl', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="https://app.datadoghq.com/dashboard/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contributor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={session?.user?.email || ''}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-2">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isProcessing || !form.contributor}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Upload'}
          </button>
        </div>
      </div>
    </Modal>
  );
} 