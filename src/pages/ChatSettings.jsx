import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ChevronLeft, Image, Palette, Trash2, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatSettings() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeChat, setActiveChat] = useState(location.state?.activeChat || null);
  const [settings, setSettings] = useState({ themeColor: '#2563eb', wallpaper: '' });
  const [uploading, setUploading] = useState(false);

  const IMGBB_API_KEY = 'fa575203bc672f5b48b5eccc5d59185b';
  const currentUser = auth.currentUser;
  const chatId = currentUser ? [currentUser.uid, userId].sort().join('_') : null;

  const colorPresets = [
    '#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#db2777', '#0891b2'
  ];

  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(doc(db, "chatSettings", chatId), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });
    return () => unsub();
  }, [chatId]);

  const updateTheme = async (color) => {
    await setDoc(doc(db, "chatSettings", chatId), { themeColor: color }, { merge: true });
  };

  const handleWallpaperUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        await setDoc(doc(db, "chatSettings", chatId), { wallpaper: data.data.url }, { merge: true });
      }
    } catch (err) {
      console.error("Wallpaper upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const clearWallpaper = async () => {
    await updateDoc(doc(db, "chatSettings", chatId), { wallpaper: "" });
  };

  return (
    <div className="fixed inset-0 bg-[#0b0e11] text-white z-[500] flex flex-col font-sans">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 border-b border-white/5 bg-[#16191d]">
        <ChevronLeft onClick={() => navigate(-1)} className="cursor-pointer" />
        <h1 className="text-lg font-black italic uppercase">Chat Customization</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Theme Color Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Palette size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Bubble Color</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {colorPresets.map((color) => (
              <button
                key={color}
                onClick={() => updateTheme(color)}
                style={{ backgroundColor: color }}
                className="h-12 rounded-2xl flex items-center justify-center transition-transform active:scale-90"
              >
                {settings.themeColor === color && <Check size={20} className="text-white" />}
              </button>
            ))}
          </div>
        </section>

        {/* Wallpaper Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Image size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Chat Wallpaper</span>
          </div>
          
          <div className="relative group">
            <div className="w-full h-48 bg-[#16191d] rounded-3xl overflow-hidden border border-white/5 flex items-center justify-center relative">
              {settings.wallpaper ? (
                <img src={settings.wallpaper} className="w-full h-full object-cover opacity-60" alt="Preview" />
              ) : (
                <span className="text-gray-600 text-sm italic">No Wallpaper Set</span>
              )}
              
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="animate-spin text-blue-500" />
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <label className="flex-1 bg-blue-600 text-center py-3 rounded-2xl font-bold cursor-pointer active:scale-95 transition-transform">
                {settings.wallpaper ? 'Change Wallpaper' : 'Set Wallpaper'}
                <input type="file" className="hidden" onChange={handleWallpaperUpload} accept="image/*" />
              </label>
              
              {settings.wallpaper && (
                <button 
                  onClick={clearWallpaper}
                  className="p-3 bg-red-500/10 text-red-500 rounded-2xl active:scale-95"
                >
                  <Trash2 size={24} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Live Preview Hint */}
        <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
          <p className="text-[10px] text-blue-400 font-bold uppercase text-center">Changes are applied instantly, boss!</p>
        </div>
      </div>
    </div>
  );
}
