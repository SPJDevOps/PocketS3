import { useEffect, useState } from 'react';

export default function BucketSelector({ selectedBucket, onBucketChange }) {
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketRegion, setNewBucketRegion] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    fetchBuckets();
  }, []);

  const fetchBuckets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/buckets');
      if (!response.ok) throw new Error('Failed to fetch buckets');
      const data = await response.json();
      setBuckets(data);
      
      // Auto-select first bucket if none selected
      if (!selectedBucket && data.length > 0) {
        onBucketChange(data[0].name);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBucket = async (e) => {
    e.preventDefault();
    setCreateError(null);

    if (!newBucketName.trim()) {
      setCreateError('Bucket name is required');
      return;
    }

    try {
      setCreating(true);
      const formData = new FormData();
      formData.append('bucket_name', newBucketName.trim());
      if (newBucketRegion.trim()) {
        formData.append('region', newBucketRegion.trim());
      }

      const response = await fetch('/api/buckets', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create bucket');
      }

      const result = await response.json();
      
      // Refresh bucket list
      await fetchBuckets();
      
      // Auto-select the newly created bucket
      onBucketChange(result.name);
      
      // Close modal and reset form
      setShowModal(false);
      setNewBucketName('');
      setNewBucketRegion('');
      setCreateError(null);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setNewBucketName('');
    setNewBucketRegion('');
    setCreateError(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setNewBucketName('');
    setNewBucketRegion('');
    setCreateError(null);
  };

  if (loading) {
    return <div className="skeleton h-10 w-64"></div>;
  }

  if (error) {
    return (
      <div className="alert alert-error alert-sm">
        <span className="text-sm">Error: {error}</span>
      </div>
    );
  }

  if (buckets.length === 0) {
    return (
      <div className="flex gap-2 items-center">
        <div className="alert alert-info alert-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="text-sm">No buckets available</span>
        </div>
        <button 
          className="btn btn-primary btn-sm"
          onClick={openModal}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create
        </button>
        {renderModal()}
      </div>
    );
  }

  const renderModal = () => (
    <>
      {showModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New Bucket</h3>
            <form onSubmit={handleCreateBucket}>
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text">Bucket Name</span>
                </label>
                <input
                  type="text"
                  placeholder="my-bucket-name"
                  className="input input-bordered w-full"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  disabled={creating}
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Enter a unique bucket name
                  </span>
                </label>
              </div>

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text">Region (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="us-east-1"
                  className="input input-bordered w-full"
                  value={newBucketRegion}
                  onChange={(e) => setNewBucketRegion(e.target.value)}
                  disabled={creating}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Leave empty to use default region
                  </span>
                </label>
              </div>

              {createError && (
                <div className="alert alert-error mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{createError}</span>
                </div>
              )}

              <div className="modal-action">
                <button 
                  type="button" 
                  className="btn" 
                  onClick={closeModal}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Bucket'
                  )}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={closeModal}>
            <button type="button">close</button>
          </form>
        </dialog>
      )}
    </>
  );

  return (
    <div className="flex gap-2 items-center">
      <select 
        className="select select-bordered w-full max-w-xs"
        value={selectedBucket || ''}
        onChange={(e) => onBucketChange(e.target.value)}
      >
        <option disabled value="">Select a bucket</option>
        {buckets.map((bucket) => (
          <option key={bucket.name} value={bucket.name}>
            {bucket.name}
          </option>
        ))}
      </select>
      <button 
        className="btn btn-primary btn-sm"
        onClick={openModal}
        title="Create new bucket"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      {renderModal()}
    </div>
  );
}

