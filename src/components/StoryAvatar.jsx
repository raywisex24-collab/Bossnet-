import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function StoryAvatar({ userId, profilePic, size = "40px" }) {
  const [hasUnseenStory, setHasUnseenStory] = useState(false);
  const navigate = useNavigate();
  
  const defaultPic = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238a8d91"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!userId || !currentUser) return;

    const now = Date.now();
    // 1. Listen for active stories from this user
    const qStories = query(
      collection(db, "stories"),
      where("userId", "==", userId),
      where("expiresAt", ">", now)
    );

    const unsubscribe = onSnapshot(qStories, (storySnap) => {
      if (storySnap.empty) {
        setHasUnseenStory(false);
        return;
      }

      const storyIds = storySnap.docs.map(d => d.id);

      // 2. Check if current user has viewed ALL these stories
      const qViews = query(
        collection(db, "storyViews"),
        where("viewerId", "==", currentUser.uid),
        where("storyId", "in", storyIds)
      );

      // We use another onSnapshot to keep it real-time
      onSnapshot(qViews, (viewSnap) => {
        // If the number of views is less than the number of active stories, show the ring
        setHasUnseenStory(viewSnap.size < storyIds.length);
      });
    });

    return () => unsubscribe();
  }, [userId]);

  const handleClick = () => {
    // Navigate to viewer if there are stories (seen or unseen), else go to profile
    if (hasUnseenStory) {
      navigate(`/story-viewer/${userId}`);
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="relative flex items-center justify-center cursor-pointer transition-all active:scale-90"
      style={{
        width: size,
        height: size,
        padding: hasUnseenStory ? '2.5px' : '0px',
        background: hasUnseenStory 
          ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' 
          : 'transparent',
        borderRadius: '50%',
      }}
    >
      <div className="w-full h-full rounded-full bg-[#0b0e11] p-[1.5px]">
        <img 
          src={profilePic || defaultPic} 
          className="w-full h-full rounded-full object-cover bg-zinc-800"
          alt="avatar"
          onError={(e) => { e.target.src = defaultPic; }}
        />
      </div>
    </div>
  );
}
