import React, { useState, useEffect } from 'react';
import { Search, Loader2, FileText, Code2, BookOpen, Globe, ExternalLink, GitBranch, Video, MessageSquare, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

import MatrixBackground from './MatrixBackground';
import LogoAnimation    from './LogoAnimation';
import logo from './assets/Logo.png';

function cn(...inputs) { return twMerge(clsx(inputs)); }

function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) return 'http://localhost:8000';
  const h = window.location.hostname;
  const apiHost = h.startsWith('api.') ? h : 'api.' + h.replace(/^www\./, '');
  return window.location.protocol + '//' + apiHost;
}

const TABS = [
  { id: 'all',           label: 'All',           icon: Globe },
  { id: 'wikipedia',     label: 'Wikipedia',     icon: BookOpen },
  { id: 'stackoverflow', label: 'StackOverflow', icon: Code2 },
  { id: 'github',        label: 'GitHub',        icon: GitBranch },
  { id: 'reddit',        label: 'Reddit',        icon: MessageSquare },
  { id: 'youtube',       label: 'YouTube',       icon: Video },
];

function getSearchMode(tab) {
  if (['wikipedia','reddit','youtube'].includes(tab)) return 'prose';
  if (['stackoverflow','github'].includes(tab)) return 'code';
  return 'all';
}

function isExternalResult(item) {
  const src = (item.source || '').toLowerCase();
  return !src.includes('local storage');
}

// FIX 4: filter out local storage results entirely
function filterByTab(results, tab) {
  const external = results.filter(isExternalResult);
  if (tab === 'all') return external;
  return external.filter(item => {
    const s = (item.source || '').toLowerCase();
    if (tab === 'stackoverflow') return s.includes('stackoverflow');
    return s.includes(tab);
  });
}

function cleanSource(source) {
  if (!source) return '';
  const s = source.replace(/\s*\(.*?\)/g, '').replace(/\s*API\s*/gi, '').trim();
  return s;
}

function SuggestionsDropdown({ suggestions, focusedIdx, onSelect, onHover }) {
  if (!suggestions.length) return null;
  return (
    <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-[#40628A]/15 rounded-2xl shadow-2xl overflow-hidden z-50">
      <ul>
        {suggestions.map((s, i) => (
          <li key={s}
            onMouseDown={(e) => { e.preventDefault(); onSelect(s); }}
            onMouseEnter={() => onHover(i)}
            className={i === focusedIdx
              ? 'px-5 py-3 cursor-pointer flex items-center gap-3 text-sm bg-[#40628A]/10 text-[#40628A]'
              : 'px-5 py-3 cursor-pointer flex items-center gap-3 text-sm text-slate-700 hover:bg-[#40628A]/5'}
          >
            <Search size={13} className="text-slate-400 shrink-0" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchInput({ query, setQuery, onSubmit, isLoading, suggestions, focusedIdx, setFocusedIdx, showSuggestions, setShowSuggestions, autoFocus }) {
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(p => p < suggestions.length - 1 ? p + 1 : 0); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIdx(p => p > 0 ? p - 1 : suggestions.length - 1); }
    else if (e.key === 'Escape') { setShowSuggestions(false); e.target.blur(); }
    else if (e.key === 'Enter') {
      e.preventDefault(); setShowSuggestions(false);
      if (focusedIdx >= 0 && focusedIdx < suggestions.length) {
        const sel = suggestions[focusedIdx]; setQuery(sel); setFocusedIdx(-1); onSubmit(sel);
      } else { onSubmit(query); }
    }
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); setShowSuggestions(false); onSubmit(query); }} className="relative w-full group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#40628A] transition-colors z-10">
        <Search size={18} strokeWidth={2} />
      </div>
      <input
        id="search-input" type="text" autoFocus={autoFocus}
        placeholder="Search with Disee..." value={query}
        onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); setFocusedIdx(-1); }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        onKeyDown={handleKeyDown}
        className="w-full pl-10 pr-20 py-2.5 text-sm leading-relaxed rounded-xl outline-none transition-all duration-300 bg-white/60 text-slate-800 placeholder-slate-400 border border-slate-300/40 hover:border-slate-300/70 focus:border-[#40628A]/50 focus:ring-2 focus:ring-[#40628A]/15 shadow-sm"
      />
      <button type="submit" id="search-btn" disabled={isLoading || !query.trim()}
        style={{ opacity: query.trim() ? 1 : 0, pointerEvents: query.trim() ? 'auto' : 'none' }}
        className="absolute inset-y-1 right-1 px-3 bg-[#40628A]/15 hover:bg-[#40628A]/25 text-[#40628A] text-xs font-medium rounded-lg transition-all active:scale-95 flex items-center justify-center border border-[#40628A]/20 z-10"
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
      </button>
      {showSuggestions && (
        <SuggestionsDropdown suggestions={suggestions} focusedIdx={focusedIdx}
          onSelect={(s) => { setQuery(s); setShowSuggestions(false); setFocusedIdx(-1); onSubmit(s); }}
          onHover={setFocusedIdx}
        />
      )}
    </form>
  );
}

function useSuggestions(query) {
  const [suggestions, setSuggestions] = useState([]);
  useEffect(() => {
    const fetch_ = async () => {
      if (!query.trim()) { setSuggestions([]); return; }
      try {
        const r = await fetch(getApiUrl() + '/suggestions?q=' + encodeURIComponent(query.trim()));
        if (r.ok) setSuggestions((await r.json()).suggestions || []);
      } catch {}
    };
    const t = setTimeout(fetch_, 150);
    return () => clearTimeout(t);
  }, [query]);
  return suggestions;
}

// ─── HOME PAGE ─────────────────────────────────────────────────────────────────
function HomePage({ onSearch }) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const suggestions = useSuggestions(query);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start overflow-hidden font-sans relative">
      <MatrixBackground />
      {/* FIX 1: Shifting spacer on focus to move the search bar up so suggestions are not cut */}
      <motion.div
        className="w-full flex-shrink-0"
        animate={{ height: isFocused ? '12vh' : '26vh' }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      />
      <AnimatePresence>
        {isFocused && (
          <motion.div key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-white/20 backdrop-blur-[1px] z-[2] pointer-events-none" />
        )}
      </AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.32,0.72,0,1] }}
        className="w-full max-w-2xl px-4 sm:px-6 flex flex-col items-center z-10">
        {/* FIX 3: Tighter logo margin */}
        <div className="mb-6">
          <LogoAnimation videoSrc="/logo-animation.webm" logoSrc={logo} />
        </div>
        {/* FIX 3: Tighter padding on search wrapper */}
        <motion.div className="w-full glass-panel px-4 py-4"
          animate={{ scale: isFocused ? 1.01 : 1, y: isFocused ? -4 : 0 }} transition={{ duration: 0.3 }}
          onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
          <SearchInput query={query} setQuery={setQuery} onSubmit={onSearch} isLoading={false}
            suggestions={suggestions} focusedIdx={focusedIdx} setFocusedIdx={setFocusedIdx}
            showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} autoFocus={true} />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── RESULTS PAGE ──────────────────────────────────────────────────────────────
function ResultsPage({ initialQuery, onGoHome }) {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const suggestions = useSuggestions(query);

  const fetchResults = async (q, tab) => {
    if (!q.trim()) return;
    setIsLoading(true);
    try {
      const r = await fetch(getApiUrl() + '/search?q=' + encodeURIComponent(q.trim()) + '&mode=' + getSearchMode(tab));
      if (!r.ok) throw new Error();
      setResults((await r.json()).results || []);
    } catch { setResults([]); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchResults(initialQuery, 'all'); }, []);
  useEffect(() => { fetchResults(query, activeTab); }, [activeTab]);

  const handleSearch = (newQuery) => {
    const trimmed = newQuery.trim(); if (!trimmed) return;
    setQuery(trimmed);
    window.history.pushState({}, '', '/search?q=' + encodeURIComponent(trimmed));
    fetchResults(trimmed, activeTab);
  };

  const filtered = filterByTab(results, activeTab);

  return (
    <div className="min-h-screen flex flex-col font-sans relative" style={{ background: '#f6f3ec' }}>
      <MatrixBackground />

      {/* FIX 2: Transparent navbar background */}
      <div className="sticky top-0 z-30 w-full" style={{ background: 'transparent' }}>
        {/* Top row: back arrow left, centered logo + search input */}
        <div className="relative w-full px-4 sm:px-6 py-2 flex items-center justify-center">
          {/* FIX 2: Back arrow button left positioned */}
          <div className="absolute left-4 sm:left-6">
            <button
              onClick={onGoHome}
              title="Go back home"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#40628A]/10 text-slate-500 hover:text-[#40628A] transition-all active:scale-90"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </button>
          </div>

          {/* FIX 2: Centered container with logo + search box */}
          <div className="flex items-center gap-3 w-full max-w-2xl px-10 sm:px-12">
            {/* Logo - FIX 4: Increased size to h-9 */}
            <button onClick={onGoHome} className="shrink-0 cursor-pointer" title="Home">
              <img src={logo} alt="Disee" className="h-9 w-auto" />
            </button>

            {/* Search bar */}
            <div className="flex-1 relative">
              <SearchInput query={query} setQuery={setQuery} onSubmit={handleSearch} isLoading={isLoading}
                suggestions={suggestions} focusedIdx={focusedIdx} setFocusedIdx={setFocusedIdx}
                showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} autoFocus={false} />
            </div>
          </div>
        </div>

        {/* Filter tabs row - FIX 2: Centered layout */}
        <div className="w-full pb-2 flex gap-2 overflow-x-auto no-scrollbar justify-center">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} id={'filter-' + id} type="button" onClick={() => setActiveTab(id)}
              className={activeTab === id
                ? 'shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border bg-[#40628A]/15 text-[#40628A] border-[#40628A]/30 transition-all'
                : 'shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border bg-white/50 text-slate-500 hover:bg-white/80 border-slate-300/40 hover:border-slate-300/60 transition-all'
              }>
              <Icon size={12} strokeWidth={2} className="shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results body - FIX 3: Tighter top padding */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-2 pb-20 flex flex-col gap-3 z-10">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin mb-4 text-[#40628A]" />
            <p className="text-sm text-slate-500">Searching across all sources...</p>
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="glass-panel flex flex-col items-center justify-center py-14 text-center px-6 mt-4">
            <p className="text-lg font-medium mb-1 text-slate-700">
              No results for &ldquo;<span className="text-[#40628A]">{query}</span>&rdquo;
              {activeTab !== 'all' && ' in ' + activeTab}
            </p>
            <p className="text-sm text-slate-400">Try a different filter or check your spelling.</p>
          </div>
        )}
        {!isLoading && filtered.map((result, idx) => (
          <motion.div key={result.title + idx}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.03 * idx }}
            className="result-card group cursor-pointer p-5"
            onClick={() => { if (result.url) window.open(result.url, '_blank'); }}>
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-[#40628A]/5 border border-[#40628A]/10 group-hover:bg-[#40628A]/10 transition-colors text-slate-400 group-hover:text-[#40628A] shrink-0">
                <FileText size={18} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                {result.url && (
                  <p className="text-[11px] text-slate-400 mb-0.5 truncate">
                    {(() => { try { const u = new URL(result.url); return u.hostname + u.pathname; } catch { return result.url; } })()}
                  </p>
                )}
                <h3 className="text-base font-medium text-slate-800 group-hover:text-[#40628A] transition-colors mt-0.5 mb-1 flex items-center gap-2">
                  <span className="truncate">{result.title}</span>
                  <ExternalLink size={13} className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: result.summary }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── ROOT ROUTER ───────────────────────────────────────────────────────────────
export default function App() {
  const getPage = () => {
    const onSearch = window.location.pathname.startsWith('/search');
    const q = new URLSearchParams(window.location.search).get('q') || '';
    return (onSearch && q) ? { view: 'results', query: q } : { view: 'home', query: '' };
  };

  const [page, setPage] = useState(getPage);

  useEffect(() => {
    const onPop = () => setPage(getPage());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleSearch = (query) => {
    const trimmed = query.trim(); if (!trimmed) return;
    window.history.pushState({}, '', '/search?q=' + encodeURIComponent(trimmed));
    setPage({ view: 'results', query: trimmed });
  };

  const handleGoHome = () => {
    window.history.pushState({}, '', '/');
    setPage({ view: 'home', query: '' });
  };

  return (
    <AnimatePresence mode="wait">
      {page.view === 'home' ? (
        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <HomePage onSearch={handleSearch} />
        </motion.div>
      ) : (
        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <ResultsPage key={page.query} initialQuery={page.query} onGoHome={handleGoHome} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
