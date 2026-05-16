import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Search, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Verify if the logged-in account has Admin rights
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate('/login');
          return;
        }
        
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          setIsAdmin(true);
        } else {
          // Boot them off the screen if they aren't authorized
          Swal.fire("Access Denied", "Admins only, boss!", "error");
          navigate('/feed');
        }
      } catch (err) {
        console.error(err);
        navigate('/feed');
      } finally {
        setLoading(false);
      }
    };
    checkAdminStatus();
  }, [navigate]);

  // 2. Fetch all users in real-time once admin clearance is confirmed
  useEffect(() => {
    if (!isAdmin) return;

    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [isAdmin]);

  // 3. Toggle verification status directly in Firestore
  const toggleVerification = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isVerified: !currentStatus
      });
      Swal.fire("Updated", `User verification status changed!`, "success");
    } catch (err) {
      Swal.fire("Error", "Failed to update user status", "error");
    }
  };

  // Filter list based on search bar text input
  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-boss-bg flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text font-sans pb-10">
      {/* Header Layout */}
      <div className="flex items-center gap-4 p-4 border-b border-white/10 sticky top-0 bg-boss-bg z-50">
        <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer text-zinc-400 hover:text-white" />
        <div className="flex items-center gap-2">
          <Shield className="text-blue-500" size={22} />
          <h1 className="text-xl font-bold tracking-tight">Bossnet Terminal</h1>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Live Search Input Box */}
        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
          <Search className="text-gray-500 mr-3" size={18} />
          <input 
            type="text"
            placeholder="Search users by name or handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-boss-text placeholder-gray-500"
          />
        </div>

        {/* User Accounts Stream Listing */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider px-1">Registered Accounts ({filteredUsers.length})</p>
          
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <img src={user.profilePic || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
                <div>
                  <h4 className="font-bold text-sm text-boss-text">{user.fullName || "No Name Set"}</h4>
                  <p className="text-xs text-blue-400">@{user.username}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <button 
                onClick={() => toggleVerification(user.id, user.isVerified)}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                  user.isVerified 
                    ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
                    : 'bg-zinc-800/50 border-white/5 text-zinc-500'
                }`}
              >
                {user.isVerified ? <CheckCircle size={20} /> : <XCircle size={20} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
