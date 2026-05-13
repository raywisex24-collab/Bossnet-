import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  deleteUser 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc, 
  arrayRemove, 
  collectionGroup 
} from 'firebase/firestore';
import { ArrowLeft, AlertTriangle, ShieldAlert, Zap, Globe, Heart, MessageSquare, Image, Users, Lock, Mail, Check } from 'lucide-react';
import Swal from 'sweetalert2';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeleteProcess = async () => {
    const user = auth.currentUser;
    if (!user) return;
    if (!email || !password) {
      Swal.fire({ title: 'Required', text: 'Enter email and password.', icon: 'error', background: '#1a0000', color: '#ffffff' });
      return;
    }
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(user, credential);
      const batch = writeBatch(db);
      const userId = user.uid;
      const postsQuery = query(collection(db, "posts"), where("userId", "==", userId));
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach((doc) => batch.delete(doc.ref));
      const reelsQuery = query(collection(db, "videos"), where("userId", "==", userId));
      const reelsSnapshot = await getDocs(reelsQuery);
      reelsSnapshot.forEach((doc) => batch.delete(doc.ref));
      const userRef = doc(db, "users", userId);
      batch.delete(userRef);
      await batch.commit();
      await deleteUser(user);
      await Swal.fire({ title: 'DELETED', icon: 'success', background: '#1a0000', color: '#ffffff' });
      navigate('/login', { replace: true });
    } catch (error) {
      Swal.fire({ title: 'Error', text: "Verification failed.", icon: 'error', background: '#1a0000', color: '#ffffff' });
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { icon: <Globe className="text-blue-400" size={24} />, title: "Public Identity", content: "Your unique username and display name will be released immediately upon confirmation of this action. Once released, the handle will become publicly available and may be claimed at any time by any existing or newly registered member without restriction. Access to the username and display name cannot be guaranteed after release, as availability will be determined on a first-come, first-served basis. Any association, visibility, recognition, or account identity connected to the current handle may no longer remain linked after the process has been completed." },
    { icon: <Zap className="text-yellow-400" size={24} />, title: "Verification", content: "All badges, achievements, milestones, account recognitions, status indicators, and associated privileges connected to the account will be permanently revoked and removed immediately following confirmation of this action. This includes, but is not limited to, verification marks, contribution acknowledgements, participation rewards, ranking history, exclusive access benefits, loyalty indicators, and any publicly visible accomplishments previously earned or assigned to the account. Once revoked, these items may no longer be accessible, recoverable, transferable, or reinstated, and any historical association tied to them may be permanently cleared from the account’s active profile and visibility across the platform." },
    { icon: <Image className="text-purple-400" size={24} />, title: "Media Purge", content: "All Bossnet reels, photos, media uploads, visual content, archived posts, and associated gallery items connected to the account will be permanently removed from public visibility and account storage immediately upon completion of this action. This removal includes all published and unpublished media, edited versions, saved drafts, highlights, tagged visual content, and any associated engagement history linked to the affected uploads. Once permanently deleted, the content may no longer be recoverable, restored, transferred, or accessed through the account or any connected Bossnet services, and any references, previews, thumbnails, or visibility associated with the removed media may also be cleared from the platform over time." },
    { icon: <Users className="text-green-400" size={24} />, title: "Network", content: "All followers, following lists, social connections, subscription records, mutual account links, and related network activity associated with the account have been permanently cleared and removed from visibility. This action includes the complete removal of follower counts, followed accounts, pending connection requests, accepted requests, close connections, suggested relationship history, and any linked social interaction data connected to the profile. Once the process has been completed, previously established account connections may no longer appear across the platform, and the associated network history may not be recoverable, restorable, or transferable through future account activity or system requests." },
    { icon: <Heart className="text-red-400" size={24} />, title: "Interactions", content: "All likes, comments, reactions, replies, engagement history, and associated interaction records connected to the account have been permanently scrubbed and removed from platform visibility and activity logs. This includes reactions made on posts, reels, photos, stories, shared content, community discussions, and any previously published interactions associated with the account across supported sections of the platform. In addition, all written responses, public feedback, comment threads, pinned interactions, and engagement-related activity tied to the account may no longer remain accessible to other users or linked to existing content. Once this action has been finalized, the removed interaction history may not be recoverable, restorable, or reinstated through future account access, recovery requests, or profile synchronization processes." },
    { icon: <MessageSquare className="text-indigo-400" size={24} />, title: "Private Messages", content: "All historical conversations, message records, archived chats, shared media exchanges, communication logs, and associated interaction history connected to the account have been permanently terminated and removed from active access. This action includes the deletion of direct messages, group conversations, temporary chats, archived threads, synchronized message history, shared attachments, voice notes, and any related communication data previously linked to the account across supported services and connected devices. Following completion of this process, terminated conversations may no longer be visible, accessible, retrievable, or recoverable through account restoration, synchronization, backup access, or future login activity, and any associated references or conversation history may be permanently cleared from platform records over time." },
    { icon: <ShieldAlert className="text-orange-400" size={24} />, title: "Pro Tools", content: "Access to all Bossnet premium features, subscription privileges, enhanced account tools, exclusive platform benefits, and member-only services has been permanently terminated and disabled for the account. This includes the removal of advanced customization options, priority access tools, premium visibility enhancements, monetization features, exclusive content privileges, expanded storage access, verification-related benefits, early feature availability, and any additional services previously granted through an active premium status or subscription plan. Upon completion of this action, the account will no longer retain access to restricted premium functionality, and any associated subscription history, entitlement records, or feature-based privileges may no longer remain active, recoverable, transferable, or eligible for reinstatement without a new authorization or subscription process through Bossnet." }
  ];

  return (
    <div style={{ backgroundColor: '#450a0a', color: '#ffffff' }} className="min-h-screen flex flex-col font-sans relative overflow-hidden">
      
      {/* Fixed Header */}
      <div style={{ backgroundColor: '#7f1d1d' }} className="p-5 flex items-center border-b border-white/10 sticky top-0 z-50">
        <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer mr-6 text-white" size={28} />
        <h1 className="text-xl font-black text-white uppercase">Account Deletion</h1>
      </div>

      <div className="flex-1 overflow-y-auto bg-black/20">
        {/* Banner */}
        <div style={{ backgroundColor: '#1a0000' }} className="p-10 text-center border-b border-white/5">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <AlertTriangle size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase">Permanent Action</h2>
          <p className="text-red-300 text-sm font-bold">This cannot be undone.</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-10 pb-10">
          <h3 className="text-[10px] font-black text-red-400 uppercase tracking-[3px]">Loss Disclosure</h3>
          {sections.map((section, idx) => (
            <div key={idx} className="flex gap-5">
              <div className="shrink-0">{section.icon}</div>
              <div>
                <h4 className="font-black text-white text-base mb-1">{section.title}</h4>
                <p className="text-red-100/60 text-xs leading-relaxed font-bold">{section.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Inputs at the bottom of scroll */}
        <div style={{ backgroundColor: '#1a0000' }} className="p-6 space-y-4 border-t border-white/10">
          <p className="text-[10px] font-black text-white uppercase tracking-[2px]">Confirm Ownership</p>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={18} />
            <input 
              type="email" 
              placeholder="Confirm account email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
              className="w-full pl-12 pr-4 py-4 rounded-xl focus:outline-none text-base font-black placeholder:text-gray-400 border-2 border-red-600"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={18} />
            <input 
              type="password" 
              placeholder="Confirm password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
              className="w-full pl-12 pr-4 py-4 rounded-xl focus:outline-none text-base font-black placeholder:text-gray-400 border-2 border-red-600"
            />
          </div>
        </div>
      </div>

      {/* Footer - No White Space */}
      <div style={{ backgroundColor: '#7f1d1d' }} className="p-6 border-t border-white/10">
        <div 
          onClick={() => setIsConfirmed(!isConfirmed)}
          style={{ backgroundColor: '#1a0000' }}
          className="flex items-center gap-4 p-4 rounded-xl cursor-pointer active:scale-95 border border-white/5"
        >
          <div className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
            isConfirmed ? 'bg-red-500 border-red-500' : 'bg-transparent border-white/30'
          }`}>
            {isConfirmed && <Check size={16} className="text-white" />}
          </div>
          <div>
            <p className="font-black text-sm text-white">Acknowledge</p>
            <p className="text-[10px] text-red-300 font-bold">Data is non-recoverable.</p>
          </div>
        </div>

        <button
          disabled={!isConfirmed || loading}
          onClick={handleDeleteProcess}
          className={`w-full py-4 mt-4 rounded-xl font-black uppercase text-[10px] tracking-[2px] transition-all ${
            isConfirmed 
              ? 'bg-red-600 text-white shadow-lg active:bg-red-700' 
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
        >
          {loading ? "Wiping..." : "Delete Permanently"}
        </button>
      </div>
    </div>
  );
}

