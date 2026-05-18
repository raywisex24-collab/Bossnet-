import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, where } from 'firebase/firestore';
import { 
  ChevronLeft, Bell, Heart, MessageSquare, UserPlus, 
  Clock, CheckCircle, Repeat, Bookmark, Mail, Megaphone, Trash2 // 👈 Verified Trash2 is appended here
} from 'lucide-react';
import VerifiedBadge from './VerifiedBadge'; 

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    const notifRef = collection(db, "notifications");
    const q = query(notifRef, orderBy("createdAt", "desc")); 

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dismissedGlobals = JSON.parse(localStorage.getItem('dismissed_global_notifs') || '[]');
      
      const notifData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(notif => {
          // 1. Must belong to current user or be designated public
          const isTargeted = notif.toUserId === user.uid || notif.toUserId === "all";
          // 2. Must not be present inside local dismissal array store keys
          const isLocallyDismissed = dismissedGlobals.includes(notif.id);
          return isTargeted && !isLocallyDismissed;
        });

      setNotifications(notifData);
      setLoading(false);
    }, (error) => {
      console.error("Listener failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleNotifClick = async (notif) => {
    try {
      const ref = doc(db, "notifications", notif.id);
      await updateDoc(ref, { read: true });
    } catch (err) {
      console.error("Error marking read:", err);
    }

    // Comprehensive Navigation Logic
    switch (notif.type) {
      case 'like':
      case 'comment':
      case 'reshare':
      case 'save':
        if (notif.postId) navigate(`/post/${notif.postId}`);
        break;
      
      case 'reel_like':
      case 'reel_comment':
      case 'reel_save':
        // Navigates to reels page. If you have a specific reel ID, use navigate(`/reels/${notif.reelId}`)
        navigate(`/reels`); 
        break;

      case 'follow':
      case 'verified':
      case 'system_alert':
        if (notif.fromUserId) navigate(`/profile/${notif.fromUserId}`);
        else if (notif.link) navigate(notif.link); // For custom system links
        break;

      case 'new_message':
        navigate(`/chatbox`);
        break;

      case 'announcement':
        if (notif.link) {
          navigate(notif.link);
        } else {
          navigate('/feed'); // 👈 Directs them to the main feed to read the top banner asset
        }
        break;

      default:
        // Fallback: If there's a post ID, go to post, otherwise go to profile
        if (notif.postId) navigate(`/post/${notif.postId}`);
        else if (notif.fromUserId) navigate(`/profile/${notif.fromUserId}`);
    }
  };

  const markAllRead = async () => {
    if (!notifications.some(n => !n.read)) return;
    const batch = writeBatch(db);
    notifications.forEach((n) => {
      if (!n.read) {
        const ref = doc(db, "notifications", n.id);
        batch.update(ref, { read: true });
      }
    });
    await batch.commit();
  };

  const deleteNotification = async (notif, e) => {
    e.stopPropagation(); // Stops routing from clicking the underlying parent card layout
    try {
      if (notif.toUserId === "all") {
        // Global system announcement: Hide it locally on this client instance only
        const hiddenNotifs = JSON.parse(localStorage.getItem('dismissed_global_notifs') || '[]');
        hiddenNotifs.push(notif.id);
        localStorage.setItem('dismissed_global_notifs', JSON.stringify(hiddenNotifs));
        
        // Re-filter UI array dynamically so it drops off without a hard page reload
        setNotifications(prev => prev.filter(n => n.id !== notif.id));
      } else {
        // Personal normal notification: Wipe it out of Firestore database fully
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, "notifications", notif.id));
      }
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to clear your notifications log, boss?")) return;
    
    try {
      const batch = writeBatch(db);
      const hiddenNotifs = JSON.parse(localStorage.getItem('dismissed_global_notifs') || '[]');
      let containsFirestoreDeletes = false;

      notifications.forEach((n) => {
        if (n.toUserId === "all") {
          // Track locally to hide from view
          hiddenNotifs.push(n.id);
        } else {
          // Personal item: Package it to be wiped from production Firestore paths
          const ref = doc(db, "notifications", n.id);
          batch.delete(ref);
          containsFirestoreDeletes = true;
        }
      });

      localStorage.setItem('dismissed_global_notifs', JSON.stringify(hiddenNotifs));
      
      if (containsFirestoreDeletes) {
        await batch.commit();
      } else {
        // If there were only global alerts, manually empty the view state
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error running batch clear setup:", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={10} className="text-boss-text fill-red-500" />; // 👈 Split out clean target return
      case 'announcement': return <Megaphone size={10} className="text-purple-400 fill-purple-950/20" />; 
      case 'reel_like': return <Heart size={10} className="text-boss-text fill-red-500" />;
      case 'comment': 
      case 'reel_comment': return <MessageSquare size={10} className="text-boss-text fill-blue-500" />;
      case 'follow': return <UserPlus size={10} className="text-boss-text fill-green-500" />;
      case 'reshare': return <Repeat size={10} className="text-boss-text text-emerald-400" />;
      case 'save': 
      case 'reel_save': return <Bookmark size={10} className="text-boss-text fill-yellow-500" />;
      case 'verified': return <CheckCircle size={10} className="text-boss-text fill-blue-400" />;
      case 'new_message': return <Mail size={10} className="text-boss-text fill-indigo-500" />;
      default: return <Bell size={10} className="text-boss-text" />;
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "Just now";
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "Just now";
    }
  };

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-boss-bg/80 backdrop-blur-xl border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Notifications</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* DYNAMIC MARK ALL READ BUTTON */}
          <button 
            onClick={markAllRead}
            disabled={!notifications.some(n => !n.read)}
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${
              notifications.some(n => !n.read) 
                ? 'text-blue-500 bg-blue-500/10 active:bg-blue-500/20' 
                : 'text-zinc-500 bg-zinc-800/40 cursor-not-allowed'
            }`}
          >
            Read All
          </button>

          {/* CLEAR ALL ACTIONS BUTTON */}
          {notifications.length > 0 && (
            <button 
              onClick={clearAllNotifications}
              className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full active:bg-red-500/20"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="p-2 space-y-1">
        {loading ? (
          <div className="flex justify-center mt-20 animate-pulse text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => handleNotifClick(notif)}
              className={`flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer ${
                notif.read ? 'opacity-60' : 'bg-zinc-900/40 border border-white/5 shadow-lg'
              }`}
            >
              <div className="relative">
                <img 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (notif.fromUserId) navigate(`/profile/${notif.fromUserId}`);
                  }}
                  src={notif.fromUserImg || '/bossnet-logo.png'} // Use your app logo for system notifs
                  className="w-12 h-12 rounded-full object-cover border border-white/10" 
                  alt="" 
                />
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-boss-bg border border-white/10">
                  {getIcon(notif.type)}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1 leading-snug">
                  <span className="font-bold text-boss-text">{notif.fromUsername || 'BossNet System'}</span>
                  {notif.isVerified && <VerifiedBadge isVerified={true} />} 
                  
                  <span className="text-zinc-400"> 
                    {notif.type === 'like' && ' liked your post'}
                    {notif.type === 'comment' && ` replied: "${notif.text}"`}
                    {notif.type === 'follow' && ' started following you'}
                    {notif.type === 'reshare' && ' reshared your post to their feed'}
                    {notif.type === 'save' && ' added your post to their favorites'}
                    {notif.type === 'verified' && ' Your account has been officially verified!'}
                    {notif.type === 'new_message' && ' sent you a new message'}
                    {notif.type === 'reel_like' && ' liked your reel'}
                    {notif.type === 'reel_comment' && ' commented on your reel'}
                    {notif.type === 'reel_save' && ' saved your reel'}
                    {notif.type === 'announcement' && ` issued a global broadcast: "${notif.text}"`}
                    {/* Catch-all for System or unknown notifications */}
                    {!['like', 'comment', 'follow', 'reshare', 'save', 'verified', 'new_message', 'reel_like', 'reel_comment', 'reel_save', 'announcement'].includes(notif.type) && ` ${notif.text || 'Notification received'}`}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 mt-1 text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">
                   <Clock size={10} />
                   {formatTime(notif.createdAt)}
                </div>
              </div>

              {/* INTERACTION STATUS AND REMOVAL GROUP CONTAINER */}
              <div className="flex items-center gap-3">
                {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6] shrink-0" />}
                
                <button 
                  onClick={(e) => deleteNotification(notif, e)}
                  className="p-2 text-zinc-600 hover:text-red-400 rounded-full transition-colors active:scale-75 hover:bg-white/5 shrink-0"
                  title="Remove alert record"
                >
                  {/* Trash2 handles look variations gracefully inside your existing bundle */}
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center mt-20">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Bell size={24} className="text-zinc-700" />
            </div>
            <p className="text-zinc-500 text-sm font-medium">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

