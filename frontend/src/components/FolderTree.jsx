import { useEffect, useState } from 'react';

export default function FolderTree({ bucket, currentPath, onNavigate }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  useEffect(() => {
    if (bucket) {
      fetchFolderTree();
    } else {
      // Clear folders when no bucket is selected
      setFolders([]);
      setExpandedFolders(new Set());
    }
  }, [bucket]);

  const fetchFolderTree = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/buckets/${bucket}/tree`);
      if (!response.ok) throw new Error('Failed to fetch folder tree');
      const data = await response.json();
      setFolders(data.folders);
      
      // Auto-expand folders in current path
      if (currentPath) {
        const newExpanded = new Set(expandedFolders);
        const parts = currentPath.split('/').filter(Boolean);
        for (let i = 0; i < parts.length; i++) {
          const path = parts.slice(0, i + 1).join('/') + '/';
          newExpanded.add(path);
        }
        setExpandedFolders(newExpanded);
      }
    } catch (err) {
      console.error('Failed to load folder tree:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const isVisible = (folder) => {
    if (folder.level === 1) return true;
    
    // Check if parent is expanded
    const parts = folder.path.split('/').filter(Boolean);
    if (parts.length === 1) return true;
    
    const parentPath = parts.slice(0, -1).join('/') + '/';
    return expandedFolders.has(parentPath);
  };

  if (!bucket) {
    return (
      <div className="text-center text-base-content/50 p-4">
        Select a bucket to view folders
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-8 w-full"></div>
        ))}
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="text-center text-base-content/50 p-4 text-sm">
        No folders in this bucket
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Root folder */}
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-base-200 transition-colors ${
          currentPath === '' ? 'bg-primary text-primary-content' : ''
        }`}
        onClick={() => onNavigate('')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
        </svg>
        <span className="text-sm font-medium">Root</span>
      </div>

      {/* Folder tree */}
      {folders.map((folder) => {
        if (!isVisible(folder)) return null;
        
        const isExpanded = expandedFolders.has(folder.path);
        const isSelected = currentPath === folder.path;
        const hasChildren = folders.some(f => 
          f.level === folder.level + 1 && 
          f.path.startsWith(folder.path)
        );

        return (
          <div
            key={folder.path}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg cursor-pointer hover:bg-base-200 transition-colors ${
              isSelected ? 'bg-primary text-primary-content' : ''
            }`}
            style={{ paddingLeft: `${folder.level * 20 + 16}px` }}
            onClick={() => onNavigate(folder.path)}
          >
            {hasChildren && (
              <button
                className="btn btn-ghost btn-xs p-0 min-h-0 h-4 w-4 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.path);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className={`w-3 h-3 stroke-current transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            )}
            {!hasChildren && <span className="w-4 flex-shrink-0"></span>}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
            </svg>
            <span className="text-sm truncate flex-1">{folder.name}</span>
          </div>
        );
      })}
    </div>
  );
}

