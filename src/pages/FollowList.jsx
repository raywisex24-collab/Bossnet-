import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from '../firebase'; // ✅ Added auth import
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Search, User } from 'lucide-react';
import VerifiedBadge from './VerifiedBadge'; // Since they are in the same folder

export default function FollowList() {
  const { userId, type } = useParams(); 
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fieldToQuery = type === 'followers' ? 'followingId' : 'followerId';
    const idToRetrieve = type === 'followers' ? 'followerId' : 'followingId';

    const q = query(collection(db, "follows"), where(fieldToQuery, "==", userId));

    const unsub = onSnapshot(q, async (snapshot) => {
      const usersData = await Promise.all(
        snapshot.docs.map(async (followDoc) => {
          const targetId = followDoc.data()[idToRetrieve];
          const userSnap = await getDoc(doc(db, "users", targetId));
          return { id: targetId, ...userSnap.data() };
        })
      );
      setList(usersData);
      setLoading(false);
    });

    return () => unsub();
  }, [userId, type]);

  const filteredList = list.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text font-sans">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-white/10 sticky top-0 bg-boss-bg z-10">
        <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer mr-8" />
        <h1 className="text-lg font-bold capitalize">{type}</h1>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="bg-[#262626] flex items-center px-3 py-2 rounded-xl">
          <Search size={18} className="text-gray-500 mr-2" />
          <input 
            type="text" 
            placeholder="Search" 
            className="bg-transparent outline-none text-sm w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="px-4 space-y-4">
        {loading ? (
          <p className="text-center text-gray-500 mt-10 animate-pulse">Loading {type}...</p>
        ) : filteredList.length > 0 ? (
          filteredList.map((user) => (
            <div 
              key={user.id} 
              onClick={() => {
                // ✅ SMART NAV: IF THE USER IS ME, GO TO /ME. OTHERWISE, GO TO THEIR PROFILE.
                if (auth.currentUser && user.id === auth.currentUser.uid) {
                  navigate('/me');
                } else {
                  navigate(`/profile/${user.id}`);
                }
              }}
              className="flex items-center justify-between active:bg-white/5 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 border border-white/10">
                  {user.profilePic ? (
                    <img src={user.profilePic} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <User size={20} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold lowercase tracking-tight">
                      {user.username || "..."}
                    </p>
                    <VerifiedBadge isVerified={user.isVerified} />
                  </div>
                  <p className="text-sm text-gray-500">{user.fullName}</p>
                </div>
              </div>
              
              <button className="bg-[#262626] px-5 py-1.5 rounded-lg text-xs font-bold">
                {auth.currentUser && user.id === auth.currentUser.uid ? 'Me' : 'View'}
              </button>
            </div>
          ))
        ) : (
          <div className="text-center mt-20">
            <p className="text-gray-500">No {type} found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

