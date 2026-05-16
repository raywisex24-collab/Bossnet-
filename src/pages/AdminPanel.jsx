import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, doc, getDoc, onSnapshot, updateDoc, deleteDoc, addDoc 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, CheckCircle, XCircle, Search, ArrowLeft, 
  AlertTriangle, Megaphone, Users, UserX, UserCheck, Trash2, Eye 
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Navigation Tabs: 'users' | 'reports' | 'broadcast'
  const [activeTab, setActiveTab] = useState('users');

  // State Management
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");

  // 1. Security Check: Verify Admin Status
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate('/login');
          return;
        }
        
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          setIsAdmin(true);
        } else {
          Swal.fire("Access Denied", "Admins only, boss!", "error");
          navigate('/feed');
        }
      } catch (err) {
        console.error(err);
        navigate('/feed');
      } finally {
        setLoading(false);
      }
    };
    checkAdminStatus();
  }, [navigate]);

  // 2. Real-time Listeners for Users and Reports
  useEffect(() => {
    if (!isAdmin) return;

    // Listen to Users
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen to Reports
    const unsubReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsers();
      unsubReports();
    };
  }, [isAdmin]);

  // --- ACTIONS: USER MANAGEMENT ---
  const toggleVerification = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, "users", userId), { isVerified: !currentStatus });
      Swal.fire("Updated", `Verification status changed!`, "success");
    } catch (err) {
      Swal.fire("Error", "Failed to update validation", "error");
    }
  };

  const toggleBanStatus = async (userId, currentBanStatus) => {
    const actionText = currentBanStatus ? "unban" : "suspend";
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `You are about to ${actionText} this account.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentBanStatus ? '#10b981' : '#ef4444',
      confirmButtonText: `Yes, ${actionText} them!`
    });

    if (result.isConfirmed) {
      try {
        await updateDoc(doc(db, "users", userId), { isBanned: !currentBanStatus });
        Swal.fire("Updated!", `User account has been ${actionText}ned.`, "success");
      } catch (err) {
        Swal.fire("Error", "Action failed", "error");
      }
    }
  };

  // --- ACTIONS: REPORT MANAGEMENT ---
  const dismissReport = async (reportId) => {
    try {
      await deleteDoc(doc(db, "reports", reportId));
      Swal.fire("Dismissed", "Report cleared safely", "success");
    } catch (err) {
      Swal.fire("Error", "Could not clear report", "error");
    }
  };

  const deleteReportedPost = async (reportId, postId) => {
    const result = await Swal.fire({
      title: 'Delete target post?',
      text: "This action will permanently remove this post from Bossnet!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, wipe it!'
    });

    if (result.isConfirmed) {
      try {
        // 1. Delete post from posts collection
        await deleteDoc(doc(db, "posts", postId));
        // 2. Clear out the report notification ticket
        await deleteDoc(doc(db, "reports", reportId));
        Swal.fire("Wiped!", "Post deleted and report ticket resolved.", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete target media", "error");
      }
    }
  };

  // --- ACTIONS: BROADCAST ANNOUNCEMENT ---
  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!announcement.trim()) return;

    try {
      await addDoc(collection(db, "announcements"), {
        text: announcement,
        createdAt: new Date(),
        createdBy: auth.currentUser.uid
      });
      setAnnouncement("");
      Swal.fire("Broadcast Sent!", "Everyone scrolling the feed will see this announcement.", "success");
    } catch (err) {
      Swal.fire("Error", "Broadcast deployment failed", "error");
    }
  };

  // Live filter for user search
  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-boss-bg flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text font-sans pb-24">
      {/* Top Fixed Header */}
      <div className="flex items-center gap-4 p-4 border-b border-white/10 sticky top-0 bg-boss-bg z-50">
        <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer text-zinc-400 hover:text-white" />
        <div className="flex items-center gap-2">
          <Shield className="text-blue-500" size={22} />
          <h1 className="text-xl font-bold tracking-tight">Bossnet Terminal</h1>
        </div>
      </div>

      {/* Segmented Navigation Menu Tabs */}
      <div className="flex border-b border-white/5 bg-white/[0.02]">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold transition-all ${activeTab === 'users' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-zinc-500'}`}
        >
          <Users size={18} />
          Accounts
        </button>
        <button 
          onClick={() => setActiveTab('reports')} 
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold relative transition-all ${activeTab === 'reports' ? 'text-red-500 border-b-2 border-b-2 border-red-500' : 'text-zinc-500'}`}
        >
          <AlertTriangle size={18} />
          Reports
          {reports.length > 0 && (
            <span className="absolute top-2 right-10 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
              {reports.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('broadcast')} 
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold transition-all ${activeTab === 'broadcast' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-zinc-500'}`}
        >
          <Megaphone size={18} />
          Broadcast
        </button>
      </div>

      {/* MAIN CONTAINER CONTENT VIEWPORT */}
      <div className="p-4 max-w-lg mx-auto mt-2">

        {/* TAB 1: ACCOUNTS LISTING */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <Search className="text-gray-500 mr-3" size={18} />
              <input 
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-boss-text placeholder-gray-500"
              />
            </div>

            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <img src={user.profilePic || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
                    <div>
                      <h4 className="font-bold text-sm flex items-center gap-1">
                        {user.fullName || "No Name"}
                        {user.isVerified && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />}
                        {user.isBanned && <span className="text-[10px] bg-red-600 text-white px-1 rounded">Banned</span>}
                      </h4>
                      <p className="text-xs text-zinc-400">@{user.username}</p>
                    </div>
                  </div>

                  {/* Dual Action Controls */}
                  <div className="flex items-center gap-2">
                    {/* Verification Toggle */}
                    <button 
                      onClick={() => toggleVerification(user.id, user.isVerified)}
                      className={`p-2 rounded-xl border transition-all ${user.isVerified ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}
                    >
                      <CheckCircle size={18} />
                    </button>

                    {/* Ban Toggle */}
                    <button 
                      onClick={() => toggleBanStatus(user.id, user.isBanned)}
                      className={`p-2 rounded-xl border transition-all ${user.isBanned ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-zinc-800 border-white/5 text-zinc-400 hover:text-red-400'}`}
                    >
                      {user.isBanned ? <UserCheck size={18} /> : <UserX size={18} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: REPORTS STREAM CONTROL */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider px-1">Open Reports Feed ({reports.length})</p>
            
            {reports.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm font-medium">Clean slate! No reported items right now, boss.</div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="p-4 bg-red-950/20 border border-red-900/30 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">
                        Reason: {report.reason || "Violation"}
                      </span>
                      <p className="text-xs text-zinc-400 mt-1">Reported by: <span className="text-zinc-200">@{report.reportedByUsername || "User"}</span></p>
                    </div>
                    <span className="text-[10px] text-zinc-500">{new Date(report.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                  </div>

                  {/* Target Reported Context Snippet */}
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-sm">
                    <p className="text-zinc-300 italic">"{report.postText || "Media Post Link"}"</p>
                    {report.postImage && (
                      <img src={report.postImage} alt="Reported target" className="mt-2 w-24 h-24 rounded-lg object-cover border border-white/10" />
                    )}
                  </div>

                  {/* Action Commands */}
                  <div className="flex gap-2 justify-end pt-1">
                    <button 
                      onClick={() => dismissReport(report.id)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all"
                    >
                      Dismiss Report
                    </button>
                    <button 
                      onClick={() => deleteReportedPost(report.id, report.postId)}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Trash2 size={14} /> Wiped Post
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: GLOBAL BROADCAST HOOK */}
        {activeTab === 'broadcast' && (
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl">
                <Megaphone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-boss-text">Global System Announcement</h3>
                <p className="text-xs text-zinc-500">This drops a rolling status banner directly onto everyone's feed module instantly.</p>
              </div>
            </div>

            <form onSubmit={sendBroadcast} className="space-y-3">
              <textarea
                rows="4"
                placeholder="Type your official platform message here, boss..."
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none text-sm text-boss-text placeholder-gray-600 focus:border-purple-500 transition-colors resize-none"
              />
              <button 
                type="submit"
                disabled={!announcement.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg active:scale-98"
              >
                Broadcast Announcement
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
