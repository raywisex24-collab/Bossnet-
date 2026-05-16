import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import VerifiedBadge from './VerifiedBadge';

export default function LiveUserHeader({ userId, fallbackName, className = "" }) {
  const [liveUser, setLiveUser] = useState(null);

  useEffect(() => {
    if (!userId) return;
    // Set up a real-time listener directly on the user's account document
    const unsub = onSnapshot(doc(db, "users", userId), (docSnap) => {
      if (docSnap.exists()) {
        setLiveUser(docSnap.data());
      }
    });
    return () => unsub();
  }, [userId]);

  // Use live data if loaded; otherwise, use the historical document values
  const currentUsername = liveUser?.username || fallbackName || "...";
  const isVerified = liveUser?.isVerified || false;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <h4 className="font-bold text-sm text-boss-text">{currentUsername}</h4>
      <VerifiedBadge isVerified={isVerified} />
    </div>
  );
}

