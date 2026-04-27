import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function StoryAvatar({ userId, profilePic, size = "40px" }) {
  const [hasStory, setHasStory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStory = async () => {
      const now = Date.now();
      const q = query(
        collection(db, "stories"),
        where("userId", "==", userId),
        where("expiresAt", ">", now)
      );
      const snap = await getDocs(q);
      setHasStory(!snap.empty);
    };
    if (userId) checkStory();
  }, [userId]);

  const handleClick = () => {
    if (hasStory) {
      navigate(`/story-viewer/${userId}`);
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="relative flex items-center justify-center cursor-pointer transition-transform active:scale-95"
      style={{
        width: size,
        height: size,
        padding: '2px',
        background: hasStory ? 'linear-gradient(to right, #f39c12, #e67e22, #9b59b6)' : 'transparent',
        borderRadius: '50%',
      }}
    >
      <img 
        src={profilePic || 'https://via.placeholder.com/150'} 
        className="w-full h-full rounded-full object-cover border-2 border-black bg-zinc-800"
        alt="avatar"
      />
    </div>
  );
}
