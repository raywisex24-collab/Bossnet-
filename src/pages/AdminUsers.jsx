import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Search, ChevronRight, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) { navigate('/login'); return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists() && snap.data().isAdmin === true) {
        setIsAdmin(true);
      } else {
        Swal.fire("Access Denied", "Admins only!", "error");
        navigate('/feed');
      }
      setLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    return onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [isAdmin]);

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="min-h-screen !bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isAdmin) return null;

  return (
    /* We added '!bg-black' to force the container background to deep dark pitch black 
      overriding global CSS rules or runtime theme attributes 
    */
    <div className="min-h-screen !bg-black text-boss-text font-sans pb-12">
      <div className="flex items-center gap-4 p-4 border-b border-white/10 sticky top-0 !bg-black z-50">
        <ArrowLeft onClick={() => navigate('/admin')} className="cursor-pointer text-zinc-400" />
        <h1 className="text-lg font-bold">Account Directory</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
          <Search className="text-gray-500 mr-2" size={16} />
          <input type="text" placeholder="Search handles or names..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent outline-none text-sm" />
        </div>

        <div className="space-y-2">
          {filteredUsers.map(user => (
            <div 
              key={user.id} 
              onClick={() => navigate(`/admin/users/edit/${user.id}`)}
              className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-all cursor-pointer active:scale-99"
            >
              <div className="flex items-center gap-3">
                {/* Condition: If user.profilePic exists, render image. Otherwise, fall back to clean inline system SVG */}
                {user.profilePic ? (
                  <img src={user.profilePic} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 2 4 2zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
                
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-1">
                    {user.fullName || "No Name"}
                    {user.isVerified && <CheckCircle size={14} className="text-blue-400 fill-blue-400/10" />}
                  </h4>
                  <p className="text-xs text-zinc-500">@{user.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                {user.isBanned && <span className="text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">Banned</span>}
                <ChevronRight size={16} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

