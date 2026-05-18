import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, doc, getDoc, onSnapshot, addDoc, serverTimestamp, query, where } from 'firebase/firestore'; // 👈 Added query & where
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, AlertTriangle, Megaphone, Users, Activity } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Broadcast & Reports states
  const [reports, setReports] = useState([]);
  const [announcement, setAnnouncement] = useState('');
  const [stats, setStats] = useState({ usersCount: 0, reportsCount: 0 });
  const [onlineUsers, setOnlineUsers] = useState([]); // 👈 Track online users array

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) { navigate('/login'); return; }
        
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          setIsAdmin(true);
        } else {
          Swal.fire("Access Denied", "Admins only, boss!", "error");
          navigate('/me');
        }
      } catch (err) {
        console.error(err);
        navigate('/me');
      } finally {
        setLoading(false);
      }
    };
    checkAdminStatus();
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubUsersCount = onSnapshot(collection(db, "users"), (snapshot) => {
      setStats(prev => ({ ...prev, usersCount: snapshot.docs.length }));
    });

    // 🔴 LIVE ONLINE USERS SNAPSHOT FETCH
    const onlineQuery = query(collection(db, "users"), where("status", "==", "online"));
    const unsubOnline = onSnapshot(onlineQuery, (snapshot) => {
      setOnlineUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubReports(); unsubUsersCount(); unsubOnline(); };
  }, [isAdmin]);

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!announcement.trim()) return;
    try {
      await addDoc(collection(db, "announcements"), {
        text: announcement,
        createdAt: serverTimestamp(), 
        createdBy: auth.currentUser.uid
      });
      await addDoc(collection(db, "notifications"), {
        toUserId: "all", 
        fromUserId: auth.currentUser.uid,
        fromUsername: "SYSTEM ALERT",
        fromUserImg: "/bossnet-logo.png", 
        type: "announcement",
        text: announcement,
        isVerified: true,
        read: false,
        createdAt: serverTimestamp()
      });
      setAnnouncement("");
      Swal.fire("Broadcast Sent!", "Everyone will see this announcement, boss.", "success");
    } catch (err) {
      Swal.fire("Error", "Broadcast deployment failed", "error");
    }
  };

  if (loading) return (
    <div className="min-h-screen !bg-[#1c1e22] flex items-center justify-center" style={{ backgroundColor: '#1c1e22' }}>
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen !bg-[#1c1e22] text-boss-text font-sans pb-24" style={{ backgroundColor: '#1c1e22' }}>
      {/* Fixed Header */}
      <div className="flex items-center gap-4 p-4 border-b border-white/10 sticky top-0 z-50" style={{ backgroundColor: '#1c1e22' }}>
        <ArrowLeft onClick={() => navigate('/me')} className="cursor-pointer text-zinc-400 hover:text-white" />
        <div className="flex items-center gap-2">
          <Shield className="text-blue-500" size={22} />
          <h1 className="text-xl font-bold tracking-tight">ADMIN PANEL</h1>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto mt-2 space-y-6">
        {/* Dashboard Nav Segments (Moved to Top) */}
        <div className="flex bg-zinc-900/60 p-1 rounded-xl border border-white/10 overflow-x-auto gap-1 scrollbar-none">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 min-w-[90px] py-2 text-[11px] font-black uppercase rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-[#7c2d12] text-white shadow-md shadow-emerald-500/20 border border-emerald-500/30' : 'text-zinc-400'}`}>Deck</button>
          <button onClick={() => setActiveTab('online')} className={`flex-1 min-w-[90px] py-2 text-[11px] font-black uppercase rounded-lg relative transition-all ${activeTab === 'online' ? 'bg-[#7c2d12] text-white shadow-md shadow-emerald-500/20 border border-emerald-500/30' : 'text-zinc-400'}`}>Online ({onlineUsers.length})</button>
          <button onClick={() => setActiveTab('reports')} className={`flex-1 min-w-[90px] py-2 text-[11px] font-black uppercase rounded-lg relative transition-all ${activeTab === 'reports' ? 'bg-[#7c2d12] text-white shadow-md shadow-emerald-500/20 border border-emerald-500/30' : 'text-zinc-400'}`}>Reports {reports.length > 0 && <span className="ml-1 bg-red-600 text-white text-[9px] px-1 rounded-full">{reports.length}</span>}</button>
          <button onClick={() => setActiveTab('broadcast')} className={`flex-1 min-w-[90px] py-2 text-[11px] font-black uppercase rounded-lg transition-all ${activeTab === 'broadcast' ? 'bg-[#7c2d12] text-white shadow-md shadow-emerald-500/20 border border-emerald-500/30' : 'text-zinc-400'}`}>Broadcast</button>
        </div>

        {/* CONTROLS GRID TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider px-1">Platform Control Deck</p>
            
            {/* The Unified Grid Container with 1px fine dividers */}
            <div className="grid grid-cols-3 gap-[1px] bg-white/10 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              
              {/* Box 1: Total Users (Stat Display) */}
              <div className="bg-[#4a2311] p-4 min-h-[110px] flex flex-col justify-between items-center text-center transition-all duration-200 active:bg-[#2e150a] active:shadow-[inset_0_0_15px_rgba(16,185,129,0.6)] group">
                <Users className="text-orange-400/60 group-active:text-emerald-400 transition-colors" size={20} />
                <div className="mt-2">
                  <p className="text-[20px] font-black text-white leading-none">{stats.usersCount}</p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight mt-1">Total Users</p>
                </div>
              </div>

              {/* Box 2: Unread Alerts (Stat Display) */}
              <div className="bg-[#4a2311] p-4 min-h-[110px] flex flex-col justify-between items-center text-center transition-all duration-200 active:bg-[#2e150a] active:shadow-[inset_0_0_15px_rgba(16,185,129,0.6)] group">
                <AlertTriangle className={`${reports.length > 0 ? 'text-red-400' : 'text-zinc-500'} group-active:text-emerald-400 transition-colors`} size={20} />
                <div className="mt-2">
                  <p className={`text-[20px] font-black leading-none ${reports.length > 0 ? 'text-red-400' : 'text-white'}`}>{reports.length}</p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight mt-1">Unread Alerts</p>
                </div>
              </div>

              {/* Box 3: Live Pulse (Action Button to Online Tab) */}
              <div 
                onClick={() => setActiveTab('online')}
                className="bg-[#4a2311] p-4 min-h-[110px] flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-200 hover:bg-[#5c2b15] active:bg-[#2e150a] active:shadow-[inset_0_0_15px_rgba(16,185,129,0.8)] group"
              >
                <Activity className="text-emerald-400 group-active:scale-110 transition-transform" size={20} />
                <div className="mt-2">
                  <p className="text-[20px] font-black text-emerald-400 leading-none">{onlineUsers.length}</p>
                  <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-tight mt-1">Live Pulse</p>
                </div>
              </div>

              {/* Box 4: Users Directory (Action Button) */}
              <div 
                onClick={() => navigate('/admin/users')}
                className="bg-[#4a2311] p-4 min-h-[110px] flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-200 hover:bg-[#5c2b15] active:bg-[#2e150a] active:shadow-[inset_0_0_15px_rgba(16,185,129,0.8)] group"
              >
                <Users className="text-zinc-300 group-active:text-emerald-400" size={22} />
                <p className="text-[10px] text-white font-black uppercase tracking-wider mt-3">Users Main</p>
              </div>

              {/* Box 5: Placeholder for future modules */}
              <div className="bg-[#4a2311] p-4 min-h-[110px] flex flex-col justify-center items-center text-center opacity-40 select-none">
                <div className="w-5 h-5 border border-dashed border-zinc-500 rounded-md"></div>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-3">Empty Slot</p>
              </div>

              {/* Box 6: Placeholder for future modules */}
              <div className="bg-[#4a2311] p-4 min-h-[110px] flex flex-col justify-center items-center text-center opacity-40 select-none">
                <div className="w-5 h-5 border border-dashed border-zinc-500 rounded-md"></div>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-3">Empty Slot</p>
              </div>

              {/* Box 7: Placeholder for future modules */}
              <div className="bg-[#4a2311] p-4 min-h-[110px] flex flex-col justify-center items-center text-center opacity-40 select-none">
                <div className="w-5 h-5 border border-dashed border-zinc-500 rounded-md"></div>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-3">Empty Slot</p>
              </div>

              {/* Box 8: Placeholder for future modules */}
              <div className="bg-[#4a2311] p-4 min-h-[110px] flex flex-col justify-center items-center text-center opacity-40 select-none">
                <div className="w-5 h-5 border border-dashed border-zinc-500 rounded-md"></div>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-3">Empty Slot</p>
              </div>

              {/* Box 9: Placeholder for future modules */}
              <div className="bg-[#4a2311] p-4 min-h-[110px] flex flex-col justify-center items-center text-center opacity-40 select-none">
                <div className="w-5 h-5 border border-dashed border-zinc-500 rounded-md"></div>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-3">Empty Slot</p>
              </div>

            </div>
          </div>
        )}

        {/* ONLINE USERS ACTIVE DIRECTORY VIEWPORT */}
        {activeTab === 'online' && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider px-1">Live Sessions ({onlineUsers.length})</p>
            {onlineUsers.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">Nobody is online at the moment, boss.</div>
            ) : (
              onlineUsers.map((user) => (
                <div 
                  key={user.id}
                  onClick={() => navigate(`/admin/users/edit/${user.id}`)}
                  className="p-4 bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 rounded-2xl flex items-center justify-between cursor-pointer transition-all active:scale-99"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10">
                      <img 
                        src={user.profilePic || 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238a8d91"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E'} 
                        className="w-full h-full rounded-full object-cover border border-white/10" 
                        alt="" 
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1c1e22] rounded-full"></span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">@{user.username || 'unknown_boss'}</h4>
                      <p className="text-[11px] text-zinc-500 truncate max-w-[180px]">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Modify Account</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* BROADCAST ANNOUNCEMENT TAB */}
        {activeTab === 'broadcast' && (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl"><Megaphone size={24} /></div>
              <div><h3 className="font-bold">Global Broadcast</h3><p className="text-xs text-zinc-500">Pushes a continuous system alert across all active client accounts.</p></div>
            </div>
            <form onSubmit={sendBroadcast} className="space-y-3">
              <textarea rows="4" placeholder="Type platform wide alert text message, boss..." value={announcement} onChange={(e) => setAnnouncement(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none text-sm focus:border-purple-500 transition-colors resize-none" />
              <button type="submit" disabled={!announcement.trim()} className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md">Broadcast Announcement</button>
            </form>
          </div>
        )}

        {/* REPORTS VIEWPORT TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">Clean slate! No reported items right now, boss.</div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="p-4 bg-red-950/10 border border-red-900/20 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div><span className="text-[10px] uppercase font-black bg-red-600 text-white px-2 py-0.5 rounded">Reason: {report.reason || "Violation"}</span><p className="text-xs text-zinc-400 mt-1">Reported by: @{report.reportedByUsername}</p></div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-sm italic text-zinc-300">
                    "{report.postText || "Media Post Link"}"
                    {report.postImage && <img src={report.postImage} className="mt-2 w-24 h-24 rounded-lg object-cover" alt="" />}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
