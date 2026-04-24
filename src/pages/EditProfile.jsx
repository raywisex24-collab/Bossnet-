import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, X, Check, ChevronRight, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Form States
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [profilePic, setProfilePic] = useState("");
  
  // Logic States
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // YOUR IMGBB KEY
  const IMGBB_API_KEY = "Fa575203bc672f5b48b5eccc5d59185b";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFullName(data.fullName || "");
          setUsername(data.username || "");
          setBio(data.bio || "");
          setWebsite(data.website || "");
          setProfilePic(data.profilePic || "");
        } else {
          // Auto-create for missing IDs
          const newData = {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            fullName: auth.currentUser.displayName || "",
            username: `boss_${Math.floor(Math.random() * 10000)}`,
            profilePic: auth.currentUser.photoURL || "",
            createdAt: serverTimestamp(),
            isVerified: false
          };
          await setDoc(userRef, newData);
          setUserData(newData);
          setFullName(newData.fullName);
          setUsername(newData.username);
          setProfilePic(newData.profilePic);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // ✅ FIXED PHOTO UPLOAD LOGIC (imgBB)
  const handlePhotoAction = async () => {
    const { value: fileSource } = await Swal.fire({
      title: 'Change Profile Photo',
      background: '#1a1a1a',
      color: '#fff',
      showCancelButton: true,
      confirmButtonText: 'Gallery',
      cancelButtonText: 'Cancel',
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

        // Uploading to imgBB
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          const downloadURL = result.data.url;
          
          // Update Firestore
          await updateDoc(doc(db, "users", auth.currentUser.uid), { 
            profilePic: downloadURL 
          });
          
          setProfilePic(downloadURL);
          Swal.fire("Updated", "Profile photo synced!", "success");
        } else {
          throw new Error("imgBB response unsuccessful");
        }
      } catch (error) {
        console.error("Upload Error:", error);
        Swal.fire("Error", "Check your internet or API key.", "error");
      } finally {
        setLoading(false); // ✅ This stops the spinning even if it fails
      }
    };
    input.click();
  };

  // ✅ USERNAME AVAILABILITY CHECK
  useEffect(() => {
    if (!username || username === userData?.username) {
      setIsUsernameValid(true);
      return;
    }
    const checkAvailability = async () => {
      setCheckingUsername(true);
      try {
        const q = query(collection(db, "users"), where("username", "==", username.toLowerCase().trim()));
        const snap = await getDocs(q);
        setIsUsernameValid(snap.empty);
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingUsername(false);
      }
    };
    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [username, userData]);

  const canEditUsername = () => {
    if (!userData?.lastUsernameUpdate) return true;
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    return Date.now() > userData.lastUsernameUpdate.toDate().getTime() + twoWeeks;
  };

  const canEditFullName = () => {
    if (!userData?.lastFullNameUpdate) return true;
    const twoMonths = 60 * 24 * 60 * 60 * 1000;
    return Date.now() > userData.lastFullNameUpdate.toDate().getTime() + twoMonths;
  };

  const handleDone = async () => {
    if (!isUsernameValid) return Swal.fire("Error", "Username is taken", "error");

    const updates = { 
      bio: bio.trim(), 
      website: website.trim() 
    };
    const userRef = doc(db, "users", auth.currentUser.uid);

    if (username !== userData.username && canEditUsername()) {
      updates.username = username.toLowerCase().trim();
      updates.lastUsernameUpdate = new Date();
      updates.isVerified = false; 
    }

    if (fullName !== userData.fullName && canEditFullName()) {
      updates.fullName = fullName.trim();
      updates.lastFullNameUpdate = new Date();
    }

    try {
      setLoading(true);
      await updateDoc(userRef, updates);
      Swal.fire("Success", "Profile updated!", "success");
      navigate('/me');
    } catch (err) {
      Swal.fire("Error", "Could not save changes", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-10">
      <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-black z-50">
        <div className="flex items-center gap-4">
          <X onClick={() => navigate(-1)} className="cursor-pointer" />
          <h1 className="text-xl font-bold tracking-tight">Edit profile</h1>
        </div>
        <button onClick={handleDone} className="text-[#0095f6] font-bold text-lg">Done</button>
      </div>

      <div className="flex flex-col items-center py-8">
        <div className="relative cursor-pointer" onClick={handlePhotoAction}>
          <img src={profilePic || userData?.profilePic} className="w-24 h-24 rounded-full object-cover border-2 border-white/10 shadow-xl" alt="profile" />
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
             <Camera size={26} className="text-white/80" />
          </div>
        </div>
        <button onClick={handlePhotoAction} className="text-[#0095f6] font-bold mt-4 text-sm">Change profile photo</button>
      </div>

      <div className="px-4 space-y-6">
        {/* Name Field */}
        <div className="border-b border-white/10 pb-2">
          <label className="text-gray-500 text-[11px] uppercase font-bold tracking-wider">Name</label>
          <input 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={!canEditFullName()}
            className={`w-full bg-transparent outline-none py-2 text-sm ${!canEditFullName() ? 'text-gray-500 opacity-50' : 'text-white'}`}
          />
          {!canEditFullName() && <p className="text-[10px] text-red-500 mt-1 italic">Locked for 60 days</p>}
        </div>

        {/* Username Field */}
        <div className="border-b border-white/10 pb-2">
          <label className="text-gray-500 text-[11px] uppercase font-bold tracking-wider">Username</label>
          <div className="flex items-center">
            <input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!canEditUsername()}
              className={`w-full bg-transparent outline-none py-2 text-sm ${!canEditUsername() ? 'text-gray-500 opacity-50' : 'text-white'}`}
            />
            {checkingUsername && <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full ml-2" />}
            {!isUsernameValid && <span className="text-red-500 text-xs font-bold ml-2 uppercase">Taken</span>}
            {isUsernameValid && username !== userData?.username && <Check size={16} className="text-green-500 ml-2" />}
          </div>
          {!canEditUsername() && <p className="text-[10px] text-red-500 mt-1 italic">Locked for 14 days</p>}
        </div>

        {/* Bio Field */}
        <div className="border-b border-white/10 pb-2">
          <label className="text-gray-500 text-[11px] uppercase font-bold tracking-wider">Bio</label>
          <textarea 
            value={bio}
            placeholder="Write a bio..."
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-transparent outline-none py-2 text-sm resize-none h-20"
          />
        </div>

        {/* Links Field */}
        <div className="border-b border-white/10 pb-2">
          <label className="text-gray-500 text-[11px] uppercase font-bold tracking-wider">Links</label>
          <input 
            value={website}
            placeholder="Add website"
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full bg-transparent outline-none py-2 text-sm text-blue-400"
          />
        </div>

        {/* Email Field */}
        <div className="flex items-center justify-between py-3 border-b border-white/10 cursor-pointer active:bg-white/5" onClick={() => navigate('/settings/email')}>
          <div className="flex flex-col">
            <label className="text-gray-500 text-[11px] uppercase font-bold tracking-wider">Email Address</label>
            <span className="text-sm py-1">{userData?.email}</span>
          </div>
          <ChevronRight size={18} className="text-gray-600" />
        </div>
      </div>
    </div>
  );
}

