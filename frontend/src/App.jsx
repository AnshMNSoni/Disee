import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, FileText, Code2, BookOpen, Globe, ExternalLink, GitBranch, Video, MessageSquare, ArrowLeft, SearchX, AlertCircle, X } from 'lucide-react';
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
  // Production: backend is deployed at disee.onrender.com
  return 'https://disee.onrender.com';
}

const TABS = [
  { id: 'all',           label: 'All',           icon: Globe,          color: '#40628A' },
  { id: 'wikipedia',     label: 'Wikipedia',     icon: BookOpen,       color: '#1a6b3c' },
  { id: 'stackoverflow', label: 'StackOverflow', icon: Code2,          color: '#e67e22' },
  { id: 'github',        label: 'GitHub',        icon: GitBranch,      color: '#6e40c9' },
  { id: 'reddit',        label: 'Reddit',        icon: MessageSquare,  color: '#ff4500' },
  { id: 'youtube',       label: 'YouTube',       icon: Video,          color: '#c4302b' },
];

// ─── SOURCE METADATA MAP ───────────────────────────────────────────────────────
const SOURCE_META = {
  wikipedia:     { label: 'Wikipedia',     color: '#1a6b3c', bg: 'rgba(26,107,60,0.08)',  border: 'rgba(26,107,60,0.18)',  icon: BookOpen },
  stackoverflow: { label: 'StackOverflow', color: '#e67e22', bg: 'rgba(230,126,34,0.08)', border: 'rgba(230,126,34,0.18)', icon: Code2 },
  github:        { label: 'GitHub',        color: '#6e40c9', bg: 'rgba(110,64,201,0.08)', border: 'rgba(110,64,201,0.18)', icon: GitBranch },
  reddit:        { label: 'Reddit',        color: '#ff4500', bg: 'rgba(255,69,0,0.08)',   border: 'rgba(255,69,0,0.18)',   icon: MessageSquare },
  youtube:       { label: 'YouTube',       color: '#c4302b', bg: 'rgba(196,48,43,0.08)',  border: 'rgba(196,48,43,0.18)',  icon: Video },
  default:       { label: 'Web',           color: '#40628A', bg: 'rgba(64,98,138,0.08)',  border: 'rgba(64,98,138,0.18)',  icon: Globe },
};

function getSourceMeta(source) {
  if (!source) return SOURCE_META.default;
  const s = source.toLowerCase();
  if (s.includes('wikipedia'))     return SOURCE_META.wikipedia;
  if (s.includes('stackoverflow')) return SOURCE_META.stackoverflow;
  if (s.includes('github'))        return SOURCE_META.github;
  if (s.includes('reddit'))        return SOURCE_META.reddit;
  if (s.includes('youtube'))       return SOURCE_META.youtube;
  return SOURCE_META.default;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function highlightQuery(text, query) {
  const safe = escapeHtml(text || '');
  if (!query || !query.trim()) return safe;
  try {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  } catch {
    return safe;
  }
}

function getSearchMode(tab) {
  if (['wikipedia','reddit','youtube'].includes(tab)) return 'prose';
  if (['stackoverflow','github'].includes(tab)) return 'code';
  return 'all';
}

function getLoadingText(tab) {
  if (tab === 'all') return 'Searching Wikipedia, StackOverflow, GitHub, Reddit, YouTube…';
  const meta = SOURCE_META[tab];
  return meta ? `Searching ${meta.label}…` : 'Searching…';
}

function isExternalResult(item) {
  const src = (item.source || '').toLowerCase();
  return !src.includes('local storage');
}

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
    <motion.div 
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="absolute left-0 right-0 top-full mt-3 bg-white/95 backdrop-blur-xl border border-[#40628A]/15 rounded-2xl shadow-xl overflow-hidden z-50">
      <ul className="py-1">
        {suggestions.map((s, i) => (
          <li key={s}
            onMouseDown={(e) => { e.preventDefault(); onSelect(s); }}
            onMouseEnter={() => onHover(i)}
            className={i === focusedIdx
              ? 'px-5 py-2.5 cursor-pointer flex items-center gap-3 text-sm bg-[#40628A]/10 text-[#40628A]'
              : 'px-5 py-2.5 cursor-pointer flex items-center gap-3 text-sm text-slate-700 hover:bg-[#40628A]/5'}
          >
            <Search size={13} className="text-slate-400 shrink-0" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </motion.div>
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
        className="w-full pl-10 pr-16 sm:pr-28 py-2.5 text-sm leading-relaxed rounded-xl outline-none transition-all duration-300 bg-white/60 text-slate-800 placeholder-slate-400 border border-slate-300/40 hover:border-slate-300/70 focus:border-[#40628A]/50 focus:ring-2 focus:ring-[#40628A]/15 shadow-sm"
      />
      <div className="absolute inset-y-1 right-1 flex items-center gap-1.5 z-10">
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="p-1 rounded-full hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-all active:scale-90"
            title="Clear search"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        )}
        <button type="submit" id="search-btn" disabled={isLoading || !query.trim()}
          style={{ opacity: query.trim() ? 1 : 0, pointerEvents: query.trim() ? 'auto' : 'none' }}
          className="px-2.5 sm:px-3 h-full bg-[#40628A]/15 hover:bg-[#40628A]/25 text-[#40628A] text-xs font-medium rounded-lg transition-all active:scale-95 flex items-center justify-center border border-[#40628A]/20"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline">Search</span>
              <Search size={14} className="inline sm:hidden" />
            </>
          )}
        </button>
      </div>
      <AnimatePresence>
        {showSuggestions && (
          <SuggestionsDropdown suggestions={suggestions} focusedIdx={focusedIdx}
            onSelect={(s) => { setQuery(s); setShowSuggestions(false); setFocusedIdx(-1); onSubmit(s); }}
            onHover={setFocusedIdx}
          />
        )}
      </AnimatePresence>
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
  const [fetchDuration, setFetchDuration] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const suggestions = useSuggestions(query);

  const fetchResults = async (q, tab) => {
    if (!q.trim()) return;
    setIsLoading(true);
    setFetchDuration(null);
    const t0 = performance.now();
    try {
      const r = await fetch(getApiUrl() + '/search?q=' + encodeURIComponent(q.trim()) + '&mode=' + getSearchMode(tab));
      if (!r.ok) throw new Error();
      setResults((await r.json()).results || []);
    } catch { setResults([]); } finally {
      setFetchDuration(((performance.now() - t0) / 1000).toFixed(2));
      setIsLoading(false);
    }
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

      {/* Sticky header — Google-style row-based header */}
      <div className="sticky top-0 z-30 w-full">
        {/* Content-width wrapper — uses a separate absolute blur-strip for background */}
        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 pt-3 pb-4 sm:pb-6 flex flex-col items-center gap-3">
            {/* The fading blur background */}
            <div className="blur-strip"></div>

            {/* Row 1: Back Button + Centered Logo + Spacer */}
            <div className="flex items-center justify-between w-full relative z-30 px-2 sm:px-4">
              {/* Back button */}
              <button onClick={onGoHome} title="Go back home"
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#40628A]/10 text-slate-500 hover:text-[#40628A] transition-all active:scale-90">
                <ArrowLeft size={18} strokeWidth={2} />
              </button>

              {/* Centered Logo */}
              <button onClick={onGoHome} className="cursor-pointer mx-auto absolute left-1/2 -translate-x-1/2 flex items-center justify-center" title="Home">
                <img src={logo} alt="Disee" className="h-11 sm:h-14 w-auto" />
              </button>

              {/* Empty spacer to balance layout and keep logo centered */}
              <div className="w-8 h-8 shrink-0 pointer-events-none" />
            </div>

            {/* Row 2: Search Bar */}
            <div className="w-full max-w-2xl px-2 sm:px-4 relative z-30">
              <SearchInput query={query} setQuery={setQuery} onSubmit={handleSearch} isLoading={isLoading}
                suggestions={suggestions} focusedIdx={focusedIdx} setFocusedIdx={setFocusedIdx}
                showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} autoFocus={false} />
            </div>

            {/* Row 3: Filter tabs */}
            <div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar justify-start sm:justify-center w-full px-4 sm:px-0 pt-0.5 relative z-10">
              {TABS.map(({ id, label, icon: Icon, color }) => {
                const isActive = activeTab === id;
                return (
                  <button key={id} id={'filter-' + id} type="button" onClick={() => setActiveTab(id)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all"
                    style={isActive
                      ? { background: `${color}15`, color: color, borderColor: `${color}40`, fontWeight: 600 }
                      : { background: 'rgba(255,255,255,0.5)', color: color, borderColor: 'rgba(203,213,225,0.4)' }
                    }>
                    <Icon size={12} strokeWidth={2} className="shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Results body */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-2 pb-20 flex flex-col gap-3 z-10">

        {/* ── Result count + timing bar ── */}
        {!isLoading && filtered.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-slate-400 px-1 py-1">
            About <span className="font-semibold text-slate-500">{filtered.length}</span> result{filtered.length !== 1 ? 's' : ''}
            {fetchDuration && <span> ({fetchDuration}s)</span>}
          </motion.p>
        )}

        {/* ── Loading state ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin mb-4 text-[#40628A]" />
            <p className="text-sm text-slate-500 mb-3">{getLoadingText(activeTab)}</p>
            <div className="loading-dots flex gap-1.5">
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel flex flex-col items-center justify-center py-16 text-center px-8 mt-4">
            <div className="w-14 h-14 rounded-2xl bg-[#40628A]/8 border border-[#40628A]/12 flex items-center justify-center mb-5">
              <SearchX size={26} strokeWidth={1.5} className="text-[#40628A]/60" />
            </div>
            <p className="text-lg font-semibold mb-1 text-slate-700">
              No results for &ldquo;<span className="text-[#40628A]">{query}</span>&rdquo;
              {activeTab !== 'all' && <span className="text-slate-400 font-normal"> in {activeTab}</span>}
            </p>
            <p className="text-sm text-slate-400 mb-5 max-w-sm">We searched across all sources but couldn't find a match. Here are some things to try:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-xs bg-white/70 border border-slate-200/60 rounded-lg px-3 py-1.5 text-slate-500">✏️ Check your spelling</span>
              <span className="text-xs bg-white/70 border border-slate-200/60 rounded-lg px-3 py-1.5 text-slate-500">🔍 Try a broader search term</span>
              {activeTab !== 'all' && (
                <button onClick={() => setActiveTab('all')}
                  className="text-xs bg-[#40628A]/10 border border-[#40628A]/20 rounded-lg px-3 py-1.5 text-[#40628A] font-medium hover:bg-[#40628A]/15 transition-colors cursor-pointer">
                  🌐 Switch to All sources
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Result cards ── */}
        {!isLoading && filtered.map((result, idx) => {
          const meta = getSourceMeta(result.source);
          const SourceIcon = meta.icon;
          const highlightedSummary = highlightQuery(result.summary || '', query);
          return (
            <motion.div key={result.title + idx}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(0.03 * idx, 0.3) }}
              className="result-card group cursor-pointer p-4 sm:p-5"
              onClick={() => { if (result.url) window.open(result.url, '_blank'); }}>
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Per-source icon */}
                <div className="p-2 sm:p-2.5 rounded-xl shrink-0 transition-colors"
                  style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}>
                  <SourceIcon size={18} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Source badge + URL */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="source-badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                      {meta.label}
                    </span>
                    {result.url && (
                      <span className="text-[11px] text-slate-400 truncate">
                        {(() => { try { const u = new URL(result.url); return u.hostname; } catch { return ''; } })()}
                      </span>
                    )}
                  </div>
                  {/* Title */}
                  <h3 className="text-base font-medium text-slate-800 group-hover:text-[#40628A] transition-colors mt-0.5 mb-1 flex items-center gap-2">
                    <span className="truncate">{result.title}</span>
                    <ExternalLink size={13} className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                  </h3>
                  {/* Highlighted snippet */}
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2" dangerouslySetInnerHTML={{ __html: highlightedSummary }} />
                </div>
              </div>
            </motion.div>
          );
        })}
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
