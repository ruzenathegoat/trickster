import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { 
  SquaresFour, 
  Trophy, 
  Users, 
  Shield, 
  Sparkle, 
  Sword, 
  TrendUp, 
  UserCircle,
  MagnifyingGlass,
  List,
  CaretLeft,
  Bell,
  Globe,
  SignOut,
  X,
  ClockCounterClockwise,
  ArrowRight
} from '@phosphor-icons/react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';

type SearchHistoryItem = { query: string };

type PlayerSearchResult = {
  id: string;
  ign: string;
  name?: string | null;
  photo_url?: string | null;
  current_role?: string | null;
  team?: { name?: string | null } | null;
};

type TeamSearchResult = {
  id: string;
  name: string;
  logo_url?: string | null;
  region?: string | null;
};

type GlobalSearchResult =
  | ({ type: 'players' } & PlayerSearchResult)
  | ({ type: 'teams' } & TeamSearchResult);

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activePatch, setActivePatch] = useState<string>('...');

  // Search History State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Live Search Preview State
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);

  // Debounced Search Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const query = searchQuery.trim();
    setIsSearching(true);
    setSearchResults([]);

    const timer = setTimeout(async () => {
      try {
        const response = await axios.get('/api/v1/search', {
          params: { q: query, limit: 10 },
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const data = response.data.data ?? response.data;
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    axios.get('/api/v1/active-patch')
      .then(res => setActivePatch(res.data.version))
      .catch(() => setActivePatch('N/A'));
  }, []);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('trickster_search_history');
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (!Array.isArray(parsed)) return;

        // Old history entries included a player/team type. Search is now global,
        // so keep only unique query values during migration.
        const queries = parsed
          .map((item): string | null => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && 'query' in item && typeof item.query === 'string') {
              return item.query;
            }
            return null;
          })
          .filter((query): query is string => Boolean(query?.trim()));
        setSearchHistory([...new Set(queries)].slice(0, 5).map(query => ({ query })));
      } catch {
        setSearchHistory([]);
      }
    }
  }, []);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveSearchHistory = (query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    const updatedHistory = [
      { query: normalizedQuery },
      ...searchHistory.filter(item => item.query.toLowerCase() !== normalizedQuery.toLowerCase()),
    ].slice(0, 5);
    setSearchHistory(updatedHistory);
    localStorage.setItem('trickster_search_history', JSON.stringify(updatedHistory));
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !searchQuery.trim() || isSearching) return;

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const exactMatches = searchResults.filter(result => (
      result.type === 'players'
        ? result.ign.toLowerCase() === normalizedQuery || result.name?.toLowerCase() === normalizedQuery
        : result.name.toLowerCase() === normalizedQuery
    ));
    const destination = exactMatches.length === 1
      ? exactMatches[0]
      : searchResults.length === 1
        ? searchResults[0]
        : null;

    saveSearchHistory(searchQuery);
    if (destination) {
      setIsSearchFocused(false);
      navigate(`/app/${destination.type}/${destination.id}`);
    }
  };

  const removeHistoryItem = (itemToRemove: SearchHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = searchHistory.filter(item => item.query !== itemToRemove.query);
    setSearchHistory(updatedHistory);
    localStorage.setItem('trickster_search_history', JSON.stringify(updatedHistory));
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('trickster_search_history');
  };

  const handleHistoryClick = (item: SearchHistoryItem) => {
    setSearchQuery(item.query);
    setIsSearchFocused(true);
  };

  const handleResultClick = (type: 'players' | 'teams', result: PlayerSearchResult | TeamSearchResult) => {
    const fallbackQuery = type === 'players'
      ? (result as PlayerSearchResult).ign
      : (result as TeamSearchResult).name;
    saveSearchHistory(searchQuery || fallbackQuery);
    setIsSearchFocused(false);
    navigate(`/app/${type}/${result.id}`);
  };

  const handleViewAll = (type: 'players' | 'teams') => {
    saveSearchHistory(searchQuery);
    setIsSearchFocused(false);
    navigate(`/app/${type}?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: SquaresFour, path: '/app/dashboard' },
    { label: 'Leaderboard', icon: Trophy, path: '/app/leaderboard' },
    { label: 'Players', icon: Users, path: '/app/players' },
    { label: 'Teams', icon: Shield, path: '/app/teams' },
    { label: 'Recommend', icon: Sparkle, path: '/app/recommend' },
    { label: 'Simulation', icon: Sword, path: '/app/simulation' },
    { label: 'Meta', icon: TrendUp, path: '/app/meta' },
  ];

  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col font-['Inter']">
        <header className="w-full bg-[var(--color-primary)] border-b-4 border-theme-border p-4 flex justify-between h-[80px]">
          <div className="w-48 h-8 bg-black/10 animate-pulse border-2 border-theme-border mt-1"></div>
          <div className="w-32 h-8 bg-black/10 animate-pulse border-2 border-theme-border mt-1"></div>
        </header>
        <div className="flex flex-1">
          <aside className="w-[280px] border-r-4 border-theme-border bg-theme-bg p-4 space-y-4">
            <div className="w-full h-12 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
            <div className="w-full h-12 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
            <div className="w-full h-12 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
            <div className="w-full h-12 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
            <div className="w-full h-12 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
          </aside>
          <main className="flex-1 p-8 space-y-8 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.02)_10px,rgba(0,0,0,0.02)_20px)]">
            <div className="w-1/3 h-12 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
            <div className="w-full h-64 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
            <div className="flex gap-4">
              <div className="flex-1 h-48 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
              <div className="flex-1 h-48 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
            </div>
            <div className="flex justify-center mt-12">
               <span className="font-display font-black text-2xl uppercase tracking-widest animate-pulse text-theme-text">LOGGING OUT...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col md:flex-row text-theme-text">
      
      {/* Mobile Header (Visible only on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[var(--color-primary)] border-b-4 border-theme-border sticky top-0 z-40">
        <Link to="/app/dashboard" className="flex items-center gap-3 font-display text-xl uppercase tracking-tighter text-white">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Trickster" className="w-full h-full object-contain filter invert" />
          </div>
          TRICKSTER
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 border-2 border-theme-border bg-theme-bg active:scale-95 transition-transform"
        >
          <List weight="bold" size={24} />
        </button>
      </div>

      {/* Mobile Overlay Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={clsx(
          "bg-theme-bg border-r-4 border-theme-border transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col z-50 h-screen shrink-0 fixed md:sticky top-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-[80px]" : "w-[280px]"
        )}
      >
        {/* Logo Area */}
        <div className="h-[80px] flex items-center justify-between px-5 border-b-4 border-theme-border shrink-0 bg-[var(--color-primary)]">
          {!collapsed && (
            <Link to="/app/dashboard" className="flex items-center gap-3 font-display text-2xl uppercase tracking-tighter text-white truncate">
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="Trickster" className="w-full h-full object-contain filter invert" />
              </div>
              TRICKSTER
            </Link>
          )}
          
          <button 
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileMenuOpen(false);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            className={clsx(
              "p-2 border-2 border-theme-border bg-theme-bg hover:bg-black hover:text-white transition-colors active:scale-95",
              collapsed && "mx-auto hidden md:block" // Hide collapse button on mobile when collapsed is forced
            )}
          >
            {window.innerWidth < 768 ? <CaretLeft weight="bold" size={20} /> : (collapsed ? <List weight="bold" size={20} /> : <CaretLeft weight="bold" size={20} />)}
          </button>
        </div>

        {/* Navigation */}
        <nav data-lenis-prevent="true" className="flex-1 overflow-y-auto py-6 px-4 flex flex-col space-y-2 bg-[var(--color-theme-muted)]">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 768) setMobileMenuOpen(false);
                }}
                className={clsx(
                  "flex items-center border-2 transition-all duration-200 group font-label uppercase tracking-widest text-[13px] font-bold shrink-0",
                  collapsed ? "justify-center w-12 h-12 mx-auto p-0" : "gap-4 px-4 py-3",
                  isActive 
                    ? clsx(
                        "bg-black text-[var(--color-primary)] border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]",
                        !collapsed && "translate-x-1"
                      )
                    : clsx(
                        "border-transparent text-gray-500 hover:border-theme-border hover:bg-theme-bg hover:text-theme-text hover:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] hover:-translate-y-0.5",
                        !collapsed && "hover:translate-x-0.5"
                      )
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon weight={isActive ? "fill" : "bold"} size={20} className={clsx("shrink-0", isActive ? "text-[var(--color-primary)]" : "text-theme-text opacity-50 group-hover:opacity-100")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          <div className="mt-auto pt-8 shrink-0 flex flex-col space-y-2">
            <Link 
              to="/"
              onClick={() => {
                if (window.innerWidth < 768) setMobileMenuOpen(false);
              }}
              className={clsx(
                "flex items-center border-2 border-transparent transition-all duration-200 font-label text-[13px] font-bold uppercase tracking-widest group w-full",
                collapsed ? "justify-center w-12 h-12 mx-auto p-0" : "gap-4 px-4 py-3",
                "text-gray-500 hover:border-theme-border hover:bg-theme-bg hover:text-theme-text hover:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] hover:-translate-y-0.5"
              )}
              title={collapsed ? "Back to Website" : undefined}
            >
              <Globe weight="bold" size={20} className="shrink-0 opacity-50 group-hover:opacity-100 transition-colors" />
              {!collapsed && <span className="truncate">Back to Website</span>}
            </Link>

            <Link 
              to="/app/profile"
              className={clsx(
                "flex items-center border-2 border-theme-border bg-[var(--color-primary)] hover:bg-black hover:text-[var(--color-primary)] transition-colors group",
                collapsed ? "justify-center w-12 h-12 mx-auto p-0" : "gap-3 p-3"
              )}
              title={collapsed ? "Profile" : undefined}
            >
              <div className={clsx(
                "bg-black text-[var(--color-primary)] border-2 border-theme-border overflow-hidden flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-black transition-colors",
                collapsed ? "w-8 h-8 rounded-full" : "w-8 h-8 rounded-full"
              )}>
                {user?.profile_photo_url ? (
                  <img src={user.profile_photo_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle weight="fill" size={24} />
                )}
              </div>
              {!collapsed && (
                <div className="overflow-hidden flex-1 text-left">
                  <p className="font-label text-[12px] font-bold uppercase tracking-widest truncate text-black group-hover:text-[var(--color-primary)] transition-colors">{user?.name || 'User'}</p>
                  <p className="font-label text-[9px] font-bold uppercase tracking-widest opacity-60 truncate text-black group-hover:text-[var(--color-primary)] transition-colors">{user?.email || 'user@example.com'}</p>
                </div>
              )}
            </Link>

            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={clsx(
                "flex items-center border-2 border-transparent transition-all duration-200 font-label text-[13px] font-bold uppercase tracking-widest group w-full",
                collapsed ? "justify-center w-12 h-12 mx-auto p-0" : "gap-4 px-4 py-3",
                isLoggingOut 
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed border-theme-border animate-pulse" 
                  : "text-[#ff3333] hover:border-theme-border hover:bg-[#ff3333] hover:text-white hover:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] hover:-translate-y-0.5"
              )}
              title={collapsed ? "Logout" : undefined}
            >
              {isLoggingOut ? (
                <div className="w-5 h-5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin shrink-0" />
              ) : (
                <SignOut weight="bold" size={20} className="shrink-0 text-[#ff3333] opacity-70 group-hover:text-white group-hover:opacity-100 transition-colors" />
              )}
              {!collapsed && <span className="truncate">{isLoggingOut ? "LOGGING OUT..." : "Logout"}</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="hidden md:flex h-[80px] sticky top-0 bg-theme-bg border-b-4 border-theme-border items-center justify-between px-8 shrink-0 z-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]">
          <div className="flex-1 max-w-xl relative" ref={searchWrapperRef}>
            <div className="relative group z-20">
              <MagnifyingGlass weight="bold" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text transition-transform group-focus-within:scale-110" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleSearchSubmit}
                placeholder="SEARCH PLAYERS & TEAMS..."
                aria-label="Search players and teams"
                className="w-full bg-theme-bg border-4 border-theme-border pl-12 pr-4 py-3 text-[13px] font-label font-bold uppercase tracking-widest text-theme-text placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] transition-all focus:-translate-y-1"
              />
            </div>
            
            {/* Search History & Live Preview Dropdown */}
            {isSearchFocused && (searchQuery.trim() ? true : searchHistory.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-theme-bg border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] z-10 flex flex-col max-h-[400px] overflow-y-auto">
                {!searchQuery.trim() ? (
                  // HISTORY MODE
                  <>
                    <div className="px-4 py-2 bg-[var(--color-theme-muted)] border-b-4 border-theme-border font-['Archivo_Black'] text-xs text-gray-500 uppercase tracking-widest sticky top-0 z-10">
                      Recent Searches
                    </div>
                    {searchHistory.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleHistoryClick(item)}
                        className="flex justify-between items-center px-4 py-3 border-b-2 border-[var(--color-theme-divider)] hover:bg-[var(--color-primary)] cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <ClockCounterClockwise size={16} className="text-gray-400 group-hover:text-black" />
                          <span className="font-['JetBrains_Mono'] text-sm font-bold text-theme-text group-hover:text-black">{item.query}</span>
                        </div>
                        <button 
                          onClick={(e) => removeHistoryItem(item, e)}
                          className="p-1 hover:bg-black hover:text-white rounded transition-colors"
                        >
                          <X weight="bold" size={16} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={clearAllHistory}
                      className="px-4 py-3 bg-black text-white hover:bg-gray-800 font-['Archivo_Black'] text-xs uppercase tracking-widest text-center transition-colors mt-auto"
                    >
                      CLEAR ALL HISTORY
                    </button>
                  </>
                ) : (
                  // LIVE PREVIEW MODE
                  <>
                    <div className="px-4 py-2 bg-[var(--color-theme-muted)] border-b-4 border-theme-border font-['Archivo_Black'] text-xs text-gray-500 uppercase tracking-widest sticky top-0 z-10 flex justify-between items-center">
                      <span>Players &amp; Teams</span>
                      {isSearching && <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full animate-pulse border-2 border-theme-border"></div>}
                    </div>
                    
                    {isSearching ? (
                      <div className="px-4 py-8 text-center font-['JetBrains_Mono'] text-sm font-bold text-gray-400 animate-pulse">
                        [ SEARCHING... ]
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-4 py-8 text-center font-['JetBrains_Mono'] text-sm font-bold text-gray-400">
                        NO RESULTS FOUND
                      </div>
                    ) : (
                      searchResults.map((result) => (
                        <button
                          type="button"
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result.type, result)}
                          className="w-full flex items-center gap-4 px-4 py-3 border-b-2 border-[var(--color-theme-divider)] hover:bg-[var(--color-primary)] cursor-pointer group transition-colors text-left"
                        >
                          {result.type === 'players' ? (
                            <>
                              <div className="w-8 h-8 bg-[var(--color-theme-muted)] border-2 border-theme-border shrink-0 flex items-center justify-center overflow-hidden">
                                {result.photo_url ? (
                                  <img src={result.photo_url} alt={result.ign} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-['Archivo_Black'] text-[10px] text-gray-400">?</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-['Archivo_Black'] text-sm uppercase tracking-tighter truncate text-theme-text group-hover:text-black">{result.ign}</div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-gray-500 uppercase tracking-widest truncate group-hover:text-black/70">{result.team?.name || 'Free Agent'} • {result.current_role || 'Flex'}</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 bg-[var(--color-theme-muted)] border-2 border-theme-border shrink-0 flex items-center justify-center overflow-hidden">
                                {result.logo_url ? (
                                  <img src={result.logo_url} alt={result.name} className="w-6 h-6 object-contain" />
                                ) : (
                                  <span className="font-['Archivo_Black'] text-[10px] text-gray-400">?</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-['Archivo_Black'] text-sm uppercase tracking-tighter truncate text-theme-text group-hover:text-black">{result.name}</div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-gray-500 uppercase tracking-widest truncate group-hover:text-black/70">{result.region}</div>
                              </div>
                            </>
                          )}
                          <span className="shrink-0 bg-black text-[var(--color-primary)] px-2 py-1 font-['Archivo_Black'] text-[8px] uppercase tracking-widest">
                            {result.type === 'players' ? 'Player' : 'Team'}
                          </span>
                        </button>
                      ))
                    )}
                    
                    {!isSearching && searchResults.length > 0 && (
                      <div className="grid grid-cols-2 mt-auto border-t-2 border-theme-border">
                        <button
                          type="button"
                          onClick={() => handleViewAll('players')}
                          className="px-3 py-3 bg-black text-[var(--color-primary)] hover:bg-gray-800 font-['Archivo_Black'] text-[10px] uppercase tracking-widest text-center transition-colors flex items-center justify-center gap-2 border-r border-gray-700"
                        >
                          All Players <ArrowRight weight="bold" size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewAll('teams')}
                          className="px-3 py-3 bg-black text-[var(--color-primary)] hover:bg-gray-800 font-['Archivo_Black'] text-[10px] uppercase tracking-widest text-center transition-colors flex items-center justify-center gap-2 border-l border-gray-700"
                        >
                          All Teams <ArrowRight weight="bold" size={13} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6 ml-4">
            <ThemeToggle />
            <div className="flex items-center gap-3 bg-black text-[var(--color-primary)] px-4 py-2 border-2 border-theme-border">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
              <span className="text-[12px] font-bold font-label uppercase tracking-widest">Patch {activePatch}</span>
            </div>
            
            <button className="p-2.5 border-4 border-theme-border bg-theme-bg hover:bg-[var(--color-primary)] hover:scale-110 transition-transform active:scale-95 shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] hover:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]">
              <Bell weight="bold" size={20} className="text-theme-text" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 lg:p-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
