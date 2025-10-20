import { useEffect, useState } from 'react';

export default function FileList({ bucket, currentPath, onNavigate, refreshTrigger }) {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (bucket) {
      fetchObjects();
    } else {
      // Clear files and folders when no bucket is selected
      setFiles([]);
      setFolders([]);
      setError(null);
    }
  }, [bucket, currentPath, refreshTrigger]);

  const fetchObjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = currentPath 
        ? `/api/buckets/${bucket}/objects?prefix=${encodeURIComponent(currentPath)}`
        : `/api/buckets/${bucket}/objects`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch objects');
      const data = await response.json();
      setFiles(data.files || []);
      setFolders(data.folders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const handleDownload = async (key) => {
    try {
      const response = await fetch(`/api/buckets/${bucket}/download/${encodeURIComponent(key)}`);
      if (!response.ok) throw new Error('Download failed');
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = key.split('/').pop();
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download file: ' + err.message);
    }
  };

  const handleDelete = async (key, type) => {
    const confirmMessage = type === 'folder' 
      ? 'Are you sure you want to delete this folder and all its contents?'
      : 'Are you sure you want to delete this file?';
    
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/buckets/${bucket}/objects/${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Delete failed');
      
      // Refresh list
      await fetchObjects();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  if (!bucket) {
    return (
      <div className="flex items-center justify-center h-64 text-base-content/50">
        Select a bucket to view files
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-12 w-full"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error: {error}</span>
        <button className="btn btn-sm" onClick={fetchObjects}>Retry</button>
      </div>
    );
  }

  const allItems = [
    ...folders.map(f => ({ ...f, type: 'folder' })),
    ...files.map(f => ({ ...f, type: 'file' }))
  ];

  if (allItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-base-content/50">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-16 h-16 stroke-current mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
        </svg>
        <p>This folder is empty</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="table">
        <thead>
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Last Modified</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {allItems.map((item) => {
            const displayName = item.type === 'folder' 
              ? item.key.split('/').filter(Boolean).pop()
              : item.key.split('/').pop();

            return (
              <tr key={item.key} className="hover:bg-base-200 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.type === 'folder' ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current text-warning flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                        </svg>
                        <button 
                          className="link link-hover font-medium text-left"
                          onClick={() => onNavigate(item.key)}
                        >
                          {displayName}
                        </button>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current text-info flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                        </svg>
                        <span>{displayName}</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{item.type === 'file' ? formatSize(item.size) : '—'}</td>
                <td className="px-4 py-3">{item.type === 'file' ? formatDate(item.lastModified) : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {item.type === 'file' && (
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDownload(item.key)}
                        title="Download"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                      </button>
                    )}
                    <button 
                      className="btn btn-ghost btn-sm text-error"
                      onClick={() => handleDelete(item.key, item.type)}
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

