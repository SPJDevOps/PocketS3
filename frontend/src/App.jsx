import { useState } from 'react';
import BucketSelector from './components/BucketSelector';
import Breadcrumbs from './components/Breadcrumbs';
import FolderTree from './components/FolderTree';
import FileList from './components/FileList';
import UploadZone from './components/UploadZone';
import './App.css';

function App() {
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleBucketChange = (bucket) => {
    setSelectedBucket(bucket);
    setCurrentPath('');
  };

  const handleNavigate = (path) => {
    setCurrentPath(path);
  };

  const handleUploadComplete = () => {
    // Trigger refresh of file list and folder tree by incrementing counter
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
  {/* Header */}
  <div className="navbar bg-base-100 shadow-lg px-8 py-4">
    <div className="flex-1">
      <h1 className="text-xl font-bold ml-2">PocketS3</h1>
    </div>
    <div className="flex-none gap-2 mr-2">
      <BucketSelector 
        selectedBucket={selectedBucket}
        onBucketChange={handleBucketChange}
      />
    </div>
  </div>

  {/* Main content */}
  <div className="flex flex-1 gap-6 px-6 py-6">
    {/* Sidebar - Folder Tree */}
    <div className="w-80 bg-base-100 overflow-y-auto rounded-lg shadow-md">
      <div className="p-6">
        <h2 className="text-sm font-semibold text-base-content/70 mb-4 tracking-wide">FOLDERS</h2>
        <FolderTree 
          bucket={selectedBucket}
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />
      </div>
    </div>

    {/* Main content area */}
    <div className="flex-1 overflow-y-auto space-y-6">
      {/* Breadcrumbs */}
      {selectedBucket && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-6">
            <Breadcrumbs 
              currentPath={currentPath}
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {selectedBucket && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-8">
            <UploadZone 
              bucket={selectedBucket}
              currentPath={currentPath}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        </div>
      )}

      {/* File List */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-6">
          <FileList 
            bucket={selectedBucket}
            currentPath={currentPath}
            onNavigate={handleNavigate}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  </div>
</div>
  );
}

export default App;
