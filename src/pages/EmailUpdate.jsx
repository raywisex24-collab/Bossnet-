import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  reauthenticateWithPopup, 
  GoogleAuthProvider, 
  updateEmail, 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, ShieldCheck, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function EmailUpdate() {
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState(""); // Only for password users
  const [loading, setLoading] = useState(false);

  const user = auth.currentUser;
  // Check if the user signed in with Google
  const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com');

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isGoogleUser) {
        // ✅ GOOGLE RE-AUTH LOGIC
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
      } else {
        // ✅ PASSWORD RE-AUTH LOGIC
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

      // 1. Update Firebase Auth Email
      await updateEmail(user, newEmail);

      // 2. Update Firestore User Document
      await updateDoc(doc(db, "users", user.uid), {
        email: newEmail.toLowerCase()
      });

      Swal.fire("Success", "Email updated and synced!", "success");
      navigate('/me');
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* HEADER */}
      <div className="flex items-center p-4 border-b border-white/10">
        <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer mr-6" />
        <h1 className="text-xl font-bold">Change Email</h1>
      </div>

      <div className="p-6 max-w-md mx-auto">
        <div className="bg-[#1a1a1a] p-4 rounded-2xl mb-6 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="text-blue-500" size={20} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Security Check</h2>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {isGoogleUser 
              ? "Since you use Google Sign-in, we will briefly open a popup to verify your identity."
              : "Please enter your current password to authorize this change."}
          </p>
        </div>

        <form onSubmit={handleUpdateEmail} className="space-y-6">
          {/* Current Email (Read Only) */}
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase ml-1">Current Email</label>
            <div className="flex items-center bg-[#121212] p-3 rounded-xl border border-white/10 mt-1 opacity-60">
              <Mail size={18} className="text-gray-500 mr-3" />
              <span className="text-sm">{user?.email}</span>
            </div>
          </div>

          {/* New Email Input */}
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase ml-1">New Email Address</label>
            <div className="flex items-center bg-[#121212] p-3 rounded-xl border border-white/10 mt-1 focus-within:border-blue-500 transition-all">
              <Mail size={18} className="text-gray-400 mr-3" />
              <input 
                type="email"
                required
                placeholder="Enter new email"
                className="bg-transparent outline-none text-sm w-full"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input (Hidden for Google Users) */}
          {!isGoogleUser && (
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase ml-1">Password</label>
              <div className="flex items-center bg-[#121212] p-3 rounded-xl border border-white/10 mt-1 focus-within:border-blue-500 transition-all">
                <Lock size={18} className="text-gray-400 mr-3" />
                <input 
                  type="password"
                  required
                  placeholder="Your current password"
                  className="bg-transparent outline-none text-sm w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Verifying Boss..." : "Update Email"}
          </button>
        </form>
      </div>
    </div>
  );
}

