import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, query, where, getDocs, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { Users, Plus, Search, ChevronRight, Globe, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GroupPage = () => {
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const navigate = useNavigate();

  // Fetch Public Groups
  useEffect(() => {
    const fetchGroups = async () => {
      const q = query(collection(db, "groups"), where("privacy", "==", "public"));
      const snap = await getDocs(q);
      setGroups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const docRef = await addDoc(collection(db, "groups"), {
        name: newGroupName,
        adminId: auth.currentUser.uid,
        members: [auth.currentUser.uid],
        privacy: isPublic ? "public" : "private",
        createdAt: serverTimestamp(),
        memberCount: 1
      });
      setShowCreateModal(false);
      navigate(`/groups/${docRef.id}`);
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  return (
    <div style={pageContainer}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Groups</h1>
        <button onClick={() => setShowCreateModal(true)} style={createBtn}>
          <Plus size={20} /> Create
        </button>
      </div>

      {/* Search Bar */}
      <div style={searchContainer}>
        <Search size={18} color="#888" />
        <input placeholder="Search public groups..." style={searchInput} />
      </div>

      {/* Discovery Section */}
      <div style={{ padding: '20px' }}>
        <h2 style={sectionTitle}>Suggested for you</h2>
        {groups.map(group => (
          <div key={group.id} style={groupCard} onClick={() => navigate(`/groups/${group.id}`)}>
            <div style={groupAvatar}>{group.name[0]}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 'bold' }}>{group.name}</p>
              <p style={{ fontSize: '12px', color: '#888' }}>{group.memberCount} members</p>
            </div>
            <ChevronRight size={18} color="#444" />
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px' }}>Create New Group</h2>
            <form onSubmit={handleCreateGroup}>
              <input 
                style={modalInput} 
                placeholder="Group Name" 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <div style={privacyToggle}>
                <div 
                  onClick={() => setIsPublic(true)} 
                  style={isPublic ? activeToggle : inactiveToggle}
                >
                  <Globe size={16} /> Public
                </div>
                <div 
                  onClick={() => setIsPublic(false)} 
                  style={!isPublic ? activeToggle : inactiveToggle}
                >
                  <Lock size={16} /> Private
                </div>
              </div>
              <button type="submit" style={submitBtn}>Start Group</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const pageContainer = { minHeight: '100vh', backgroundColor: '#000', color: '#fff' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #222' };
const createBtn = { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#00f2ea', color: '#000', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', border: 'none' };
const searchContainer = { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#111', margin: '15px', padding: '10px 15px', borderRadius: '10px' };
const searchInput = { background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%' };
const sectionTitle = { fontSize: '14px', color: '#888', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1px' };
const groupCard = { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#0a0a0a', padding: '15px', borderRadius: '15px', marginBottom: '10px', border: '1px solid #111' };
const groupAvatar = { width: '45px', height: '45px', borderRadius: '12px', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' };
const modalOverlay = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 };
const modalContent = { backgroundColor: '#1a1a1a', width: '90%', maxWidth: '400px', padding: '25px', borderRadius: '25px' };
const modalInput = { width: '100%', padding: '12px', backgroundColor: '#222', border: 'none', borderRadius: '10px', color: '#fff', marginBottom: '20px' };
const privacyToggle = { display: 'flex', gap: '10px', marginBottom: '25px' };
const activeToggle = { flex: 1, padding: '10px', backgroundColor: '#00f2ea', color: '#000', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: 'bold', cursor: 'pointer' };
const inactiveToggle = { flex: 1, padding: '10px', backgroundColor: '#333', color: '#888', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' };
const submitBtn = { width: '100%', padding: '15px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold' };

export default GroupPage;
