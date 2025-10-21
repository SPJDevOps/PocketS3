import { useState, useEffect } from 'react';

export default function SearchBar({ onSearch, isSearching }) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // Debounce search input
    const timeoutId = setTimeout(() => {
      onSearch(inputValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, onSearch]);

  const handleClear = () => {
    setInputValue('');
    onSearch('');
  };

  return (
    <div className="form-control w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="w-5 h-5 stroke-current text-base-content/50"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search files and folders across entire bucket..."
          className="input input-bordered w-full pl-10 pr-10"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            title="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="w-5 h-5 stroke-current text-base-content/50 hover:text-base-content"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        {isSearching && (
          <div className="absolute inset-y-0 right-10 pr-3 flex items-center pointer-events-none">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        )}
      </div>
    </div>
  );
}

