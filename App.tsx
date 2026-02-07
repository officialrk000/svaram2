
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Search, 
  Home, 
  Sparkles, 
  Music2, 
  ListMusic,
  ChevronLeft,
  Send,
  Loader2,
  Settings,
  X,
  Disc,
  FolderOpen,
  Shuffle,
  Volume1,
  ExternalLink,
  Repeat,
  WifiOff,
  CloudOff,
  Plus
} from 'lucide-react';
import { MOCK_SONGS } from './constants';
import { Song, Playlist } from './types';
import { getMusicRecommendation } from './services/geminiService';

// Storage Keys for persistence
const STORAGE_SONGS = 'svaram_songs_v1';
const STORAGE_PLAYLISTS = 'svaram_playlists_v1';
const STORAGE_ACTIVE_TAB = 'svaram_active_tab_v1';
const STORAGE_CURRENT_SONG_ID = 'svaram_current_song_id_v1';

const App: React.FC = () => {
  // Persistence Helpers
  const loadSavedSongs = () => {
    const saved = localStorage.getItem(STORAGE_SONGS);
    return saved ? JSON.parse(saved) : MOCK_SONGS;
  };

  const loadSavedPlaylists = () => {
    const saved = localStorage.getItem(STORAGE_PLAYLISTS);
    return saved ? JSON.parse(saved) : [];
  };

  const loadSavedTab = () => {
    const saved = localStorage.getItem(STORAGE_ACTIVE_TAB);
    return (saved as any) || 'home';
  };

  // Global App State
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Data State with Initial Loading from Storage
  const [songs, setSongs] = useState<Song[]>(loadSavedSongs);
  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>(loadSavedPlaylists);
  
  // Custom Playlists UI State
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Player State
  const [currentSong, setCurrentSong] = useState<Song>(() => {
    const savedId = localStorage.getItem(STORAGE_CURRENT_SONG_ID);
    const found = loadSavedSongs().find((s: Song) => s.id === savedId);
    return found || loadSavedSongs()[0];
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'playlist' | 'settings' | 'player'>(loadSavedTab);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Playlists Categories
  const playlistCategories = [
    { name: 'Boliwood', icon: <FolderOpen className="w-5 h-5" />, color: 'bg-indigo-500' },
    { name: 'Bhojpuri', icon: <FolderOpen className="w-5 h-5" />, color: 'bg-blue-500' },    
    { name: 'Best of 2025', icon: <FolderOpen className="w-5 h-5" />, color: 'bg-violet-500' },
    { name: 'Hip Hop', icon: <FolderOpen className="w-5 h-5" />, color: 'bg-fuchsia-500' },
    { name: '2026', icon: <FolderOpen className="w-5 h-5" />, color: 'bg-purple-500' },
    { name: 'Romance', icon: <FolderOpen className="w-5 h-5" />, color: 'bg-purple-500' },
    { name: 'Top', icon: <FolderOpen className="w-5 h-5" />, color: 'bg-purple-500' }

  ];

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem(STORAGE_SONGS, JSON.stringify(songs));
    localStorage.setItem(STORAGE_PLAYLISTS, JSON.stringify(customPlaylists));
    localStorage.setItem(STORAGE_ACTIVE_TAB, activeTab);
    localStorage.setItem(STORAGE_CURRENT_SONG_ID, currentSong.id);
  }, [songs, customPlaylists, activeTab, currentSong]);

  // Search Logic
  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.artist.toLowerCase().includes(q) ||
      s.album.toLowerCase().includes(q) ||
      s.genre.toLowerCase().includes(q)
    );
  }, [searchQuery, songs]);

  // Initial Loader & Offline Listener
  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 1500);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Audio Logic
  const togglePlay = () => setIsPlaying(prev => !prev);

  const playSong = (song: Song) => {
    if (currentSong.id === song.id) {
      togglePlay();
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
    setActiveTab('player');
  };

  const playNext = () => {
    const currentList = selectedPlaylist 
      ? songs.filter(s => s.category === selectedPlaylist || s.playlistIds?.includes(selectedPlaylist)) 
      : songs;
    if (currentList.length === 0) return;
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * currentList.length);
    } else {
      const currentIndex = currentList.findIndex(s => s.id === currentSong.id);
      nextIndex = (currentIndex + 1) % currentList.length;
    }
    setCurrentSong(currentList[nextIndex]);
    setIsPlaying(true);
  };

  const playPrev = () => {
    const currentList = selectedPlaylist 
      ? songs.filter(s => s.category === selectedPlaylist || s.playlistIds?.includes(selectedPlaylist)) 
      : songs;
    if (currentList.length === 0) return;
    const currentIndex = currentList.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + currentList.length) % currentList.length;
    setCurrentSong(currentList[prevIndex]);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        if (err.name !== 'AbortError') console.error("Playback failed:", err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration && isFinite(duration)) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      const duration = audioRef.current.duration;
      if (duration && isFinite(duration)) {
        setIsBuffering(true);
        audioRef.current.currentTime = (val / 100) * duration;
        setProgress(val);
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Playlist Logic
  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const newId = `custom-${Date.now()}`;
    const newP: Playlist = {
      id: newId,
      name: newPlaylistName,
      description: 'Your custom collection.',
      imageUrl: 'https://picsum.photos/seed/' + newId + '/400/400'
    };
    setCustomPlaylists([...customPlaylists, newP]);
    setNewPlaylistName('');
    setIsCreatingPlaylist(false);
  };

  const addSongToPlaylist = (songId: string, playlistId: string) => {
    setSongs(prev => prev.map(s => {
      if (s.id === songId) {
        const existing = s.playlistIds || [];
        if (!existing.includes(playlistId)) {
          return { ...s, playlistIds: [...existing, playlistId] };
        }
      }
      return s;
    }));
  };

  // AI assistant logic
  const handleAiAsk = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const res = await getMusicRecommendation(aiInput);
      setAiResponse(res);
    } catch (error) { console.error(error); }
    finally { setIsAiLoading(false); setAiInput(''); }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <span className="text-[10px] font-bold tracking-[0.3em] text-indigo-400 uppercase">Loading.....</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden font-sans relative transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      
      {/* Offline Alert */}
      {!isOnline && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
            <WifiOff className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-black mb-2 uppercase text-white">No Internet</h2>
          <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">Check your connection. Svaram requires active network for streaming.</p>
          <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-indigo-500 text-white font-bold rounded-2xl text-[11px] uppercase tracking-widest">Retry</button>
        </div>
      )}

      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={isRepeat ? undefined : playNext} 
        loop={isRepeat} 
        src={currentSong.audioUrl} 
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
      />

      {/* Sidebar */}
      <aside className={`hidden md:flex w-64 border-r flex-col p-6 space-y-8 ${isDarkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200'}`}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg"><Music2 className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-black uppercase tracking-tighter">Svaram</span>
          </div>
        </div>
        <nav className="space-y-2">
          <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home />} label="Home" />
          <NavItem active={activeTab === 'search'} onClick={() => setActiveTab('search')} icon={<Search />} label="Search" />
          <NavItem active={activeTab === 'playlist'} onClick={() => setActiveTab('playlist')} icon={<ListMusic />} label="Folders" />
          <NavItem active={activeTab === 'player'} onClick={() => setActiveTab('player')} icon={<Disc />} label="Now Playing" />
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} label="Preferences" />
        </nav>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-40 md:pb-32 custom-scrollbar">
          
          {/* Home Tab */}
          {activeTab === 'home' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20"><Music2 className="w-7 h-7 text-white" /></div>
                    <div>
                      <h1 className="text-2xl font-black uppercase tracking-tighter">Svaram V.2</h1>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] leading-none">Free Musics</p>
                    </div>
                  </div>
               </div>

               <header className="relative bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl overflow-hidden border border-white/5">
                 <div className="space-y-2 relative z-10 text-center md:text-left">
                   <h2 className="text-3xl font-black tracking-tight">Sonic Serenity</h2>
                   <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Curated for your soul</p>
                 </div>
                 <button onClick={() => playSong(songs[0])} className="w-16 h-16 bg-indigo-500 text-white rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-10"><Play className="w-8 h-8 fill-current ml-1" /></button>
               </header>

               <section>
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xs font-black tracking-[0.2em] uppercase text-indigo-400">Discover Tracks</h2>
                 </div>
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                   {songs.map(s => (
                     <div key={s.id} onClick={() => playSong(s)} className="group bg-zinc-900/30 p-4 rounded-[2rem] cursor-pointer hover:bg-zinc-900 transition-all border border-transparent hover:border-indigo-500/10 shadow-lg">
                        <div className="relative aspect-square mb-4 rounded-2xl overflow-hidden">
                           <img src={s.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center"><Play className="w-6 h-6 text-black fill-current" /></div>
                           </div>
                        </div>
                        <p className="font-bold truncate text-[11px] text-zinc-200">{s.title}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{s.artist}</p>
                     </div>
                   ))}
                 </div>
               </section>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-8 max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracks, artists, or albums..." 
                  className="w-full bg-zinc-900/80 border border-white/5 rounded-[1.5rem] px-14 py-5 text-[12px] font-medium outline-none backdrop-blur-md" 
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-2">Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {filteredSongs.map(s => (
                     <div key={s.id} onClick={() => playSong(s)} className="flex items-center space-x-4 p-4 rounded-3xl bg-zinc-900/30 hover:bg-zinc-900 cursor-pointer group transition-all border border-transparent hover:border-white/5">
                        <img src={s.coverUrl} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate text-xs group-hover:text-indigo-400 transition-colors">{s.title}</p>
                          <p className="text-[9px] text-zinc-500 uppercase font-bold mt-0.5">{s.artist}</p>
                        </div>
                        <Play className="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100" />
                     </div>
                   ))}
                </div>
              </div>
            </div>
          )}

          {/* Folders/Playlist Tab */}
          {activeTab === 'playlist' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {!selectedPlaylist ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ListMusic className="w-5 h-5 text-indigo-500" />
                      <h2 className="text-xl font-black tracking-tight uppercase">Folders</h2>
                    </div>
                    <button onClick={() => setIsCreatingPlaylist(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest">
                      <Plus className="w-4 h-4" /><span>New Playlist</span>
                    </button>
                  </div>

                  {isCreatingPlaylist && (
                    <div className="bg-zinc-900/60 p-6 rounded-3xl border border-indigo-500/30">
                      <div className="flex space-x-3">
                        <input type="text" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} placeholder="Playlist name..." className="flex-1 bg-zinc-800 border-none rounded-xl px-4 py-2 text-xs outline-none" />
                        <button onClick={createPlaylist} className="px-6 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Create</button>
                        <button onClick={() => setIsCreatingPlaylist(false)} className="p-2 text-zinc-500"><X className="w-5 h-5" /></button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                    {playlistCategories.map((p, idx) => (
                      <div key={idx} onClick={() => setSelectedPlaylist(p.name)} className="flex flex-col items-center p-8 rounded-[2.5rem] bg-zinc-900/40 hover:bg-indigo-500 group cursor-pointer transition-all text-center border border-white/5">
                        <div className={`w-14 h-14 ${p.color} rounded-2xl flex items-center justify-center mb-5 text-white transition-all group-hover:bg-white group-hover:text-indigo-500`}>
                          {p.icon}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest group-hover:text-white leading-tight">{p.name}</span>
                        <span className="text-[8px] mt-2 text-zinc-500 font-bold group-hover:text-indigo-100/60 uppercase">{songs.filter(s => s.category === p.name).length} Tracks</span>
                      </div>
                    ))}
                    {customPlaylists.map((p) => (
                      <div key={p.id} onClick={() => setSelectedPlaylist(p.id)} className="flex flex-col items-center p-8 rounded-[2.5rem] bg-zinc-900/40 hover:bg-indigo-500 group cursor-pointer transition-all border border-white/5">
                        <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-white group-hover:text-indigo-500">
                           <ListMusic className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest group-hover:text-white leading-tight truncate w-full text-center">{p.name}</span>
                        <span className="text-[8px] mt-2 text-zinc-500 font-bold group-hover:text-indigo-100/60 uppercase">{songs.filter(s => s.playlistIds?.includes(p.id)).length} Tracks</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                  <button onClick={() => setSelectedPlaylist(null)} className="flex items-center space-x-2 text-indigo-400">
                    <ChevronLeft className="w-5 h-5" /><span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
                  </button>
                  <div className="flex items-end space-x-8 pb-8 border-b border-white/10">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-indigo-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl"><FolderOpen className="w-16 h-16 text-white" /></div>
                    <div className="space-y-2">
                       <h2 className="text-3xl md:text-4xl font-black">{customPlaylists.find(p => p.id === selectedPlaylist)?.name || selectedPlaylist}</h2>
                       <p className="text-[11px] text-indigo-400 uppercase tracking-[0.3em] font-black">Collection • {songs.filter(s => s.category === selectedPlaylist || s.playlistIds?.includes(selectedPlaylist!)).length} Tracks</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {songs.filter(s => s.category === selectedPlaylist || s.playlistIds?.includes(selectedPlaylist!)).map((s, idx) => (
                      <div key={s.id} onClick={() => playSong(s)} className="flex items-center space-x-5 p-4 rounded-3xl hover:bg-zinc-900 cursor-pointer group transition-all border border-transparent hover:border-white/5">
                        <span className="text-[11px] font-black text-zinc-700 w-6">{idx + 1}</span>
                        <img src={s.coverUrl} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate text-[11px] group-hover:text-indigo-400 transition-colors">{s.title}</p>
                          <p className="text-[9px] text-zinc-500 uppercase font-bold mt-0.5">{s.artist}</p>
                        </div>
                        <span className="text-[10px] font-black text-zinc-600 uppercase tabular-nums">{formatTime(s.duration)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Player Tab - ADJUSTED */}
          {activeTab === 'player' && (
            <div className="h-full w-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700 relative overflow-hidden">
               <div className="absolute inset-0 -z-10 pointer-events-none">
                 <img src={currentSong.coverUrl} className="w-full h-full object-cover scale-150 blur-[140px] opacity-20" alt="" />
                 <div className="absolute inset-0 bg-black/30" />
               </div>

               <div className="relative w-full max-w-sm flex flex-col items-center px-4 max-h-full">
                  {/* Card without translate-y hover as requested */}
                  <div className="relative w-full bg-zinc-900/70 backdrop-blur-3xl border border-white/10 rounded-[4rem] md:rounded-[4.5rem] p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8 md:space-y-10 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto custom-scrollbar transition-all">
                     
                     {/* Artwork */}
                     <div className="flex justify-center shrink-0">
                        <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72">
                          <img src={currentSong.coverUrl} className={`w-full h-full rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl transition-all duration-1000 object-cover ${isPlaying ? 'scale-105 rotate-1' : 'scale-100 grayscale-[0.2]'}`} alt="Cover" />
                          <div className={`absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 w-12 h-12 sm:w-16 sm:h-16 bg-indigo-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 ${isPlaying ? 'rotate-12 scale-110 shadow-indigo-500/50' : 'scale-100'}`}>
                             {isBuffering ? (
                               <Loader2 className="w-7 h-7 sm:w-9 sm:h-9 text-white animate-spin" />
                             ) : (
                               <Disc className={`w-7 h-7 sm:w-9 sm:h-9 text-white ${isPlaying ? 'animate-spin-slow' : ''}`} />
                             )}
                          </div>
                        </div>
                     </div>

                     {/* Metadata */}
                     <div className="text-center space-y-2 shrink-0">
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tighter line-clamp-1 leading-tight">{currentSong.title}</h2>
                        <span className="text-[10px] sm:text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em]">{currentSong.artist}</span>
                     </div>

                     {/* Progress Bar Container - FULL VISIBILITY */}
                     <div className="space-y-3 px-1 shrink-0">
                        <div className="relative h-1.5 w-full bg-zinc-800 rounded-full group">
                          {/* Buffering Shimmer Layer */}
                          {isBuffering && (
                            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-10">
                              <div className="h-full w-1/3 bg-white/20 animate-shimmer" />
                            </div>
                          )}
                          {/* Active Progress */}
                          <div 
                            className="absolute h-full bg-indigo-500 rounded-full z-0 transition-all duration-150" 
                            style={{ width: `${progress}%` }} 
                          />
                          {/* Invisible range for interaction */}
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="0.1"
                            value={progress} 
                            onChange={handleProgressChange} 
                            className="absolute inset-0 w-full h-1.5 opacity-0 cursor-pointer z-20"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] tabular-nums">
                           <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                           <span>{formatTime(audioRef.current?.duration || 0)}</span>
                        </div>
                     </div>

                     {/* Controls */}
                     <div className="flex flex-col items-center space-y-6 shrink-0">
                        <div className="flex items-center justify-center space-x-6 sm:space-x-10">
                           <button onClick={playPrev} className="text-zinc-500 hover:text-indigo-400 transition-all p-2"><SkipBack className="w-6 h-6 sm:w-8 sm:h-8" /></button>
                           <button onClick={togglePlay} className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl active:scale-90 relative overflow-hidden">
                              {isBuffering ? (
                                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />
                              ) : (
                                isPlaying ? <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" /> : <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                              )}
                           </button>
                           <button onClick={playNext} className="text-zinc-500 hover:text-indigo-400 transition-all p-2"><SkipForward className="w-6 h-6 sm:w-8 sm:h-8" /></button>
                        </div>
                        <div className="flex items-center justify-between w-full px-4 border-t border-white/5 pt-6">
                           <button onClick={() => setIsShuffle(!isShuffle)} className={`p-2 rounded-xl transition-all ${isShuffle ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-600'}`}><Shuffle className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                           <div className="flex items-center space-x-2 bg-zinc-950/40 px-4 py-2 rounded-full border border-white/5">
                              <Volume1 className="w-3 h-3 text-zinc-600" />
                              <input type="range" min="0" max="1" step="0.02" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-16 sm:w-24 h-1 bg-zinc-800 rounded-full appearance-none accent-indigo-500 cursor-pointer" />
                              <Volume2 className="w-3 h-3 text-zinc-600" />
                           </div>
                           <button onClick={() => setIsRepeat(!isRepeat)} className={`p-2 rounded-xl transition-all ${isRepeat ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-600'}`}><Repeat className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-md mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-xl font-black uppercase tracking-tight text-indigo-400">Settings</h2>
               
               <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-8 shadow-2xl">
                  <div className="flex items-center space-x-4">
                     <div className="w-16 h-16 bg-indigo-500 rounded-3xl flex items-center justify-center text-white text-2xl font-black">S</div>
                     <div className="space-y-1">
                        <p className="text-[12px] font-black uppercase tracking-tight text-zinc-100">Svaram Listener</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Preferences Saved Locally</p>
                     </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-800/50">
                       <span className="text-[10px] font-black uppercase tracking-[0.1em]">Midnight Theme</span>
                       <button onClick={() => setIsDarkMode(!isDarkMode)} className={`relative w-12 h-7 rounded-full p-1 transition-all duration-300 ${isDarkMode ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full transform transition-transform duration-300 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                       </button>
                    </div>
                  </div>
               </div>

               {/* Ads Box / Premium Promo as requested */}
               <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/40 rounded-[2.5rem] p-10 relative overflow-hidden group hover:border-indigo-500/80 transition-all shadow-2xl transform hover:-translate-y-1">
                  <div className="absolute top-0 right-0 p-4 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl shadow-xl z-20">PRO FEATURE</div>
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg"><Sparkles className="w-6 h-6 text-white" /></div>
                       <h3 className="text-lg font-black text-indigo-300 uppercase tracking-tight">Unlock Svaram Elite</h3>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-bold uppercase tracking-tight">Experience music without limits. Lossless 24-bit audio, AI-curated mixes, and zero commercial interruptions.</p>
                    <button className="flex items-center space-x-2 bg-indigo-500 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95">
                      <span>Go Elite</span><ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px]" />
               </div>
            </div>
          )}
        </div>

        {/* Mini Player Control Bar */}
        {activeTab !== 'player' && (
          <footer className="fixed bottom-14 md:bottom-0 left-0 right-0 h-18 md:h-20 bg-zinc-900/95 backdrop-blur-2xl border-t border-white/5 px-6 flex items-center justify-between z-40 shadow-2xl">
            <div className="flex items-center w-full md:w-1/4 space-x-4 cursor-pointer group" onClick={() => setActiveTab('player')}>
              <img src={currentSong.coverUrl} className={`w-12 h-12 rounded-xl shadow-xl transition-transform duration-500 ${isPlaying ? 'rotate-3 scale-105' : ''}`} alt="" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black truncate group-hover:text-indigo-400 transition-colors tracking-tight">{currentSong.title}</span>
                <span className="text-[9px] text-zinc-500 truncate uppercase font-bold tracking-widest">{currentSong.artist}</span>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-center flex-1 px-12">
              <div className="flex items-center space-x-8">
                <button onClick={(e) => { e.stopPropagation(); playPrev(); }} className="text-zinc-500 hover:text-white transition-all"><SkipBack className="w-5 h-5" /></button>
                <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-11 h-11 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90">
                   {isBuffering ? <Loader2 className="w-5 h-5 animate-spin" /> : (isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />)}
                </button>
                <button onClick={(e) => { e.stopPropagation(); playNext(); }} className="text-zinc-500 hover:text-white transition-all"><SkipForward className="w-5 h-5" /></button>
              </div>
              <div className="w-full mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden relative">
                <div className={`h-full bg-indigo-500 transition-all duration-300 ${isBuffering ? 'opacity-50' : ''}`} style={{ width: `${progress}%` }} />
                {isBuffering && <div className="absolute inset-0 w-1/4 bg-white/20 animate-shimmer" />}
              </div>
            </div>

            <div className="flex items-center space-x-4 md:w-1/4 justify-end">
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="md:hidden p-3 bg-indigo-500 text-white rounded-2xl shadow-xl active:scale-90">
                {isBuffering ? <Loader2 className="w-5 h-5 animate-spin" /> : (isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />)}
              </button>
            </div>
          </footer>
        )}

        {/* Mobile Navigation Dock */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-900 flex items-center justify-around z-50 px-2">
          <MobileNavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home />} label="Home" />
          <MobileNavItem active={activeTab === 'search'} onClick={() => setActiveTab('search')} icon={<Search />} label="Library" />
          <MobileNavItem active={activeTab === 'playlist'} onClick={() => setActiveTab('playlist')} icon={<ListMusic />} label="Folders" />
          <MobileNavItem active={activeTab === 'player'} onClick={() => setActiveTab('player')} icon={<Disc />} label="Player" />
          <MobileNavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} label="Settings" />
        </nav>
      </main>

      {/* Assistant Sidepanel */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-80 z-[120] transform transition-transform duration-500 ease-in-out border-l border-white/5 ${isAiSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className={`h-full flex flex-col ${isDarkMode ? 'bg-zinc-950/98' : 'bg-zinc-50/98'} backdrop-blur-3xl`}>
          <header className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-indigo-400">
              <Sparkles className="w-5 h-5" />
              <h2 className="font-black text-xs uppercase tracking-[0.2em]">Svaram AI</h2>
            </div>
            <button onClick={() => setIsAiSidebarOpen(false)} className="p-2 text-zinc-500 hover:text-white bg-zinc-900 rounded-xl transition-all"><X className="w-5 h-5" /></button>
          </header>
          <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
             {aiResponse && (
               <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] p-6 space-y-4 animate-in fade-in zoom-in-95 duration-500">
                 <div>
                   <p className="text-xs font-black text-indigo-100 mb-1 uppercase tracking-tight">{aiResponse.mood}</p>
                   <p className="text-[11px] leading-relaxed text-indigo-200/70 font-medium italic">"{aiResponse.reason}"</p>
                 </div>
                 <span className="inline-block px-3 py-1 bg-indigo-500 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">{aiResponse.suggestedGenre}</span>
               </div>
             )}
             {isAiLoading && <div className="flex flex-col items-center justify-center py-20 space-y-4"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /><p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 animate-pulse">Consulting DJ...</p></div>}
          </div>
          <div className="p-6 border-t border-white/5 bg-zinc-900/40">
             <div className="relative group">
                <textarea value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="e.g. 'I want something romantic'..." className="w-full bg-zinc-800 border-none rounded-[1.5rem] p-5 pr-14 text-[11px] font-medium outline-none h-28 resize-none shadow-inner" />
                <button onClick={handleAiAsk} disabled={isAiLoading || !aiInput.trim()} className="absolute bottom-4 right-4 w-10 h-10 bg-indigo-500 disabled:opacity-20 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all"><Send className="w-5 h-5" /></button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactElement<any>; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${active ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-500 hover:text-indigo-400 hover:bg-white/5'}`}>
    {React.cloneElement(icon, { className: "w-5 h-5" })}<span>{label}</span>
  </button>
);

const MobileNavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactElement<any>; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center flex-1 py-1 group">
    <div className={`transition-all duration-300 ${active ? 'text-indigo-500 scale-110' : 'text-zinc-600 group-hover:text-zinc-400'}`}>{React.cloneElement(icon, { className: "w-5 h-5" })}</div>
    <span className={`text-[8px] font-black mt-1.5 tracking-widest leading-none ${active ? 'text-indigo-500' : 'text-zinc-600 group-hover:text-zinc-400'}`}>{label}</span>
  </button>
);

export default App;
