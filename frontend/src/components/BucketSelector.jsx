import { useEffect, useState } from 'react';

export default function BucketSelector({ selectedBucket, onBucketChange }) {
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <div className="alert alert-info alert-sm">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span className="text-sm">No buckets available</span>
      </div>
    );
  }

  return (
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
  );
}

