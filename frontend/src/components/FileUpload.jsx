import React, { useCallback, useState } from 'react';
import { Upload, File as FileIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const FileUpload = ({ onDataUpload }) => {
  const { isDark } = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState({ state: 'idle', name: '' });

  const handleFile = useCallback((file) => {
    if (!file) {
      // If a file is cleared, reset the parent state
      setStatus({ state: 'idle', name: '' });
      onDataUpload(null);
      return;
    }

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      setStatus({ state: 'success', name: file.name });
      // Pass the raw File object to the Dashboard
      onDataUpload(file);
    } else {
      setStatus({ state: 'error', name: file.name });
      onDataUpload(null);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    // Reset the input value to allow re-uploading the same file
    e.target.value = '';
  }, [handleFile]);
  
  const getStatusIcon = () => {
    switch (status.state) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Upload className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <div 
      className={`relative p-6 rounded-xl border-2 border-dashed transition-all duration-300 ${
        dragActive 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : isDark ? 'border-gray-600' : 'border-gray-300'
      }`}
      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        accept=".csv"
        onChange={handleChange}
        className="hidden"
      />
      
      <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer py-8 w-full">
        <div className="mb-4">{getStatusIcon()}</div>
        
        <div className="text-center">
          {status.state === 'idle' && (
            <>
              <p className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Drop your inventory file here
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                or click to browse • CSV files only
              </p>
            </>
          )}
          
          {status.state === 'success' && (
            <div>
              <p className="text-lg font-medium text-green-600 dark:text-green-400 mb-1">
                File Ready!
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {status.name}
              </p>
            </div>
          )}
          
          {status.state === 'error' && (
            <div>
              <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-1">
                Invalid File Type
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Please upload a valid .csv file.
              </p>
            </div>
          )}
        </div>
      </label>
    </div>
  );
};

export default FileUpload;