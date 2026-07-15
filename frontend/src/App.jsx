import React, { useState, useEffect } from 'react';
import { Search, Loader2, FileText, Code2, BookOpen, Globe, ExternalLink, GitBranch, Video, MessageSquare } from 'lucide-react';
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
  const [activeTab,  setActiveTab]  = useState('all');
  const [results,    setResults]    = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [isFocused,  setIsFocused]  = useState(false);

  const getSearchMode = (tab) => {
    if (tab === 'wikipedia' || tab === 'reddit' || tab === 'youtube') return 'prose';
    if (tab === 'stackoverflow' || tab === 'github') return 'code';
    return 'all';
  };

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
        const isLocal   = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const hostname  = window.location.hostname;
        const apiHost   = hostname.startsWith('api.') ? hostname : `api.${hostname.replace(/^www\./, '')}`;
        const API_URL   = import.meta.env.VITE_API_URL || (isLocal
          ? 'http://localhost:8000'
          : `${window.location.protocol}//${apiHost}`);

        const currentMode = getSearchMode(activeTab);
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(trimmedQuery)}&mode=${currentMode}`);
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
  }, [query, activeTab]);

  const handleSearch = (e) => { e.preventDefault(); };

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

      {/* ── Dynamic spacer — pushes content to center when idle ── */}
      <motion.div
        layout
        className="w-full flex-shrink-0"
        initial={{ height: '35vh' }}
        animate={{ height: hasSearched ? '5vh' : '36vh' }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      />

      {/* ── Main content wrapper ── */}
      <motion.div
        layout
        className="w-full max-w-2xl px-4 sm:px-6 flex flex-col items-center z-10"
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >

        {/* ── Logo / animation ── */}
        <motion.div layout className="flex items-center mb-10 text-center relative z-20">
          <LogoAnimation
            videoSrc="/logo-animation.webm"
            logoSrc={logo}
          />
        </motion.div>

        {/* ── Glass panel wrapping search + filter chips ── */}
        <motion.div
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
                'w-full pl-11 pr-20 xs:pr-24 py-3 text-[0.95rem] xs:text-[1.02rem] leading-relaxed rounded-2xl outline-none transition-all duration-300',
                'bg-white/40 text-slate-800 placeholder-slate-400',
                'border border-slate-300/30 hover:border-slate-300/60',
                'focus:border-[#40628A]/50 focus:ring-2 focus:ring-[#40628A]/15',
                'shadow-[0_2px_8px_rgba(0,0,0,0.03)]',
              )}
            />

            <button
              type="submit"
              id="search-btn"
              className="absolute inset-y-1.5 right-1.5 px-3 xs:px-5 bg-[#40628A]/15 hover:bg-[#40628A]/25 text-[#40628A] text-xs xs:text-sm font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center border border-[#40628A]/20 z-30"
              style={{ opacity: query.trim() ? 1 : 0, pointerEvents: query.trim() ? 'auto' : 'none' }}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Filter chips */}
          <div className="flex gap-2 mt-4 flex-row overflow-x-auto justify-start items-center w-full no-scrollbar pb-1">
            {[
              { id: 'all',           label: 'All',           icon: Globe },
              { id: 'wikipedia',     label: 'Wikipedia',     icon: BookOpen },
              { id: 'stackoverflow', label: 'StackOverflow', icon: Code2 },
              { id: 'github',        label: 'GitHub',        icon: GitBranch },
              { id: 'reddit',        label: 'Reddit',        icon: MessageSquare },
              { id: 'youtube',       label: 'YouTube',       icon: Video },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`filter-${id}`}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  'shrink-0 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 border',
                  activeTab === id
                    ? 'bg-[#40628A]/20 text-[#40628A] border-[#40628A]/35 shadow-[0_0_12px_rgba(64,98,138,0.08)]'
                    : 'bg-white/40 text-slate-500 hover:bg-white/60 border-slate-300/30 hover:border-slate-300/50',
                )}
              >
                <Icon size={12} strokeWidth={2} className="shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>
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
            {!isLoading && results.filter(item => {
              if (activeTab === 'all') return true;
              const source = (item.source || '').toLowerCase();
              if (activeTab === 'wikipedia') return source.includes('wikipedia');
              if (activeTab === 'stackoverflow') return source.includes('stackoverflow');
              if (activeTab === 'github') return source.includes('github');
              if (activeTab === 'reddit') return source.includes('reddit');
              if (activeTab === 'youtube') return source.includes('youtube');
              return true;
            }).length === 0 && (
              <div className="glass-panel flex flex-col items-center justify-center py-14 text-center px-6">
                <p className="text-lg font-medium mb-1 text-slate-700">
                  No results found in {activeTab === 'all' ? 'any source' : activeTab} for "{query}"
                </p>
                <p className="text-sm text-slate-400">Check your spelling or try different filter tabs.</p>
              </div>
            )}

            {/* Result cards */}
            {!isLoading && results.filter(item => {
              if (activeTab === 'all') return true;
              const source = (item.source || '').toLowerCase();
              if (activeTab === 'wikipedia') return source.includes('wikipedia');
              if (activeTab === 'stackoverflow') return source.includes('stackoverflow');
              if (activeTab === 'github') return source.includes('github');
              if (activeTab === 'reddit') return source.includes('reddit');
              if (activeTab === 'youtube') return source.includes('youtube');
              return true;
            }).map((result, idx) => (
              <motion.div
                key={result.title + idx}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.04 * idx }}
                className="result-card group cursor-pointer p-5 transition-all"
                onClick={() => { if (result.url) window.open(result.url, '_blank'); }}
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
