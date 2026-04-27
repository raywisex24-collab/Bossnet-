import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Camera, Video, Loader, Plus, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const UploadStory = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const IMGBB_API_KEY = "fa575203bc672f5b48b5eccc5d59185b";
  const CLOUDINARY_NAME = "di0zt85jy";
  const CLOUDINARY_PRESET = "bossnet_uploads"; // Use your existing preset

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Video Time Restriction Check
    if (selectedFile.type.startsWith('video')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 120) {
          Swal.fire({ title: 'TOO LONG', text: 'Videos must be under 2 minutes', icon: 'error', background: '#111', color: '#fff' });
          return;
        }
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
      };
      video.src = URL.createObjectURL(selectedFile);
    } else {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    return data.data.url;
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/video/upload`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handlePostStory = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const user = auth.currentUser;
      let mediaUrl = "";
      const isVideo = file.type.startsWith('video');

      if (isVideo) {
        mediaUrl = await uploadToCloudinary(file);
      } else {
        mediaUrl = await uploadToImgBB(file);
      }

      // Calculate expiration (24 hours from now)
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000);

      await addDoc(collection(db, "stories"), {
        userId: user.uid,
        username: user.displayName || "Raywise",
        profilePic: user.photoURL || "",
        mediaUrl,
        mediaType: isVideo ? 'video' : 'image',
        createdAt: serverTimestamp(),
        expiresAt: expiresAt, // For the 24h logic
      });

      Swal.fire({ title: 'STORY ACTIVE!', icon: 'success', background: '#111', color: '#fff', timer: 1500 });
      navigate('/profile');
    } catch (err) {
      Swal.fire({ title: 'ERROR', text: err.message, icon: 'error', background: '#111', color: '#fff' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <X onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <span style={{ fontWeight: '900', letterSpacing: '2px' }}>ADD TO STORY</span>
        <div style={{ width: 24 }} />
      </div>

      <div style={previewContainer}>
        {preview ? (
          file.type.startsWith('video') ? (
            <video src={preview} style={mediaStyle} autoPlay loop muted />
          ) : (
            <img src={preview} style={mediaStyle} alt="Story Preview" />
          )
        ) : (
          <div onClick={() => fileInputRef.current.click()} style={placeholderStyle}>
            <div style={iconCircle}><Plus size={40} /></div>
            <p style={{ marginTop: '15px', fontSize: '12px', color: '#888' }}>TAP TO SELECT MEDIA</p>
            <p style={{ fontSize: '10px', color: '#444' }}>MAX 2 MINUTES FOR VIDEOS</p>
          </div>
        )}
      </div>

      <input type="file" hidden ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" />

      <div style={footerStyle}>
        {file && (
          <button onClick={handlePostStory} disabled={loading} style={postBtnStyle}>
            {loading ? <Loader className="animate-spin" /> : "POST STORY"}
          </button>
        )}
      </div>
    </div>
  );
};

const containerStyle = { height: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', flexDirection: 'column' };
const headerStyle = { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #111' };
const previewContainer = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const mediaStyle = { width: '100%', height: '100%', objectFit: 'contain', borderRadius: '15px' };
const placeholderStyle = { textAlign: 'center', cursor: 'pointer' };
const iconCircle = { width: '80px', height: '80px', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '1px dashed #333' };
const footerStyle = { padding: '30px', display: 'flex', justifyContent: 'center' };
const postBtnStyle = { background: '#fff', color: '#000', padding: '15px 60px', borderRadius: '30px', fontWeight: '900', border: 'none', cursor: 'pointer' };

export default UploadStory;
