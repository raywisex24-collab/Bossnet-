import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Music, Smile, Type, Volume2, VolumeX, Download, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const EditorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('edit'); 
  const [isMuted, setIsMuted] = useState(false);
  const [showPicker, setShowPicker] = useState(false); // Controls the drawer
  const [overlays, setOverlays] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const videoRef = useRef(null);

  // Use the video you actually uploaded, or nothing if empty
  const videoUrl = location.state?.videoUrl || "";

  const addEmoji = (emoji) => {
    setOverlays([...overlays, { id: Date.now(), type: 'emoji', content: emoji.native, x: 150, y: 150 }]);
    setShowPicker(false);
  };

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' && currentText.trim() !== '') {
      setOverlays([...overlays, { id: Date.now(), type: 'text', content: currentText, x: 100, y: 100 }]);
      setCurrentText('');
      setIsTyping(false);
    }
  };

  const handleSave = () => {
    alert("Masterpiece saved to your device gallery! 🔥");
  };

  if (step === 'share') return <ShareScreen onBack={() => setStep('edit')} videoUrl={videoUrl} />;

  return (
    <div style={containerStyle}>
      <div style={glassHeader}>
        <ArrowLeft onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <span style={{ fontWeight: '700', fontSize: '14px' }}>EDIT VIDEO</span>
        <div style={{ width: 24 }} />
      </div>

      <div style={previewArea}>
        {videoUrl ? (
          <video ref={videoRef} src={videoUrl} loop autoPlay playsInline muted={isMuted} style={videoStyle} />
        ) : (
          <div style={{ color: '#555' }}>No video selected</div>
        )}
        
        {/* Render Draggable Stickers/Text */}
        {overlays.map(item => (
          <motion.div 
            drag 
            key={item.id} 
            style={{ 
              position: 'absolute', 
              zIndex: 10,
              cursor: 'grab', 
              fontSize: item.type === 'emoji' ? '50px' : '24px', 
              fontWeight: 'bold',
              textShadow: item.type === 'text' ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none'
            }}
          >
            {item.content}
          </motion.div>
        ))}

        {/* Real-time Text Input Overlay */}
        {isTyping && (
          <div style={textInputOverlay}>
            <input 
              autoFocus
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              onKeyDown={handleTextSubmit}
              placeholder="Type caption..."
              style={textInputField}
            />
          </div>
        )}
      </div>

      <div style={controlGrid}>
        <ToolBtn icon={<Music />} label="Music" onClick={() => document.getElementById('musicInput').click()} />
        <ToolBtn icon={<Smile />} label="Stickers" onClick={() => setShowPicker(!showPicker)} />
        <ToolBtn icon={<Type />} label="Text" onClick={() => setIsTyping(true)} />
        <ToolBtn icon={isMuted ? <VolumeX /> : <Volume2 />} label="Sound" onClick={() => setIsMuted(!isMuted)} />
        <ToolBtn icon={<Download />} label="Save" onClick={handleSave} />
        <input type="file" id="musicInput" hidden accept="audio/*" />
      </div>

      <div style={footer}>
        <button style={nextBtn} onClick={() => setStep('share')}>
          Next <ChevronRight size={18} />
        </button>
      </div>

      <AnimatePresence>
        {showPicker && (
          <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} style={drawerStyle}>
            <div style={drawerHeader}>
              <span>Emojis</span> | <span style={{ color: '#555' }}>GIFs (Coming Soon)</span>
            </div>
            <Picker data={data} onEmojiSelect={addEmoji} theme="dark" width="100%" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ShareScreen = ({ onBack, videoUrl }) => (
  <div style={containerStyle}>
    <div style={glassHeader}>
      <ArrowLeft onClick={onBack} />
      <span style={{ fontWeight: '700' }}>New reel</span>
      <div style={{ width: 24 }} />
    </div>
    
    <div style={{ padding: '20px' }}>
      <div style={captionBox}>
        <video src={videoUrl} style={{ width: 80, height: 120, borderRadius: 8, objectFit: 'cover' }} />
        <textarea placeholder="Add a caption..." style={textareaStyle} />
      </div>
      
      <div style={listOption}><span>@ Mention</span> <span># Hashtag</span></div>
      <div style={rowItem}>Tag people <ChevronRight size={16} /></div>
      <div style={rowItem}>Add location <ChevronRight size={16} /></div>
      
      <button style={shareBtn}>Share</button>
    </div>
  </div>
);

// --- Styles ---
const containerStyle = { backgroundColor: '#000', height: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' };
const glassHeader = { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' };
const previewArea = { flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const videoStyle = { width: '100%', borderRadius: '15px' };
const controlGrid = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', padding: '15px', background: 'rgba(255,255,255,0.02)' };
const footer = { padding: '20px', display: 'flex', justifyContent: 'flex-end' };
const nextBtn = { backgroundColor: '#0095f6', color: 'white', padding: '12px 30px', borderRadius: '25px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' };
const shareBtn = { width: '100%', backgroundColor: '#0095f6', color: 'white', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', marginTop: '40px' };
const drawerStyle = { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: '#111' };
const drawerHeader = { padding: '10px', textAlign: 'center', borderBottom: '1px solid #222', fontSize: '12px' };
const captionBox = { display: 'flex', gap: '15px', marginBottom: '30px' };
const textareaStyle = { background: 'none', border: 'none', color: '#fff', flex: 1, resize: 'none', outline: 'none' };
const rowItem = { padding: '15px 0', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', color: '#ccc' };
const listOption = { display: 'flex', gap: '10px', marginBottom: '20px' };

const textInputOverlay = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20 };
const textInputField = { background: 'none', border: 'none', color: 'white', fontSize: '24px', fontWeight: 'bold', textAlign: 'center', outline: 'none', width: '80%' };

const ToolBtn = ({ icon, label, onClick }) => (
  <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>
    {icon} <span style={{ fontSize: '10px' }}>{label}</span>
  </div>
);

export default EditorPage;
