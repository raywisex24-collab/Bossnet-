import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { 
  doc, getDoc, setDoc, deleteDoc, collection, query, where, onSnapshot, orderBy 
} from 'firebase/firestore';
import { ArrowLeft, MessageCircle, MoreVertical, Grid, Bookmark, X } from 'lucide-react';
import VerifiedBadge from './VerifiedBadge'; // Since they are in the same folder

export default function Profile() {
  const { userId } = useParams(); 
  const navigate = useNavigate();

  // Advanced metric shorthand notation converter (K, M, B)
  const getShorthandStyle = (num) => {
    const numericValue = Number(num) || 0;
    if (numericValue < 1000) return numericValue.toString();
    
    const thresholds = [
      { value: 1e9, symbol: 'B' },
      { value: 1e6, symbol: 'M' },
      { value: 1000, symbol: 'K' }
    ];
    
    // Find matching metric division barrier step
    const match = thresholds.find(t => numericValue >= t.value);
    if (match) {
      const calculated = numericValue / match.value;
      // If the division leaves a clean integer or is point zero, drop the decimal point
      return (calculated % 1 === 0) 
        ? calculated.toFixed(0) + match.symbol 
        : calculated.toFixed(1) + match.symbol;
    }
    
    return numericValue.toLocaleString();
  };

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // States for live data
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userPosts, setUserPosts] = useState([]); 
  const [zoomedImage, setZoomedImage] = useState(null);

  // ✅ REDIRECT GUARD: IF I LAND ON MY OWN 'OTHER' PROFILE PAGE, SEND TO /ME
  useEffect(() => {
    if (auth.currentUser && userId === auth.currentUser.uid) {
      navigate('/me', { replace: true });
    }
  }, [userId, navigate]);

  useEffect(() => {
    // 1. Fetch User Profile Data
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfileData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    // 2. Real-time Listeners
    if (auth.currentUser) {
      // Follow Status (Am I following them?)
      const unsubFollowStatus = onSnapshot(
        query(collection(db, "follows"), where("followerId", "==", auth.currentUser.uid), where("followingId", "==", userId)), 
        (snap) => setIsFollowing(!snap.empty)
      );

      // Real-time Counts for Followers
      const unsubFollowers = onSnapshot(query(collection(db, "follows"), where("followingId", "==", userId)), (snap) => {
        setFollowerCount(snap.docs.length);
      });

      // Real-time Counts for Following
      const unsubFollowing = onSnapshot(query(collection(db, "follows"), where("followerId", "==", userId)), (snap) => {
        setFollowingCount(snap.docs.length);
      });

      // ✅ REAL-TIME POSTS: Fetch posts where userId matches this profile
      const unsubPosts = onSnapshot(
        query(collection(db, "posts"), where("userId", "==", userId), orderBy("createdAt", "desc")), 
        (snap) => {
          setUserPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      );

      return () => {
        unsubFollowStatus();
        unsubFollowers();
        unsubFollowing();
        unsubPosts();
      };
    }
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!auth.currentUser) return;
    const followId = `${auth.currentUser.uid}_${userId}`;
    const followDocRef = doc(db, "follows", followId);
    try {
      if (!isFollowing) {
        await setDoc(followDocRef, { 
          followerId: auth.currentUser.uid, 
          followingId: userId, 
          createdAt: new Date() 
        });
      } else {
        await deleteDoc(followDocRef);
      }
    } catch (error) { 
      console.error("Follow error:", error); 
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-boss-bg flex items-center justify-center text-boss-text italic animate-pulse">
      Loading Profile...
    </div>
  );

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text font-sans">
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between sticky top-0 bg-boss-bg/80 backdrop-blur-md z-50">
        <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer active:scale-90 transition-transform" />
        <h2 className="font-black italic uppercase tracking-tighter text-sm">
          {profileData?.username || 'Profile'}
        </h2>
        <MoreVertical size={20} />
      </div>

      {/* PROFILE INFO */}
      <div className="px-6 pt-4 pb-8 flex flex-col items-center border-b border-white/5">
        <div className="relative mb-4">
          <div className={`w-24 h-24 rounded-full border-2 p-1 ${isFollowing ? 'border-blue-500' : 'border-gray-800'}`}>
            <img 
              src={profileData?.profilePic || "https://via.placeholder.com/150"} 
              className="w-full h-full rounded-full object-cover"
              alt="Profile"
            />
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-bold lowercase tracking-tight">
              {profileData?.username || "..."}
            </h1>
            <VerifiedBadge isVerified={profileData?.isVerified} />
          </div>
          <h2 className="text-sm font-medium text-gray-400 mt-0.5">{profileData?.fullName || 'Boss User'}</h2>
        </div>

        <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mt-1 mb-3">
          @{profileData?.username || 'username'}
        </p>

        {/* Public Admin Managed Identity Badges Grid Layout */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-6 max-w-xs">
          {profileData?.isArtist && <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold rounded-md tracking-wide uppercase">Artist</span>}
          {profileData?.isBusiness && <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-md tracking-wide uppercase">Business</span>}
          {profileData?.isPublicFigure && <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-bold rounded-md tracking-wide uppercase">Public Figure</span>}
          {profileData?.isDigitalCreator && <span className="px-2 py-0.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[9px] font-bold rounded-md tracking-wide uppercase">Creator</span>}
          {profileData?.isGamer && <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold rounded-md tracking-wide uppercase">Gamer</span>}
          {profileData?.isTech && <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold rounded-md tracking-wide uppercase">Tech</span>}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 w-full max-w-sm">
          <button 
            onClick={handleFollowToggle}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all ${
              isFollowing ? 'bg-[#262626] text-boss-text border border-white/10' : 'bg-white text-black'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          
          <button 
            onClick={() => navigate('/chatbox', { state: { targetUser: { id: userId, name: profileData?.username } } })}
            className="flex-1 bg-[#1e3a8a] text-boss-text py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all border border-white/10"
          >
            <MessageCircle size={14} />
            Message
          </button>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="flex justify-around py-4 border-b border-white/5 bg-[#0b0e11]">
        <Stat number={userPosts.length} label="Posts" />
        <Stat 
          number={getShorthandStyle(Number(profileData?.inflatedFollowers || 0) + followerCount)} 
          label="Followers" 
          onClick={() => navigate(`/list/${userId}/followers`)}
        />
        <Stat 
          number={followingCount.toLocaleString()} 
          label="Following" 
          onClick={() => navigate(`/list/${userId}/following`)}
        />
      </div>

      {/* TAB BAR */}
      <div className="flex justify-around py-2 text-gray-500 border-b border-white/5">
        <Grid size={20} className="text-boss-text" />
        <Bookmark size={20} />
      </div>

      {/* POSTS GRID */}
      <div className="grid grid-cols-3 gap-0.5 mt-0.5">
        {userPosts.map(post => (
          <div 
            key={post.id} 
            onClick={() => post.image && setZoomedImage(post.image)}
            className="aspect-square bg-[#1a1a1a] overflow-hidden cursor-pointer active:opacity-70"
          >
            {post.image ? (
              <img src={post.image} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="p-2 text-[10px] text-gray-600 italic line-clamp-4">{post.text}</div>
            )}
          </div>
        ))}
      </div>

      {userPosts.length === 0 && (
        <div className="p-10 text-center">
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest italic">No posts yet</p>
        </div>
      )}

      {/* Full Screen Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-boss-bg flex items-center justify-center p-2"
          onClick={() => setZoomedImage(null)}
        >
          <X className="absolute top-6 right-6 text-boss-text" size={28} />
          <img src={zoomedImage} className="max-w-full max-h-[90vh] object-contain" alt="zoom" />
        </div>
      )}
    </div>
  );
}

function Stat({ number, label, onClick }) {
  return (
    <div className="text-center cursor-pointer active:opacity-50" onClick={onClick}>
      <p className="font-black text-sm leading-none">{number}</p>
      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter mt-1">{label}</p>
    </div>
  );
}

