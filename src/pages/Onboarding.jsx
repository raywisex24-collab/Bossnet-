import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronRight, Check, X } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Onboarding() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(auth.currentUser?.displayName || "");
  
  // ✅ Generates once on mount
  const [username, setUsername] = useState(() => `user_${Math.floor(1000 + Math.random() * 9000)}`);
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [profilePic, setProfilePic] = useState(auth.currentUser?.photoURL || "");
  const [loading, setLoading] = useState(false);

  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const IMGBB_API_KEY = "Fa575203bc672f5b48b5eccc5d59185b";

  // ✅ PHOTO UPLOAD LOGIC
  const handlePhotoAction = async () => {
    const { value: fileSource } = await Swal.fire({
      title: 'Profile Photo',
      background: '#1a1a1a',
      color: '#fff',
      showCancelButton: true,
      confirmButtonText: 'Gallery',
      denyButtonText: 'Camera',
      showDenyButton: true,
      customClass: {
        popup: 'rounded-[20px] border border-white/10',
        confirmButton: 'bg-blue-600 rounded-lg',
        denyButton: 'bg-zinc-800 rounded-lg'
      }
    });

    if (fileSource === undefined) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (fileSource === 'deny') input.capture = 'camera';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        if (result.success) {
          setProfilePic(result.data.url);
        }
      } catch (error) {
        Swal.fire("Error", "Upload failed", "error");
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  // ✅ GENDER SELECTION LOGIC
  const selectGender = async () => {
    const { value: selectedGender } = await Swal.fire({
      title: 'Select Gender',
      input: 'radio',
      inputOptions: {
        'Male': 'Male',
        'Female': 'Female',
        'Other': 'Other',
        'Secret': 'Prefer not to say'
      },
      background: '#1a1a1a',
      color: '#fff',
      customClass: { popup: 'rounded-[20px]' },
      inputValidator: (value) => { if (!value) return 'You need to choose!' }
    });
    if (selectedGender) setGender(selectedGender);
  };

  // ✅ USERNAME AVAILABILITY CHECK
  useEffect(() => {
    if (!username || username.length < 3) return;
    const checkAvailability = async () => {
      setCheckingUsername(true);
      try {
        const q = query(collection(db, "users"), where("username", "==", username.toLowerCase().trim()));
        const snap = await getDocs(q);
        setIsUsernameValid(snap.empty);
      } finally {
        setCheckingUsername(false);
      }
    };
    const timer = setTimeout(checkAvailability, 600);
    return () => clearTimeout(timer);
  }, [username]);

  const handleFinish = async () => {
    if (!isUsernameValid) return Swal.fire("Error", "Username is taken", "error");
    setLoading(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        fullName: fullName.trim(),
        username: username.toLowerCase().trim(),
        bio: bio.trim(),
        gender: gender, 
        profilePic: profilePic,
        createdAt: serverTimestamp(),
        onboardingComplete: true,
        isVerified: false // ✅ Set to false so new users don't get verified automatically
      }, { merge: true });
      navigate('/feed');
    } catch (error) {
      Swal.fire("Error", "Save failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text p-6 font-sans select-none">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black tracking-tight">Finish Profile</h1>
        <button onClick={handleFinish} disabled={loading || !isUsernameValid} className="text-[#0095f6] font-bold text-lg">
          {loading ? "..." : "Done"}
        </button>
      </div>

      <div className="flex flex-col items-center mb-10">
        <div className="relative cursor-pointer" onClick={handlePhotoAction}>
          <div className="w-28 h-28 rounded-full border-2 border-white/10 overflow-hidden bg-zinc-900">
            {profilePic ? (
              <img src={profilePic} className="w-full h-full object-cover" alt="profile" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600"><Camera size={40} /></div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-[#0095f6] p-2 rounded-full border-4 border-black">
            <Camera size={16} className="text-boss-text" />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Full Name</label>
          <input 
            className="w-full bg-transparent border-b border-white/10 py-2 outline-none focus:border-white transition-all text-sm"
            value={fullName} onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Username</label>
          <div className="flex items-center relative">
            <input 
              className={`w-full bg-transparent border-b py-2 outline-none lowercase transition-all text-sm ${!isUsernameValid ? 'border-red-500' : 'border-white/10 focus:border-white'}`}
              value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
            />
            <div className="absolute right-0">
              {checkingUsername ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : 
               isUsernameValid ? <Check size={18} className="text-green-500" /> : <X size={18} className="text-red-500" />}
            </div>
          </div>
        </div>

        <div>
          <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Bio</label>
          <textarea className="w-full bg-transparent border-b border-white/10 py-2 outline-none resize-none text-sm" value={bio} onChange={(e) => setBio(e.target.value)} rows={1} />
        </div>

        <div className="flex items-center justify-between py-4 border-b border-white/10 cursor-pointer active:bg-white/5 transition-colors" onClick={selectGender}>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Gender</span>
            <span className="text-xs text-gray-500">{gender || "Not specified"}</span>
          </div>
          <ChevronRight size={20} className="text-gray-600" />
        </div>
      </div>
    </div>
  );
}

