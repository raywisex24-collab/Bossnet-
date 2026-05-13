import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PreSplash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/splash');
    }, 2500); 
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between py-24 bg-[#0b0e11]">
      {/* Logo Container - Shrunken for Mobile */}
      <div className="flex-1 flex items-center justify-center p-6">
        <img 
          src="https://i.postimg.cc/rynvWCgF/file-00000000f6e471fd85be551554c14ba5.png" 
          alt="Logo" 
          className="w-full h-full object-contain max-w-[200px]" 
        />
      </div>

      {/* Text Container */}
      <div className="w-full max-w-[500px] text-center px-6">
        <h1 className="text-5xl font-black mb-3 tracking-tighter">
          <span 
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(to right, #9b59b6, #3498db, #e67e22, #f1c40f)',
              WebkitBackgroundClip: 'text'
            }}
          >
            Bossnet
          </span>
        </h1>
        <p className="text-sm font-bold text-zinc-400 tracking-[0.3em] uppercase">
          Connect, Innovate, and Lead.
        </p>
      </div>
    </div>
  );
}

