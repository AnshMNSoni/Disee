import React, { useState, useEffect } from 'react';
import { Search, Loader2, Database, LayoutTemplate, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        setResults([]);
        setHasSearched(false);
        setIsLoading(false);
        return;
      }

      setHasSearched(true);
      setIsLoading(true);

      try {
        const response = await fetch(`http://localhost:8000/search?q=${encodeURIComponent(trimmedQuery)}`);
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault(); // Form submission is now optional, handled via live-search
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-start overflow-hidden font-sans">
      
      {/* Dynamic Spacer - pushing content to center initially */}
      <motion.div 
        layout
        className="w-full flex-shrink-0"
        initial={{ height: "35vh" }}
        animate={{ height: hasSearched ? "8vh" : "35vh" }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      />

      <motion.div 
        layout 
        className="w-full max-w-2xl px-6 flex flex-col items-center z-10"
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      >
        <motion.div layout className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl shadow-sm">
            <Database size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-semibold text-textMain tracking-tight">
            Distri<span className="text-blue-500 font-bold">Search</span>
          </h1>
        </motion.div>

        <motion.form 
          layout
          onSubmit={handleSearch}
          className="w-full relative group"
        >
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <Search size={22} strokeWidth={2} />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across distributed nodes..."
            className="w-full pl-12 pr-4 py-4 text-lg rounded-full border border-slate-200 outline-none transition-all duration-300 search-input-shadow hover:search-input-shadow-focus focus:search-input-shadow-focus focus:border-blue-300 bg-white"
          />
          
          <button 
            type="submit" 
            className="absolute inset-y-2 right-2 px-6 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full transition-all active:scale-95 flex items-center justify-center opacity-0 sm:opacity-100 disabled:bg-blue-300 pointer-events-none sm:pointer-events-auto shadow-sm"
            style={{ opacity: query.trim() ? 1 : 0 }}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : "Search"}
          </button>
        </motion.form>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="w-full max-w-2xl px-6 mt-12 flex flex-col gap-4 pb-20"
          >
            <div className="flex items-center border-b border-slate-200 pb-2 mb-2">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <LayoutTemplate size={16} /> Lookups
              </p>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 size={32} className="animate-spin mb-4 text-blue-400" />
                <p>Collecting data from nodes...</p>
              </div>
            )}

            {!isLoading && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
                <p className="mb-2 text-lg">No results found for "{query}"</p>
                <p className="text-sm">Try a different keyword or check node connections.</p>
              </div>
            )}

            {!isLoading && results.map((result, idx) => (
              <motion.div
                key={result + idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * idx }}
                className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 group cursor-pointer"
              >
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors text-slate-400">
                  <FileText size={24} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-textMain group-hover:text-blue-600 transition-colors mb-1">
                    {result}
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Found in distributed storage node cluster.
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
