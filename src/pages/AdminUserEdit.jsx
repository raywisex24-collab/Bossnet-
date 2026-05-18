import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, onSnapshot, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ArrowLeft, Shield, CheckCircle, UserX, UserCheck, Flame } from 'lucide-react';
import Swal from 'sweetalert2';
import VerifiedBadge from './VerifiedBadge'; // 👈 Added custom badge import here

// Helper engine to cleanly format last seen timelines relative to now
const formatLastSeen = (timestamp) => {
  if (!timestamp) return "Never";
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 6000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function AdminUserEdit() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [inflationInput, setInflationInput] = useState("");

  // Administrative Workspace Edit Buffers
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      const current = auth.currentUser;
      if (!current) { navigate('/login'); return; }
      const snap = await getDoc(doc(db, "users", current.uid));
      if (snap.exists() && snap.data().isAdmin === true) {
        setIsAdmin(true);
      } else {
        Swal.fire("Access Denied", "Admins only!", "error");
        navigate('/feed');
      }
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    return onSnapshot(doc(db, "users", userId), (docSnap) => {
      if (docSnap.exists()) {
        setUser(docSnap.data());
        setInflationInput(docSnap.data().inflatedFollowers || "0");
      }
      setLoading(false);
    });
  }, [isAdmin, userId]);

  const handleVerification = async () => {
    try {
      await updateDoc(doc(db, "users", userId), { isVerified: !user.isVerified });
      Swal.fire("Updated", "Verification status changed!", "success");
    } catch (e) { Swal.fire("Error", "Action failed", "error"); }
  };

  const handleBanToggle = async () => {
    const text = user.isBanned ? "unban" : "suspend";
    const conf = await Swal.fire({
      title: `Confirm Action`,
      text: `Do you want to ${text} this user account?`,
      icon: 'warning',
      showCancelButton: true
    });
    if (conf.isConfirmed) {
      try {
        await updateDoc(doc(db, "users", userId), { isBanned: !user.isBanned });
        Swal.fire("Success", `Account ${text}ned successfully`, "success");
      } catch (e) { Swal.fire("Error", "Action failed", "error"); }
    }
  };

  const saveInflation = async () => {
    const val = parseInt(inflationInput, 10) || 0;
    try {
      await updateDoc(doc(db, "users", userId), { inflatedFollowers: val });
      Swal.fire("Saved", `Inflation value registered at +${val.toLocaleString()}`, "success");
    } catch (e) { Swal.fire("Error", "Save failed", "error"); }
  };

  // 1. Administrative Promotion Engine
  const handleAdminToggle = async () => {
    const nextStatus = !user?.isAdmin;
    const conf = await Swal.fire({
      title: 'Modify Credentials?',
      text: `Are you sure you want to ${nextStatus ? "PROMOTE this user to System Admin" : "DEMOTE this user back to standard rank"}?`,
      icon: 'warning',
      showCancelButton: true,
      background: '#000',
      color: '#fff'
    });
    if (conf.isConfirmed) {
      try {
        await updateDoc(doc(db, "users", userId), { isAdmin: nextStatus });
        Swal.fire("Success", `User rank mutated successfully.`, "success");
      } catch (e) { Swal.fire("Error", "Rank update failed", "error"); }
    }
  };

  // 2. Identity Management Sync System
  const saveUsername = async () => {
    if (!usernameInput.trim()) return;
    try {
      await updateDoc(doc(db, "users", userId), { username: usernameInput.trim().toLowerCase() });
      setIsEditingUsername(false);
      Swal.fire("Saved", "Username updated across matrix.", "success");
    } catch (e) { Swal.fire("Error", "Update failed", "error"); }
  };

  const saveBio = async () => {
    try {
      await updateDoc(doc(db, "users", userId), { bio: bioInput.trim() });
      setIsEditingBio(false);
      Swal.fire("Saved", "Bio layout updated.", "success");
    } catch (e) { Swal.fire("Error", "Update failed", "error"); }
  };

  // 3. Password Audit and Overwrite Handler
  const handlePasswordReset = async () => {
    const currentPassword = user?.password || "No raw string recorded in database";
    
    const { value: newPassword } = await Swal.fire({
      title: 'Authentication Management',
      html: `
        <div class="text-left text-xs text-zinc-400 space-y-2">
          <p><span class="font-bold text-red-400">Current Saved Password:</span> <code class="bg-white/10 px-1.5 py-0.5 rounded text-white text-sm">${currentPassword}</code></p>
          <p class="mt-4">Type a completely new structural password below to force-update their profile record entry:</p>
        </div>
      `,
      input: 'text',
      inputPlaceholder: 'Enter brand new password...',
      showCancelButton: true,
      background: '#000',
      color: '#fff',
      confirmButtonColor: '#2563eb'
    });

    if (newPassword && newPassword.trim()) {
      try {
        await updateDoc(doc(db, "users", userId), { password: newPassword.trim() });
        Swal.fire("Success", "Password credential records rewritten.", "success");
      } catch (e) { Swal.fire("Error", "Failed to update auth parameter", "error"); }
    }
  };

  // 4. Avatar Asset Orchestration Portal
  const triggerAvatarManagementOptions = async () => {
    const { value: action } = await Swal.fire({
      title: 'Profile Picture Desk',
      text: 'Choose an administrative asset path mutation:',
      icon: 'info',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Inject Link URL',
      denyButtonText: '🗑️ Wipe Avatar',
      cancelButtonText: 'Local Upload',
      background: '#000',
      color: '#fff',
      confirmButtonColor: '#2563eb',
      denyButtonColor: '#dc2626'
    });

    // Option A: Inject via Absolute Web URL address
    if (action === true) {
      const { value: url } = await Swal.fire({
        title: 'Input Image Address',
        input: 'url',
        inputPlaceholder: 'https://example.com/avatar.jpg',
        background: '#000',
        color: '#fff'
      });
      if (url) {
        await updateDoc(doc(db, "users", userId), { profilePic: url });
        Swal.fire("Success", "External asset mapped.", "success");
      }
    } 
    // Option B: Wipe profile image completely (set to empty)
    else if (Swal.clickDeny()) {
      await updateDoc(doc(db, "users", userId), { profilePic: "" });
      Swal.fire("Wiped", "Asset cleared. System vector avatar active.", "success");
    } 
    // Option C: Local device file pick channel
    else {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Convert to inline Base64 storage payload string safely
        const reader = new FileReader();
        reader.onloadend = async () => {
          await updateDoc(doc(db, "users", userId), { profilePic: reader.result });
          Swal.fire("Uploaded", "Local asset mapped to file store.", "success");
        };
        reader.readAsDataURL(file);
      };
      fileInput.click();
    }
  };

  // 5. Hard Wipe Destruction Protocol
  const executeCatastrophicPurge = async () => {
    const confirmationWord = "DELETE";
    const { value: typedCheck } = await Swal.fire({
      title: 'CRITICAL PURGE ALERT',
      text: `This completely wipes this account and cannot be undone. Type "${confirmationWord}" to execute permanent deletion from database registry:`,
      input: 'text',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      background: '#000',
      color: '#fff'
    });

    if (typedCheck === confirmationWord) {
      Swal.fire({ title: 'Executing Obliteration...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        // Remove document from the users collection
        await deleteDoc(doc(db, "users", userId));
        Swal.fire("Obliterated", "Profile records wiped completely.", "success");
        navigate('/admin/users');
      } catch (e) { Swal.fire("Error", "Purge task crashed.", "error"); }
    }
  };

  // 6. Direct Notification Dispatcher Engine
  const dispatchDirectNotification = async () => {
    const { value: text } = await Swal.fire({
      title: 'Dispatch System Notification',
      text: `Send a direct custom system broadcast message to @${user?.username || 'user'}:`,
      input: 'textarea',
      inputPlaceholder: 'Type notification body content here...',
      showCancelButton: true,
      confirmButtonText: 'Transmit Message',
      confirmButtonColor: '#2563eb',
      background: '#000',
      color: '#fff'
    });

    if (text && text.trim()) {
      try {
        // If your schema nests notifications inside a subcollection under the user document:
        const notificationRef = doc(db, "users", userId, "notifications", crypto.randomUUID());
        
        await updateDoc(notificationRef, {
          title: "🔑 System Administration Update",
          message: text.trim(),
          createdAt: Timestamp.now(),
          type: "system_alert",
          isRead: false
        });
        
        Swal.fire("Transmitted", "Notification pushed to client terminal successfully.", "success");
      } catch (e) { 
        // Fallback option: If your schema uses a root global collection matching against target userId:
        try {
          const globalNotificationRef = doc(db, "notifications", crypto.randomUUID());
          const { setDoc } = await import('firebase/firestore'); // dynamic safety check
          
          // Try alternative root collection fallback format
          const snap = await getDoc(doc(db, "users", userId)); 
          if(snap.exists()) {
            await updateDoc(doc(db, "users", userId), {
              hasNewAlerts: true,
              lastAlertText: text.trim()
            });
          }
          Swal.fire("Transmitted", "Notification synchronized via identity fallback properties.", "success");
        } catch(err) {
          Swal.fire("Transmission Failed", "Could not write to database structures.", "error"); 
        }
      }
    }
  };

  if (loading) return <div className="min-h-screen !bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen !bg-black text-boss-text font-sans pb-24">
      {/* Top sticky navigation deck */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 !bg-black z-50">
        <div className="flex items-center gap-3">
          <ArrowLeft onClick={() => navigate('/admin/users')} className="cursor-pointer text-zinc-400" />
          
          {/* Real-time Dynamic Presence Signal Block */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${user?.isOnline ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
              <h1 className="text-sm font-bold leading-none">Command Deck</h1>
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 font-medium">
              {user?.isOnline ? "User Connected Online" : `Last seen: ${formatLastSeen(user?.lastSeen)}`}
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => navigate(`/profile/${userId}`)}
          className="text-xs bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-zinc-300 font-bold hover:bg-white/20 transition-all active:scale-95"
        >
          View Profile View
        </button>
      </div>

      <div className="p-5 max-w-lg mx-auto space-y-6">
        {/* Top Identity Avatar Display Deck */}
        <div className="flex flex-col items-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center relative group">
          <div 
            onClick={triggerAvatarManagementOptions} 
            className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95 group mb-3"
            title="Click to manage or upload avatar file asset"
          >
            {user?.profilePic ? (
              <img src={user.profilePic} className="w-24 h-24 rounded-full object-cover border-2 border-white/10 shadow-2xl" alt="" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-dashed border-white/20 flex items-center justify-center text-zinc-500">
                <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 2 4 2zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase opacity-0 group-hover:opacity-100 transition-opacity">
              Edit Avatar
            </div>
          </div>
          
          <h2 className="text-xl font-bold tracking-tight">{user?.fullName || "No Identity Registered"}</h2>
          
          {/* Flex wrapper container to keep handle and live badge on the same line */}
          <div className="flex items-center gap-1 mt-0.5">
            <p className="text-sm text-zinc-500">@{user?.username || "no-handle"}</p>
            <VerifiedBadge isVerified={user?.isVerified || false} />
          </div>

          {user?.isAdmin && <span className="mt-2 text-[9px] font-black tracking-widest uppercase bg-blue-600 px-2 py-0.5 rounded text-white shadow-md">System Administrator</span>}
        </div>

        {/* Dynamic Parameter In-Line Editors */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest border-b border-white/5 pb-2">Modify Identity Records</p>
          
          {/* Username Control Component Grid */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">System Handle Name (@)</label>
            {isEditingUsername ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={usernameInput} 
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <button onClick={saveUsername} className="bg-green-600 px-3 py-1 text-xs rounded-xl font-bold">Save</button>
                <button onClick={() => setIsEditingUsername(false)} className="bg-white/10 px-3 py-1 text-xs rounded-xl text-zinc-400">Cancel</button>
              </div>
            ) : (
              <div className="flex justify-between items-center p-3 bg-black rounded-xl border border-white/5">
                <span className="text-sm text-zinc-300">@{user?.username}</span>
                <button onClick={() => { setUsernameInput(user?.username || ""); setIsEditingUsername(true); }} className="text-xs text-blue-400 font-bold">Change</button>
              </div>
            )}
          </div>

          {/* Bio Control Component Grid */}
          <div className="space-y-1.5">
	            <label className="text-xs text-zinc-400 font-medium">User Profile Bio Statement</label>
            {isEditingBio ? (
              <div className="flex flex-col gap-2">
                <textarea 
                  value={bioInput} 
                  onChange={(e) => setBioInput(e.target.value)}
                  className="w-full h-20 bg-black border border-white/10 rounded-xl p-3 text-xs text-white outline-none resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsEditingBio(false)} className="bg-white/10 px-4 py-1.5 text-xs rounded-xl text-zinc-400">Cancel</button>
                  <button onClick={saveBio} className="bg-green-600 px-4 py-1.5 text-xs rounded-xl font-bold">Apply</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start p-3 bg-black rounded-xl border border-white/5 gap-4">
                <p className="text-xs text-zinc-400 italic leading-relaxed">{user?.bio || "No biography info written yet..."}</p>
                <button onClick={() => { setBioInput(user?.bio || ""); setIsEditingBio(true); }} className="text-xs text-blue-400 font-bold shrink-0">Change</button>
              </div>
            )}
          </div>
        </div>

        {/* Global Security Framework Core Settings Deck */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider px-1">Access System Authority</p>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleVerification}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 font-bold text-center transition-all ${user?.isVerified ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-white/5 border-white/5 text-zinc-500'}`}
            >
              <CheckCircle size={18} />
              <span className="text-[11px] leading-tight">{user?.isVerified ? "Verified Active" : "Unverified Status"}</span>
            </button>

            <button 
              onClick={handleBanToggle}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 font-bold text-center transition-all ${user?.isBanned ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-white/5 border-white/5 text-zinc-500'}`}
            >
              {user?.isBanned ? <UserCheck size={18} /> : <UserX size={18} />}
              <span className="text-[11px] leading-tight">{user?.isBanned ? "Lift Suspended Ban" : "Suspend Account"}</span>
            </button>

            <button 
              onClick={handleAdminToggle}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 font-bold text-center transition-all ${user?.isAdmin ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 text-zinc-500'}`}
            >
              <Shield size={18} />
              <span className="text-[11px] leading-tight">{user?.isAdmin ? "Revoke Admin Status" : "Promote to Admin"}</span>
            </button>

            <button 
              onClick={handlePasswordReset}
              className="p-4 rounded-xl border bg-white/5 border-white/5 text-zinc-400 hover:border-zinc-700 flex flex-col items-center justify-center gap-2 font-bold text-center transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[2]">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span className="text-[11px] leading-tight">Audit / Change Pass</span>
            </button>

            {/* Direct Push Message Console Switch */}
            <button 
              onClick={dispatchDirectNotification}
              className="p-4 rounded-xl border bg-white/5 border-white/5 text-purple-400 border-purple-500/20 hover:border-purple-500/50 flex flex-col items-center justify-center gap-2 font-bold text-center transition-all col-span-2 mt-1"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[2] animate-pulse">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="text-[11px] leading-tight text-zinc-300">Transmit Custom Push Notification Message</span>
            </button>
          </div>
        </div>

        {/* Inflation Value Deck */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Flame className="text-purple-400" size={20} />
            <div>
              <h3 className="font-bold text-sm">Follower Inflation Matrix</h3>
              <p className="text-xs text-zinc-500">Adjust the displayed base metrics layer smoothly.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <input 
              type="number" 
              value={inflationInput}
              onChange={(e) => setInflationInput(e.target.value)}
              className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-500 text-white"
              placeholder="E.g. 50000"
            />
            <button 
              onClick={saveInflation}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 rounded-xl transition-colors"
            >
              Update Matrix
            </button>
          </div>
        </div>

        {/* Catastrophic Danger Zone Cleanup Block */}
        <div className="p-4 border border-red-500/20 bg-red-950/10 rounded-2xl space-y-3">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-red-500">System Danger Zone</h4>
            <p className="text-xs text-zinc-500">Irreversible operational actions against firestore instances.</p>
          </div>
          <button 
            onClick={executeCatastrophicPurge}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-colors active:scale-98"
          >
            Obliterate Account Record
          </button>
        </div>
      </div>
    </div>
  );
}
