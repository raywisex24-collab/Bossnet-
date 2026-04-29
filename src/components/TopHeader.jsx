import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, BadgeCheck } from 'lucide-react';
import { auth, db } from '../firebase'; 
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';

export default function TopHeader() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ username: 'Loading...', isVerified: false });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // 1. User Data Listener
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData({
              username: docSnap.data().username || 'User',
              isVerified: docSnap.data().isVerified || false 
            });
          }
        });

        // 2. Notifications Unread Listener
        const qNotify = query(
          collection(db, "notifications"), 
          where("toUserId", "==", user.uid),
          where("read", "==", false)
        );
        const unsubscribeNotify = onSnapshot(qNotify, (snap) => {
          setUnreadNotifications(snap.size);
        });

        // 3. FIXED: Chat Unread Listener
        // We query all chats where the user is a participant
        const qChat = query(
          collection(db, "chats"), 
          where("participants", "array-contains", user.uid)
        );
        
        const unsubscribeChat = onSnapshot(qChat, (snap) => {
          let totalMessages = 0;
          snap.docs.forEach(doc => {
            const data = doc.data();
            // Sum the specific unread count for the current user
            if (data.unreadCount && data.unreadCount[user.uid]) {
              totalMessages += data.unreadCount[user.uid];
            }
          });
          setUnreadMessages(totalMessages);
        });

        return () => {
          unsubscribeDoc();
          unsubscribeNotify();
          unsubscribeChat();
        };
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-5 z-[100] bg-boss-bg/60 backdrop-blur-2xl border-b border-white/10 shadow-lg">
      
      <div className="flex items-center gap-1.5 max-w-[60%]">
        <h1 className="text-boss-text font-bold text-lg tracking-tight truncate">
          {userData.username}
        </h1>
        {userData.isVerified && (
          <BadgeCheck size={18} className="text-blue-500 fill-blue-500/20 flex-shrink-0" />
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notification Bell with Badge */}
        <button 
          onClick={() => navigate('/notifications')} 
          className="relative p-1.5 active:scale-90 transition-all hover:bg-white/5 rounded-full"
        >
          <Bell size={22} className="text-boss-text" strokeWidth={2.5} />
          {unreadNotifications > 0 && (
            <div className="absolute top-1 right-1 flex items-center justify-center min-w-[14px] h-[14px] px-1 bg-red-600 rounded-full border border-black text-[8px] font-bold text-boss-text animate-pulse">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </div>
          )}
        </button>
        
        {/* Chat Icon with Badge */}
        <button 
          onClick={() => navigate('/chatbox')} 
          className="relative p-1.5 active:scale-90 transition-all hover:bg-white/5 rounded-full"
        >
          <MessageCircle size={22} className="text-boss-text" strokeWidth={2.5} />
          {unreadMessages > 0 && (
            <div className="absolute top-1 right-1 flex items-center justify-center min-w-[14px] h-[14px] px-1 bg-blue-500 rounded-full border border-black text-[8px] font-bold text-boss-text animate-pulse">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

