import React, { useState, useEffect } from 'react';
import { Search, Loader2, FileText, Code2, BookOpen, Globe, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

import MatrixBackground from './MatrixBackground';
import LogoAnimation    from './LogoAnimation';
import logo from './assets/Logo.png';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [query,      setQuery]      = useState('');
  const [searchMode, setSearchMode] = useState('all');
  const [results,    setResults]    = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [isFocused,  setIsFocused]  = useState(false);

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
<<<<<<< HEAD
        const isLocal   = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const hostname  = window.location.hostname;
        const apiHost   = hostname.startsWith('api.') ? hostname : `api.${hostname.replace(/^www\./, '')}`;
        const API_URL   = import.meta.env.VITE_API_URL || (isLocal
          ? 'http://localhost:8000'
          : `${window.location.protocol}//${apiHost}`);

        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(trimmedQuery)}&mode=${searchMode}`);
=======
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const hostname = window.location.hostname;
        const apiHost = hostname.startsWith('api.') ? hostname : `api.${hostname.replace(/^www\./, '')}`;
        const API_URL = import.meta.env.VITE_API_URL || (isLocal 
          ? 'http://localhost:8000' 
          : `${window.location.protocol}//${apiHost}`);

        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(trimmedQuery)}`);
>>>>>>> upstream/main
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
  }, [query, searchMode]);

<<<<<<< HEAD
  const handleSearch = (e) => { e.preventDefault(); };
=======
  const handleSearch = (e) => {
    e.preventDefault();
  };
>>>>>>> upstream/main

  return (
    <div className="min-h-screen flex flex-col items-center justify-start overflow-hidden font-sans relative">

      {/* ── Animated matrix canvas background ── */}
      <MatrixBackground />

      {/* ── Subtle focus overlay ── */}
      <AnimatePresence>
        {isFocused && !hasSearched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-white/20 backdrop-blur-[1px] z-[2] pointer-events-none"
          />
        )}
      </AnimatePresence>

<<<<<<< HEAD
      {/* ── Dynamic spacer — pushes content to center when idle ── */}
=======
      {/* Dynamic Spacer - pushing content to center initially */}
>>>>>>> upstream/main
      <motion.div
        layout
        className="w-full flex-shrink-0"
        initial={{ height: '35vh' }}
        animate={{ height: hasSearched ? '5vh' : '36vh' }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      />

<<<<<<< HEAD
      {/* ── Main content wrapper ── */}
=======
>>>>>>> upstream/main
      <motion.div
        layout
        className="w-full max-w-2xl px-4 sm:px-6 flex flex-col items-center z-10"
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >
<<<<<<< HEAD

        {/* ── Logo / animation ── */}
        <motion.div layout className="flex items-center mb-10 text-center relative z-20">
          <LogoAnimation
            videoSrc="/logo-animation.webm"
            logoSrc={logo}
          />
        </motion.div>

        {/* ── Glass panel wrapping search + filter chips ── */}
        <motion.div
=======
        <motion.div layout className="mb-12 text-center relative z-20 flex justify-center">
          <img
            src="/disee.png"
            alt="Disee Logo"
            className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] h-auto object-contain select-none"
            draggable="false"
          />
        </motion.div>

        <motion.form
>>>>>>> upstream/main
          layout
          className="w-full glass-panel px-5 py-5 z-20"
          animate={{ scale: isFocused ? 1.01 : 1, y: isFocused ? -4 : 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Search form */}
          <form onSubmit={handleSearch} className="w-full relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#40628A] transition-colors duration-300 z-30">
              <Search size={20} strokeWidth={2} />
            </div>

            <input
              id="search-input"
              type="text"
              placeholder="Search with Disee…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                'w-full pl-12 pr-24 py-3.5 text-[1.02rem] leading-relaxed rounded-2xl outline-none transition-all duration-300',
                'bg-white/40 text-slate-800 placeholder-slate-400',
                'border border-slate-300/30 hover:border-slate-300/60',
                'focus:border-[#40628A]/50 focus:ring-2 focus:ring-[#40628A]/15',
                'shadow-[0_2px_8px_rgba(0,0,0,0.03)]',
              )}
            />

            <button
              type="submit"
              id="search-btn"
              className="absolute inset-y-2 right-2 px-5 bg-[#40628A]/15 hover:bg-[#40628A]/25 text-[#40628A] font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-[#40628A]/20 z-30"
              style={{ opacity: query.trim() ? 1 : 0, pointerEvents: query.trim() ? 'auto' : 'none' }}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Filter chips */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {[
              { id: 'all',   label: 'All',          icon: Globe },
              { id: 'prose', label: 'Wikipedia',    icon: BookOpen },
              { id: 'code',  label: 'StackOverflow', icon: Code2 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`filter-${id}`}
                type="button"
                onClick={() => setSearchMode(id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-xl transition-all duration-300 border',
                  searchMode === id
                    ? 'bg-[#40628A]/20 text-[#40628A] border-[#40628A]/35 shadow-[0_0_12px_rgba(64,98,138,0.08)]'
                    : 'bg-white/40 text-slate-500 hover:bg-white/60 border-slate-300/30 hover:border-slate-300/50',
                )}
              >
                <Icon size={13} strokeWidth={2} />
                <span>{label}</span>
              </button>
            ))}
          </div>
<<<<<<< HEAD
        </motion.div>
=======

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
>>>>>>> upstream/main
      </motion.div>

      {/* ── Results Section ── */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="w-full max-w-2xl px-4 sm:px-6 mt-8 flex flex-col gap-3 pb-20 mx-auto z-10"
          >
            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 size={30} className="animate-spin mb-4 text-[#40628A]" />
                <p className="text-sm text-slate-500">Searching…</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && results.length === 0 && (
              <div className="glass-panel flex flex-col items-center justify-center py-14 text-center px-6">
                <p className="text-lg font-medium mb-1 text-slate-700">No results found for "{query}"</p>
                <p className="text-sm text-slate-400">Check your spelling or try different keywords.</p>
              </div>
            )}

            {/* Result cards */}
            {!isLoading && results.map((result, idx) => (
              <motion.div
                key={result.title + idx}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
<<<<<<< HEAD
                transition={{ duration: 0.35, delay: 0.04 * idx }}
                className="result-card group cursor-pointer p-5 transition-all"
                onClick={() => { if (result.url) window.open(result.url, '_blank'); }}
=======
                transition={{ duration: 0.4, delay: 0.05 * idx }}
                className="group cursor-pointer py-4 border-b border-transparent hover:bg-slate-50 rounded-2xl p-5 -mx-5 transition-colors"
                onClick={() => { if (result.url) window.open(result.url, '_blank') }}
>>>>>>> upstream/main
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-[#40628A]/5 border border-[#40628A]/10 group-hover:bg-[#40628A]/10 group-hover:border-[#40628A]/20 transition-colors text-slate-500 group-hover:text-[#40628A] shrink-0">
                    <FileText size={18} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 group-hover:text-[#40628A]/70 transition-colors">
                        {result.source || 'Remote API'}
                      </span>
                    </div>
                    <h3 className="text-[1.05rem] font-medium text-slate-800 group-hover:text-[#40628A] transition-colors mb-1 truncate flex items-center gap-2">
                      {result.title}
                      <ExternalLink size={13} className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                    </h3>
                    <p
                      className="text-slate-600 text-sm leading-relaxed line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: result.summary }}
                    />
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
