import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, doc, getDoc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
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

  useEffect(() => {
    if (!isAdmin) return;

    const unsubReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubUsersCount = onSnapshot(collection(db, "users"), (snapshot) => {
      setStats(prev => ({ ...prev, usersCount: snapshot.docs.length }));
    });

    return () => { unsubReports(); unsubUsersCount(); };
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
    <div className="min-h-screen bg-boss-bg flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text font-sans pb-24">
      {/* Fixed Header */}
      <div className="flex items-center gap-4 p-4 border-b border-white/10 sticky top-0 bg-boss-bg z-50">
        <ArrowLeft onClick={() => navigate('/feed')} className="cursor-pointer text-zinc-400 hover:text-white" />
        <div className="flex items-center gap-2">
          <Shield className="text-blue-500" size={22} />
          <h1 className="text-xl font-bold tracking-tight">ADMIN PANEL</h1>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto mt-2 space-y-6">
        {/* Metric Quick Stats Banner */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
            <div><p className="text-xs text-zinc-500 font-bold uppercase">Total Number Of Users</p><p className="text-2xl font-black mt-1">{stats.usersCount}</p></div>
            <Users className="text-blue-500/40" size={28} />
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
            <div><p className="text-xs text-zinc-500 font-bold uppercase">Unread Alerts</p><p className="text-2xl font-black mt-1 text-red-500">{reports.length}</p></div>
            <AlertTriangle className="text-red-500/40" size={28} />
          </div>
        </div>

        {/* Dashboard Nav Segments */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400'}`}>Control Deck</button>
          <button onClick={() => setActiveTab('reports')} className={`flex-1 py-2 text-xs font-bold rounded-lg relative transition-all ${activeTab === 'reports' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400'}`}>Reports Center {reports.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-red-600 text-[9px] px-1.5 py-0.5 rounded-full font-black">{reports.length}</span>}</button>
          <button onClick={() => setActiveTab('broadcast')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'broadcast' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-400'}`}>Broadcast Hook</button>
        </div>

        {/* CONTROLS GRID TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider px-1">Platform Modules</p>
            <div 
              onClick={() => navigate('/admin/users')}
              className="group p-5 bg-gradient-to-r from-blue-600/10 to-transparent border border-blue-500/20 rounded-2xl flex items-center justify-between cursor-pointer hover:border-blue-500/40 transition-all active:scale-98"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl group-hover:scale-110 transition-transform"><Users size={24} /></div>
                <div><h3 className="font-bold text-base">Users Directory</h3><p className="text-xs text-zinc-400 mt-0.5">Manage users credentials</p></div>
              </div>
            </div>
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

