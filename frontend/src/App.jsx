import React, { useState, useEffect } from 'react';
import { Search, Loader2, LayoutTemplate, FileText } from 'lucide-react';
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
  const [isFocused, setIsFocused] = useState(false);

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
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const hostname = window.location.hostname;
        const apiHost = hostname.startsWith('api.') ? hostname : `api.${hostname.replace(/^www\./, '')}`;
        const API_URL = import.meta.env.VITE_API_URL || (isLocal 
          ? 'http://localhost:8000' 
          : `${window.location.protocol}//${apiHost}`);

        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(trimmedQuery)}`);
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
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start overflow-hidden font-sans relative">
      <AnimatePresence>
        {isFocused && !hasSearched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Dynamic Spacer - pushing content to center initially */}
      <motion.div
        layout
        className="w-full flex-shrink-0"
        initial={{ height: "35vh" }}
        animate={{ height: hasSearched ? "6vh" : "38vh" }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      />

      <motion.div
        layout
        className="w-full max-w-2xl px-4 sm:px-6 flex flex-col items-center z-10"
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >
        <motion.div layout className="mb-12 text-center relative z-20">
          <h1 className="text-6xl md:text-7xl font-display font-medium tracking-tight pb-2 select-none">
            <span className="text-[#1a73e8] pr-1">D</span>
            <span className="text-[#1a73e8] pr-1">i</span>
            <span className="text-slate-900 pr-1">s</span>
            <span className="text-slate-800 pr-1">e</span>
            <span className="text-slate-700 pr-1">e</span>
          </h1>
        </motion.div>

        <motion.form
          layout
          onSubmit={handleSearch}
          className="w-full relative group z-20"
          animate={{ scale: isFocused ? 1.02 : 1, y: isFocused ? -8 : 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300 z-30">
            <Search size={22} strokeWidth={2} />
          </div>

          <input
            type="text"
            placeholder='Search with Disee'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full pl-16 pr-20 py-4 text-[1.05rem] leading-relaxed rounded-full border border-slate-200 outline-none transition-all duration-300 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)] focus:shadow-[0_4px_16px_-4px_rgba(26,115,232,0.15)] hover:border-slate-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 bg-white text-slate-800 relative z-20"
          />

          <button
            type="submit"
            className="absolute inset-y-2.5 right-3 px-6 bg-[#1a73e8] hover:bg-blue-700 text-white font-medium rounded-full transition-all active:scale-95 flex items-center justify-center opacity-0 sm:opacity-100 disabled:opacity-0 pointer-events-none sm:pointer-events-auto z-30"
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
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-2xl px-4 sm:px-6 mt-12 flex flex-col gap-4 pb-20 mx-auto"
          >
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
              </div>
            )}

            {!isLoading && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-center">
                <p className="text-lg font-medium mb-1">No results found for "{query}"</p>
                <p className="text-sm">Check your spelling or try different keywords.</p>
              </div>
            )}

            {!isLoading && results.map((result, idx) => (
              <motion.div
                key={result.title + idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * idx }}
                className="group cursor-pointer py-4 border-b border-transparent hover:bg-slate-50 rounded-2xl p-5 -mx-5 transition-colors"
                onClick={() => { if (result.url) window.open(result.url, '_blank') }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-100 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors text-slate-500 shrink-0">
                    <FileText size={20} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 group-hover:text-blue-400 transition-colors">
                        {result.source || "Remote API"}
                      </span>
                    </div>
                    <h3 className="text-xl font-medium text-slate-800 group-hover:text-blue-600 transition-colors mb-1 truncate">
                      {result.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2" dangerouslySetInnerHTML={{ __html: result.summary }}></p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
