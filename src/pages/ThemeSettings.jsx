import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

const ThemeSettings = () => {
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('bossnet-theme') || 'dark';
    setCurrentTheme(savedTheme);
    // Ensure the theme is applied to the root on mount
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const themes = [
    { id: 'dark', label: 'Dark Mode', desc: 'Classic Bossnet' },
    { id: 'light', label: 'Light Mode', desc: 'Clean & Bright' },
    { id: 'royal', label: 'Royal Gold', desc: 'Premium Luxury' },
    { id: 'midnight', label: 'Midnight', desc: 'Deep Space Blue' },
    { id: 'cyberpunk', label: 'Cyberpunk', desc: 'Neon Dreams' },
    { id: 'hacker', label: 'Matrix', desc: 'System Terminal' },
    { id: 'sahara', label: 'Sahara', desc: 'Sunset Vibes' },
    { id: 'ocean', label: 'Ocean', desc: 'Deep Sea Teal' },
    { id: 'amethyst', label: 'Amethyst', desc: 'Royal Purple' },
    { id: 'forest', label: 'Forest', desc: 'Nature Green' },
    { id: 'rose', label: 'Rose Gold', desc: 'Elegant Pink' },
    { id: 'slate', label: 'Slate', desc: 'Pro Metallic' },
    { id: 'crimson', label: 'Crimson', desc: 'Deep Red' },
    { id: 'coffee', label: 'Coffee', desc: 'Warm Roast' },
    { id: 'lavender', label: 'Lavender', desc: 'Soft & Calm' },
    { id: 'stealth', label: 'Stealth', desc: 'Absolute Black' },
  ];

  const handleThemeChange = (id) => {
    setCurrentTheme(id);
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem('bossnet-theme', id);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-sans transition-colors duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--bg-color)]/90 backdrop-blur-md z-10 flex items-center p-5 border-b-2 border-white/5">
        <button onClick={() => navigate(-1)} className="mr-6 active:scale-90 transition-transform">
          <ArrowLeft size={28} strokeWidth={3} />
        </button>
        <h1 className="text-2xl font-black tracking-tighter">Appearance</h1>
      </div>

      {/* Themes Grid */}
      <div className="mt-6 px-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-10">
        {themes.map((theme) => (
          <div 
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className={`flex items-center justify-between p-5 rounded-[24px] transition-all border-2 cursor-pointer
              ${currentTheme === theme.id 
                ? 'border-[var(--accent-color)] bg-white/10' 
                : 'border-white/5 bg-white/5 active:bg-white/10'
              }`}
          >
            <div className="flex-1">
              <p className="text-lg font-black tracking-tight">{theme.label}</p>
              <p className="text-xs opacity-60 font-bold uppercase tracking-wider">{theme.desc}</p>
            </div>
            
            {currentTheme === theme.id && (
              <div className="bg-[var(--accent-color)] p-1 rounded-full shadow-lg shadow-[var(--accent-color)]/20">
                <Check size={18} color="black" strokeWidth={4} />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-10 text-center opacity-30">
        <p className="text-[10px] font-black tracking-[5px] uppercase">Custom UI Engine v2.0</p>
      </div>
    </div>
  );
};

export default ThemeSettings;
