import React, { useCallback, useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Papa from 'papaparse';

const FileUpload = ({ onDataUpload }) => {
  const { isDark } = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, processing, success, error
  const [fileName, setFileName] = useState('');

  const handleFile = useCallback((file) => {
    if (!file) return;

    setFileName(file.name);
    setUploadStatus('processing');

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (results) => {
          setUploadStatus('success');
          onDataUpload(results.data, file.name);
        },
        header: true,
        error: () => {
          setUploadStatus('error');
        }
      });
    } else {
      // For Excel files, you might want to use a library like xlsx
      setUploadStatus('error');
    }
  }, [onDataUpload]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'processing':
        return <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Upload className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <div className={`p-6 rounded-xl border-2 border-dashed transition-all duration-300 ${
      dragActive 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        : isDark
          ? 'border-gray-600 bg-gray-800'
          : 'border-gray-300 bg-white'
    }`}
    onDragEnter={handleDrag}
    onDragLeave={handleDrag}
    onDragOver={handleDrag}
    onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        accept=".csv,.xlsx,.xls"
        onChange={handleChange}
        className="hidden"
      />
      
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center cursor-pointer py-8"
      >
        <div className="mb-4">
          {getStatusIcon()}
        </div>
        
        <div className="text-center">
          {uploadStatus === 'idle' && (
            <>
              <p className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Drop your inventory file here
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                or click to browse • Supports CSV and Excel files
              </p>
            </>
          )}
          
          {uploadStatus === 'processing' && (
            <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Processing {fileName}...
            </p>
          )}
          
          {uploadStatus === 'success' && (
            <div>
              <p className="text-lg font-medium text-green-600 mb-1">
                Successfully uploaded!
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {fileName} • Ready for analysis
              </p>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div>
              <p className="text-lg font-medium text-red-600 mb-1">
                Upload failed
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Please try again with a valid CSV file
              </p>
            </div>
          )}
        </div>
      </label>
    </div>
  );
};

export default FileUpload;