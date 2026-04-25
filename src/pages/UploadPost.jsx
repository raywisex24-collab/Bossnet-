import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { 
  X, ChevronLeft, Music, Type, Sticker, Filter, 
  Hash, AtSign, Users, MapPin, Settings, CheckCircle, Plus 
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function UploadPost() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isMultiple, setIsMultiple] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]); // Blobs for preview
  const [imageFiles, setImageFiles] = useState([]); // Real files for upload
  const [previewImage, setPreviewImage] = useState(null); 
  const [caption, setCaption] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState(null);

  // Fetch current user data for the post metadata
  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setUserData(userDoc.data());
      }
    };
    fetchUser();
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setImageFiles(prev => isMultiple ? [...prev, ...files] : [files[0]]);
    
    const newUrls = files.map(f => URL.createObjectURL(f));
    if (isMultiple) {
      setSelectedImages(prev => [...prev, ...newUrls]);
      setPreviewImage(newUrls[newUrls.length - 1]);
    } else {
      setSelectedImages([newUrls[0]]);
      setPreviewImage(newUrls[0]);
    }
  };

  const uploadToImgBB = async (file) => {
    const apiKey = "fa575203bc672f5b48b5eccc5d59185b"; // Get this from https://api.imgbb.com/
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data.data.url;
  };

  const handlePost = async () => {
    if (!imageFiles.length) return;
    
    setUploading(true);
    Swal.fire({ 
        title: 'Sharing to Bossnet...', 
        html: 'Uploading high-quality media...',
        background: '#121212',
        color: '#fff',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading() 
    });

    try {
      const user = auth.currentUser;
      // 1. Upload first image to ImgBB
      const uploadedImageUrl = await uploadToImgBB(imageFiles[0]);

      // 2. Save to Firestore
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        username: userData?.username || user.displayName || "Bossnet User",
        userImg: userData?.profilePic || user.photoURL || "",
        text: caption,
        image: uploadedImageUrl,
        likes: [], // Important: prevents the blank screen crash
        privacy: privacy,
        createdAt: serverTimestamp(),
        isVerified: userData?.isVerified || false
      });

      Swal.fire({
        icon: 'success',
        title: 'Post shared!',
        showConfirmButton: false,
        timer: 1500,
        background: '#121212',
        color: '#fff',
      });

      navigate('/feed');
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire("Error", "Could not share post. Check your connection.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text font-sans overflow-hidden">
      <header className="h-14 flex items-center justify-between px-4 border-b border-zinc-900 bg-boss-bg sticky top-0 z-50">
        {step === 1 ? (
          <X onClick={() => navigate('/feed')} className="cursor-pointer" />
        ) : (
          <ChevronLeft onClick={() => setStep(step - 1)} className="cursor-pointer" />
        )}
        
        {step === 1 && (
          <div className="flex gap-4 font-black uppercase text-sm tracking-widest text-zinc-500">
            <span className="text-boss-text border-b-2 border-white pb-1">POST</span>
            <span onClick={() => navigate('/upload-reel')} className="cursor-pointer">REEL</span>
            <span className="opacity-30">STORY</span>
          </div>
        )}

        {step === 3 ? (
          <h2 className="font-bold">New post</h2>
        ) : (
          <button 
            onClick={() => setStep(step + 1)} 
            disabled={selectedImages.length === 0 || uploading} 
            className="text-[#1877F2] font-bold text-lg disabled:opacity-50"
          >
            Next
          </button>
        )}
      </header>

      {step === 1 && (
        <div className="flex flex-col h-[calc(100vh-56px)]">
          <div className="flex-1 bg-boss-bg flex items-center justify-center overflow-hidden border-b border-zinc-900">
            {previewImage ? (
              <img src={previewImage} className="max-h-full w-full object-contain" alt="Preview" />
            ) : (
              <div className="text-zinc-800 font-black text-4xl italic tracking-tighter">BOSSNET</div>
            )}
          </div>
          
          <div className="p-4 bg-zinc-950 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-lg">
              Gallery <ChevronLeft className="-rotate-90 text-zinc-500" size={16}/>
            </div>
            <button 
              onClick={() => {
                setIsMultiple(!isMultiple);
                if(isMultiple) { setSelectedImages([]); setImageFiles([]); }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black transition-all ${isMultiple ? 'bg-[#1877F2] text-boss-text' : 'bg-zinc-800 text-zinc-400'}`}
            >
              SELECT MULTIPLE
            </button>
          </div>

          <div className="grid grid-cols-4 gap-0.5 p-0.5 h-72 overflow-y-auto bg-zinc-900">
            <label className="aspect-square bg-zinc-800 flex items-center justify-center cursor-pointer hover:bg-zinc-700 transition-colors">
               <Plus className="text-zinc-500" size={32} />
               <input type="file" hidden multiple={isMultiple} accept="image/*" onChange={handleFileSelect} />
            </label>
            {selectedImages.map((img, i) => (
              <div key={i} onClick={() => setPreviewImage(img)} className="relative aspect-square">
                <img src={img} className="w-full h-full object-cover" alt="Selected" />
                {isMultiple && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-[#1877F2] rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-black">
                    {i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col h-[calc(100vh-56px)] p-4 bg-boss-bg">
          <div className="flex-1 bg-zinc-900 rounded-3xl overflow-hidden mb-8 border border-zinc-800 shadow-2xl">
             <img src={previewImage} className="w-full h-full object-contain" alt="Editing" />
          </div>
          <div className="grid grid-cols-5 gap-2 pb-10">
            {[
                { icon: <Music />, label: "Music" },
                { icon: <Type />, label: "Text" },
                { icon: <Sticker />, label: "Overlay" },
                { icon: <CheckCircle />, label: "Stickers" },
                { icon: <Filter />, label: "Filters" }
            ].map((tool, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 active:scale-90 transition-transform">
                    <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-400">{tool.icon}</div>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-500">{tool.label}</span>
                </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300 h-[calc(100vh-56px)] overflow-y-auto">
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-zinc-800 shadow-lg">
               <img src={selectedImages[0]} className="w-full h-full object-cover" alt="Final" />
            </div>
            <textarea 
              placeholder="Write a caption..." 
              className="bg-transparent w-full h-20 outline-none resize-none pt-2 text-sm text-boss-text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button className="flex items-center gap-1 bg-zinc-900 px-4 py-2 rounded-xl text-[10px] font-black border border-zinc-800 text-zinc-400 uppercase"><AtSign size={14}/> Mention</button>
            <button className="flex items-center gap-1 bg-zinc-900 px-4 py-2 rounded-xl text-[10px] font-black border border-zinc-800 text-zinc-400 uppercase"><Hash size={14}/> Hashtag</button>
          </div>

          <div className="space-y-2">
             <div className="flex items-center justify-between p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-[#1877F2]"/>
                  <span className="font-bold text-sm">Tag people</span>
                </div>
                <ChevronLeft className="rotate-180 text-zinc-600" size={18}/>
             </div>

             <div onClick={() => {
               Swal.fire({
                 title: 'Who can see this?',
                 background: '#1c1c1e',
                 color: '#fff',
                 input: 'radio',
                 inputOptions: { 'public': 'Public', 'friends': 'Friends', 'private': 'Only Me' },
                 confirmButtonColor: '#1877F2'
               }).then((res) => { if(res.value) setPrivacy(res.value) });
             }} className="flex items-center justify-between p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-[#1877F2]"/>
                  <span className="font-bold text-sm">Privacy Settings</span>
                </div>
                <span className="text-[10px] font-black text-blue-500 uppercase">{privacy}</span>
             </div>
          </div>

          <button 
            onClick={handlePost}
            disabled={uploading}
            className="w-full bg-[#1877F2] py-4 rounded-full font-black text-lg tracking-tighter shadow-xl active:scale-95 transition-all mt-6 disabled:opacity-50"
          >
            {uploading ? "UPLOADING..." : "SHARE TO FEED"}
          </button>
        </div>
      )}
    </div>
  );
}

