import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { X, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StoryViewer = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const progressTimer = useRef(null);
  const STORY_DURATION = 15000; // 15 seconds for images

  // 1. Fetch Stories
  useEffect(() => {
    const fetchStories = async () => {
      const now = Date.now();
      const q = query(
        collection(db, "stories"),
        where("userId", "==", userId),
        where("expiresAt", ">", now),
        orderBy("expiresAt", "asc")
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (data.length === 0) navigate('/feed');
      setStories(data);
      setLoading(false);
    };
    fetchStories();
  }, [userId, navigate]);

  // 2. Handle Progress and Auto-Advance
  useEffect(() => {
    if (loading || isPaused || stories.length === 0) return;

    const interval = 100; // Update every 100ms
    progressTimer.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (interval / (stories[currentIndex].mediaType === 'video' ? 30000 : STORY_DURATION)) * 100;
      });
    }, interval);

    return () => clearInterval(progressTimer.current);
  }, [currentIndex, isPaused, loading, stories]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      navigate(-1); // Exit viewer when finished
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleTap = (e) => {
    const x = e.clientX;
    const width = window.innerWidth;
    if (x < width * 0.3) {
      handleBack();
    } else {
      handleNext();
    }
  };

  if (loading) return <div style={centerStyle}><Loader className="animate-spin" /></div>;

  const currentStory = stories[currentIndex];

  return (
    <div style={containerStyle}>
      {/* Progress Bars */}
      <div style={progressContainer}>
        {stories.map((_, i) => (
          <div key={i} style={progressBarBg}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: i === currentIndex ? `${progress}%` : i < currentIndex ? '100%' : '0%' }}
              style={progressBarFill}
            />
          </div>
        ))}
      </div>

      {/* Header Info */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={currentStory.profilePic} style={avatarStyle} alt="" />
          <span style={{ fontWeight: 'bold' }}>{currentStory.username}</span>
        </div>
        <X onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
      </div>

      {/* Interaction Area (Tapping and Holding) */}
      <div 
        style={interactionArea}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onClick={handleTap}
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentStory.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: '100%', height: '100%' }}
          >
            {currentStory.mediaType === 'video' ? (
              <video 
                src={currentStory.mediaUrl} 
                style={mediaStyle} 
                autoPlay 
                playsInline
                onEnded={handleNext}
              />
            ) : (
              <img src={currentStory.mediaUrl} style={mediaStyle} alt="" />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Styles ---
const containerStyle = { height: '100vh', backgroundColor: '#000', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const centerStyle = { height: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' };
const progressContainer = { position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 100 };
const progressBarBg = { flex: 1, height: '2px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' };
const progressBarFill = { height: '100%', background: '#fff' };
const headerStyle = { position: 'absolute', top: '25px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, color: '#fff' };
const avatarStyle = { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #fff' };
const interactionArea = { flex: 1, cursor: 'pointer', position: 'relative' };
const mediaStyle = { width: '100%', height: '100%', objectFit: 'contain' };

export default StoryViewer;
