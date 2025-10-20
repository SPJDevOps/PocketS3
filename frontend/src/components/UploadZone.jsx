import { useState, useRef } from 'react';

export default function UploadZone({ bucket, currentPath, onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
    // Reset input
    e.target.value = '';
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (currentPath) {
          formData.append('prefix', currentPath);
        }

        const response = await fetch(`/api/buckets/${bucket}/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;

    try {
      const prefix = currentPath 
        ? `${currentPath}${folderName}`
        : folderName;

      const formData = new FormData();
      formData.append('prefix', prefix);

      const response = await fetch(`/api/buckets/${bucket}/folder`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      setFolderName('');
      setShowNewFolder(false);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      alert('Failed to create folder: ' + err.message);
    }
  };

  if (!bucket) {
    return null;
  }

  return (
    <div>
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors mb-6 ${
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-base-300 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="text-sm text-base-content/70">Uploading files...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-14 h-14 stroke-current text-base-content/40">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className="text-base-content/70 font-medium">Drag and drop files here</p>
            <p className="text-sm text-base-content/50">or</p>
            <button 
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Files
            </button>
          </div>
        )}
      </div>

      {/* New folder button */}
      <div className="border-t border-base-300 pt-6">
        {!showNewFolder ? (
          <button 
            className="btn btn-outline"
            onClick={() => setShowNewFolder(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            New Folder
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Folder name"
              className="input input-bordered flex-1"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <button 
              className="btn btn-primary"
              onClick={handleCreateFolder}
            >
              Create
            </button>
            <button 
              className="btn btn-ghost"
              onClick={() => {
                setShowNewFolder(false);
                setFolderName('');
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

