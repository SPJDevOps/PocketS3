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
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-200 text-base-content">
      {/* Header */}
      <header className="navbar bg-base-100 shadow-md px-8 py-4 z-10">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">PocketS3</h1>
        </div>
        <div className="flex-none">
          <BucketSelector
            selectedBucket={selectedBucket}
            onBucketChange={handleBucketChange}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 gap-6 px-6 py-5 overflow-hidden">
  {/* Sidebar */}
  <aside className="w-72 bg-base-100 rounded-xl shadow-md overflow-y-auto flex flex-col">
    <div className="p-5 border-b border-base-300">
      <h2 className="text-sm font-semibold text-base-content/70 mb-2 tracking-wide uppercase">
        Folders
      </h2>
    </div>
    <div className="p-4 flex-1 overflow-y-auto">
      <FolderTree
        bucket={selectedBucket}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />
    </div>
  </aside>

  {/* Main Panel */}
  <section className="flex-1 overflow-y-auto space-y-5 pb-8">
    {/* Breadcrumbs */}
    {selectedBucket && (
      <div className="card bg-base-100 shadow-md rounded-xl">
        <div className="card-body p-5">
          <Breadcrumbs
            currentPath={currentPath}
            onNavigate={handleNavigate}
          />
        </div>
      </div>
    )}

    {/* Upload Zone */}
    {selectedBucket && (
      <div className="card bg-base-100 shadow-md rounded-xl">
        <div className="card-body p-6">
          <UploadZone
            bucket={selectedBucket}
            currentPath={currentPath}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      </div>
    )}

    {/* File List */}
    <div className="card bg-base-100 shadow-md rounded-xl">
      <div className="card-body p-5">
        <FileList
          bucket={selectedBucket}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  </section>
</main>
    </div>
  );
}

export default App;