'use client';

import React, { useContext, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useArticle } from '@/context/ArticleContext';
import AuthContext from '@/context/AuthContext';
import { 
  Edit, 
  Eye, 
  Trash2, 
  PlusCircle, 
  Archive, 
  LogIn, 
  LogOut, 
  Search, 
  Home,
  User as UserIcon
} from 'lucide-react';

const Navbar = () => {
  const { 
    viewMode, 
    toggleViewMode, 
    createArticle, 
    deleteArticle, 
    currentArticle,
    updateArticle,
    addToStored,
    articles,
    selectArticle,
    setViewMode
  } = useArticle();

  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [searchTerm, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setShowResults(true);
  };

  const filteredArticles = searchTerm 
    ? articles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 10)
    : [];

  const onSelectResult = (id: string) => {
    selectArticle(id);
    setSearch('');
    setShowResults(false);
  };

  const onLogout = () => {
    logout();
    setViewMode(true); // Force view mode on logout
    router.push('/');
  };

  return (
    <nav className="bg-[#58448a] border-b border-white/10 px-4 flex flex-nowrap justify-between items-center shadow-lg z-20 sticky top-0 h-[60px]">
      <div className="flex items-center gap-4">
        <Link href="/" onClick={() => setViewMode(true)} className="flex items-center gap-2 group">
          <div className="text-2xl font-normal font-[family-name:var(--font-special-elite)] text-white tracking-tight group-hover:scale-105 transition-transform flex items-center gap-1">
              <img width="32" height="32" src="/lambda-256x256x32.png" alt="logo" className="mr-1" />
              <span className="opacity-70 text-base">&lt;</span>
              <span>My Notebook</span>
              <span className="opacity-70 text-base">/&gt;</span>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="relative">
          <div className="flex items-center bg-dracula-bg border border-dracula-purple/50 rounded-full px-3 py-1 text-sm focus-within:border-dracula-cyan transition-colors w-64">
            <Search size={14} className="text-dracula-comment mr-2" />
            <input 
              type="text" 
              placeholder="Search graph..." 
              className="bg-transparent border-none outline-none text-dracula-fg w-full font-mono text-xs"
              value={searchTerm}
              onChange={handleSearch}
              onFocus={() => setShowResults(true)}
            />
          </div>
          
          {showResults && filteredArticles.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#2E3436] border border-dracula-comment rounded shadow-2xl overflow-hidden z-50">
              {filteredArticles.map(art => (
                <button
                  key={art._id}
                  onClick={() => onSelectResult(art._id)}
                  className="w-full text-left px-4 py-2 text-xs font-mono hover:bg-dracula-purple hover:text-dracula-bg transition-colors border-b border-dracula-bg last:border-0"
                >
                  {art.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Navigation / User Status */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 text-dracula-cyan bg-dracula-bg px-3 py-1 rounded-full border border-dracula-cyan/30">
                <UserIcon size={12} />
                <span>{user?.name}</span>
              </div>
              <button 
                onClick={onLogout}
                className="text-dracula-red hover:text-white flex items-center gap-1 transition-colors uppercase font-bold"
              >
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <Link 
              href="/login"
              className="text-dracula-green hover:text-white flex items-center gap-1 transition-colors uppercase font-bold"
            >
              <LogIn size={14} /> Login
            </Link>
          )}
        </div>

        <div className="w-px h-6 bg-dracula-comment/30 mx-1"></div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {isAuthenticated && (
            <>
              {!viewMode ? (
                <>
                  <button 
                    onClick={async () => {
                      if (currentArticle) {
                        await updateArticle(currentArticle);
                        alert("Article saved successfully!");
                      }
                    }} 
                    className="flex items-center gap-2 text-green hover:text-white transition-colors uppercase font-bold text-xs"
                    title="Save Article"
                  >
                    <Edit size={16} className="text-dracula-yellow" /> <span className="hidden sm:inline">Save</span>
                  </button>
                  <button 
                    onClick={createArticle} 
                    className="flex items-center gap-2 text-green hover:text-white transition-colors uppercase font-bold text-xs"
                    title="New Article"
                  >
                    <PlusCircle size={16} /> <span className="hidden sm:inline">New</span>
                  </button>
                  <button 
                    onClick={() => currentArticle && deleteArticle(currentArticle._id)} 
                    className="flex items-center gap-2 text-red hover:text-white transition-colors uppercase font-bold text-xs"
                    title="Delete Article"
                  >
                    <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
                  </button>
                  <button 
                    onClick={toggleViewMode} 
                    className="flex items-center gap-2 text-cyan hover:text-green transition-colors uppercase font-bold text-xs"
                  >
                    <Eye size={16} /> <span className="hidden sm:inline">View</span>
                  </button>
                </>
              ) : (
                <button 
                  onClick={toggleViewMode} 
                  className="flex items-center gap-2 text-purple hover:text-pink transition-colors uppercase font-bold text-xs"
                >
                  <Edit size={16} /> <span className="hidden sm:inline">Edit</span>
                </button>
              )}
            </>
          )}
          
          <button 
              onClick={() => currentArticle && addToStored(currentArticle._id)} 
              className="flex items-center gap-2 text-orange hover:text-white transition-colors uppercase font-bold text-xs"
              title="Add to Store"
          >
              <Archive size={16} /> <span className="hidden sm:inline">Store</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;