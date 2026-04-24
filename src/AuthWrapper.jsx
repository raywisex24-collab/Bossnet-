import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
// ✅ Keep your imports matching your folder structure
import PreSplash from './pages/PreSplash';
import Splash from './pages/Splash';

export default function AuthWrapper({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [splashStep, setSplashStep] = useState('none');

  // Function to run the animation sequence
  const runSplashSequence = async () => {
    setSplashStep('pre');
    await new Promise(r => setTimeout(r, 2000)); 
    
    setSplashStep('main');
    await new Promise(r => setTimeout(r, 2000)); 
    
    sessionStorage.setItem('bossnet_needs_refresh', 'true');
    setSplashStep('none');
    setLoading(false);
  };

  useEffect(() => {
    // Logic to check if enough time has passed
    const checkTimeAndSplash = () => {
      const lastActive = localStorage.getItem('bossnet_last_active');
      const now = Date.now();
      
      // ✅ CHANGE THIS TO (20 * 60 * 1000) LATER
      const testTime = 20 * 60 * 1000; 

      if (lastActive && (now - parseInt(lastActive)) > testTime) {
        runSplashSequence();
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Run check when the page first loads/refreshes
        checkTimeAndSplash();
        setLoading(false); 
      } else {
        setLoading(false);
      }
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // User leaves: Save the time
        localStorage.setItem('bossnet_last_active', Date.now().toString());
      } else if (document.visibilityState === 'visible') {
        // User comes back: Check time immediately!
        if (auth.currentUser) {
          checkTimeAndSplash();
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // --- RENDERING ---
  if (splashStep === 'pre') return <PreSplash />;
  if (splashStep === 'main') return <Splash />;
  if (loading) return <div className="bg-[#0b0e11] h-screen" />; 

  return children;
}

