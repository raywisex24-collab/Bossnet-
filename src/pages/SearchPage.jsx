import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Search as SearchIcon, User, BadgeCheck, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      // Searching by lowercase to ensure matches work regardless of typing case
      const q = query(
        collection(db, "users"),
        where("username", ">=", searchTerm.toLowerCase()),
        where("username", "<=", searchTerm.toLowerCase() + "\uf8ff"),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setResults(users);
    };

    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="fixed inset-0 bg-black z-[200] overflow-y-auto">
      {/* 🟢 Top-Pinned Search Bar */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-4 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-zinc-400 active:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            autoFocus
            type="text"
            placeholder="Search..."
            className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-all text-[16px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Results Section */}
      <div className="p-4 space-y-4">
        {results.map((user) => (
          <div 
            key={user.id}
            onClick={() => navigate(`/profile/${user.id}`)}
            className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-2xl active:scale-[0.98] transition-all border border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                {user.profilePic ? (
                  <img src={user.profilePic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-zinc-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-white font-bold tracking-tight">{user.username}</p>
                  {user.isVerified && <BadgeCheck size={14} className="text-blue-500 fill-blue-500/20" />}
                </div>
                <p className="text-zinc-500 text-xs">{user.fullName || 'BossNet User'}</p>
              </div>
            </div>
          </div>
        ))}

        {searchTerm && results.length === 0 && (
          <div className="flex flex-col items-center mt-20 text-zinc-500">
            <SearchIcon size={48} className="opacity-10 mb-4" />
            <p className="text-sm">No results for "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

