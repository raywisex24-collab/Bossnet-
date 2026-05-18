import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Shield, CheckCircle, UserX, UserCheck, Flame } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminUserEdit() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [inflationInput, setInflationInput] = useState("");

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
      Swal.fire("Updated", "Verification status toggled!", "success");
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

  if (loading) return <div className="min-h-screen bg-boss-bg flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text font-sans pb-12">
      <div className="flex items-center gap-4 p-4 border-b border-white/10 sticky top-0 bg-boss-bg z-50">
        <ArrowLeft onClick={() => navigate('/admin/users')} className="cursor-pointer text-zinc-400" />
        <h1 className="text-lg font-bold">Account Properties</h1>
      </div>

      <div className="p-5 max-w-lg mx-auto space-y-6">
        {/* Identity Section */}
        <div className="flex flex-col items-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
          <img src={user?.profilePic || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full object-cover border-2 border-white/10 shadow-xl mb-3" alt="" />
          <h2 className="text-xl font-bold">{user?.fullName || "No Name"}</h2>
          <p className="text-sm text-zinc-500">@{user?.username}</p>
        </div>

        {/* Core Settings Deck */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider px-1">Access & Badges</p>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleVerification}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 font-bold transition-all ${user?.isVerified ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-white/5 border-white/5 text-zinc-400'}`}
            >
              <CheckCircle size={20} />
              <span className="text-xs">{user?.isVerified ? "Verified Badge Active" : "Unverified Status"}</span>
            </button>

            <button 
              onClick={handleBanToggle}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 font-bold transition-all ${user?.isBanned ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-white/5 border-white/5 text-zinc-400'}`}
            >
              {user?.isBanned ? <UserCheck size={20} /> : <UserX size={20} />}
              <span className="text-xs">{user?.isBanned ? "Lift Account Ban" : "Suspend Account"}</span>
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
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-500"
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
      </div>
    </div>
  );
}
