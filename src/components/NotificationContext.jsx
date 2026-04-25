import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const navigate = useNavigate();
  const [latestNotif, setLatestNotif] = useState(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // --- REGULAR NOTIFICATIONS LISTENER ---
        const qNotif = query(
          collection(db, "notifications"),
          where("toUserId", "==", user.uid),
          where("read", "==", false),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const unsubscribeNotifs = onSnapshot(qNotif, (snapshot) => {
          if (!snapshot.empty) {
            const notifDoc = snapshot.docs[0];
            new Audio('/notification.wav').play().catch(() => {});
            setLatestNotif({ id: notifDoc.id, ...notifDoc.data() });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
          }
        });

        return () => {
          unsubscribeNotifs();
        };
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Handlers for Regular Notifications
  const handleToastClick = async () => {
    if (!latestNotif) return;
    try {
      await updateDoc(doc(db, "notifications", latestNotif.id), { read: true });
      setShowToast(false);
      if (latestNotif.postId) navigate(`/post/${latestNotif.postId}`);
      else if (latestNotif.fromUserId) navigate(`/profile/${latestNotif.fromUserId}`);
    } catch (err) { console.error(err); }
  };

  return (
    <NotificationContext.Provider value={{}}>
      {children}
      
      {/* 1. REGULAR NOTIFICATION TOAST (APPLE STYLE) */}
      {showToast && latestNotif && (
        <div className="fixed top-4 inset-x-0 z-[9999] flex justify-center px-4 pointer-events-none">
          <div 
            onClick={handleToastClick}
            className="pointer-events-auto w-full max-w-[380px] bg-[#1c1c1e]/90 backdrop-blur-2xl border border-white/10 rounded-[28px] p-3 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-full duration-500"
          >
            {/* User Profile Picture */}
            <img 
              src={latestNotif.fromUserImg || "/default-avatar.png"} 
              className="w-12 h-12 rounded-[14px] object-cover border border-white/5" 
              alt="notif-pfp" 
            />
            
            <div className="flex-1 overflow-hidden">
               <div className="flex items-center gap-1">
                 <span className="text-[10px] font-black text-[#1877F2] uppercase tracking-wider">BossNet</span>
                 <span className="text-[10px] text-zinc-500">• now</span>
               </div>
               
               {/* User's Name */}
               <p className="text-[14px] text-boss-text font-bold truncate">
                 {latestNotif.fromUsername || "Someone"}
               </p>
               
               {/* Dynamic Notification Text */}
               <p className="text-[12px] text-zinc-300 truncate">
                {latestNotif.type === 'like' ? 'Liked your post' : 
                 latestNotif.type === 'comment' ? (latestNotif.text || 'Commented on your post') : 
                 latestNotif.type === 'follow' ? 'Started following you' :
                 latestNotif.text || 'New notification'}
               </p>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

