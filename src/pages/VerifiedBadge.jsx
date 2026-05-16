import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function VerifiedBadge({ isVerified, userId }) {
  const [liveVerified, setLiveVerified] = useState(null);

  useEffect(() => {
    // If there's no userId passed down, fall back to the initial snapshot prop
    if (!userId) return;

    // Listen to the post creator's real-time user document status
    const unsub = onSnapshot(doc(db, "users", userId), (snapshot) => {
      if (snapshot.exists()) {
        setLiveVerified(snapshot.data().isVerified || false);
      }
    });

    return () => unsub();
  }, [userId]);

  // Use the live database status if available; otherwise, drop back to the snapshot prop
  const finalStatus = liveVerified !== null ? liveVerified : isVerified;

  if (!finalStatus) return null;

  return (
    <svg 
      viewBox="0 0 24 24" 
      className="w-[14px] h-[14px] fill-[#0095f6] ml-1 flex-shrink-0"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z" />
    </svg>
  );
}

