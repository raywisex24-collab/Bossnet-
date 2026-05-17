import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Megaphone, X } from 'lucide-react';

export default function BroadcastBanner() {
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Queries the announcements collection for the single most recent document entry
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const announcementId = snapshot.docs[0].id;
        
        // Check if the user has already manually closed this specific alert ticket session
        const dismissedId = localStorage.getItem('dismissed_announcement_id');
        
        if (dismissedId !== announcementId) {
          setLatestAnnouncement({ id: announcementId, ...data });
          setIsVisible(true);
        }
      } else {
        setLatestAnnouncement(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDismiss = () => {
    if (latestAnnouncement) {
      localStorage.setItem('dismissed_announcement_id', latestAnnouncement.id);
    }
    setIsVisible(false);
  };

  if (!latestAnnouncement || !isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-purple-900/90 via-indigo-950/90 to-purple-900/90 border-b border-purple-500/30 text-white px-4 py-3 relative flex items-center justify-between animate-in slide-in-from-top duration-300 z-[100] backdrop-blur-md">
      <div className="flex items-center gap-3 pr-8 max-w-xl mx-auto w-full">
        <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg shrink-0 animate-pulse">
          <Megaphone size={16} />
        </div>
        <div className="overflow-hidden w-full">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-0.5">System Alert</p>
          <p className="text-sm font-medium text-zinc-100 leading-snug tracking-wide truncate md:whitespace-normal">
            {latestAnnouncement.text}
          </p>
        </div>
      </div>
      
      {/* Manual Banner Dismissal Control Button */}
      <button 
        onClick={handleDismiss} 
        className="absolute right-3 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all"
      >
        <X size={16} />
      </button>
    </div>
  );
}
