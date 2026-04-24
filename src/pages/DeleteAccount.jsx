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
      Swal.fire({
        title: 'Required Fields',
        text: 'Please enter your email and password to verify ownership.',
        icon: 'error',
        background: '#ffffff',
        color: '#000000'
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Re-authenticate user for security
      const credential = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(user, credential);

      const batch = writeBatch(db);
      const userId = user.uid;

      // 2. SCRUB POSTS
      const postsQuery = query(collection(db, "posts"), where("userId", "==", userId));
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach((doc) => batch.delete(doc.ref));

      // 3. SCRUB REELS/VIDEOS
      const reelsQuery = query(collection(db, "videos"), where("userId", "==", userId));
      const reelsSnapshot = await getDocs(reelsQuery);
      reelsSnapshot.forEach((doc) => batch.delete(doc.ref));

      // 4. SCRUB COMMENTS (Across all posts in the app)
      try {
        const commentsQuery = query(collectionGroup(db, "comments"), where("userId", "==", userId));
        const commentDocs = await getDocs(commentsQuery);
        commentDocs.forEach((comment) => batch.delete(comment.ref));
      } catch (e) {
        console.log("Comment index note: If this fails, create a Collection Group index in Firebase Console.");
      }

      // 5. SCRUB NOTIFICATIONS (To and From user)
      const notifToQuery = query(collection(db, "notifications"), where("toUserId", "==", userId));
      const notifFromQuery = query(collection(db, "notifications"), where("fromUserId", "==", userId));
      const [toSnap, fromSnap] = await Promise.all([getDocs(notifToQuery), getDocs(notifFromQuery)]);
      toSnap.forEach(d => batch.delete(d.ref));
      fromSnap.forEach(d => batch.delete(d.ref));

      // 6. SCRUB RELATIONSHIPS (Remove user ID from other people's arrays)
      const followersQuery = query(collection(db, "users"), where("followers", "array-contains", userId));
      const followingQuery = query(collection(db, "users"), where("following", "array-contains", userId));
      const [follSnap, fingSnap] = await Promise.all([getDocs(followersQuery), getDocs(followingQuery)]);
      
      follSnap.forEach(uDoc => batch.update(uDoc.ref, { followers: arrayRemove(userId) }));
      fingSnap.forEach(uDoc => batch.update(uDoc.ref, { following: arrayRemove(userId) }));

      // 7. DELETE USER PROFILE DOCUMENT
      const userRef = doc(db, "users", userId);
      batch.delete(userRef);

      // --- COMMIT ALL DATA DELETIONS ---
      await batch.commit();

      // 8. DELETE THE AUTHENTICATION ACCOUNT
      await deleteUser(user);

      await Swal.fire({
        title: 'ACCOUNT DELETED',
        text: 'Your profile and data have been permanently removed.',
        icon: 'success',
        background: '#ffffff',
        color: '#000000'
      });

      navigate('/login', { replace: true });
    } catch (error) {
      console.error(error);
      let errorMessage = "Verification failed. Please check your credentials.";
      if (error.code === 'auth/wrong-password') errorMessage = "The password you entered is incorrect.";
      
      Swal.fire({
        title: 'Authentication Error',
        text: errorMessage,
        icon: 'error',
        background: '#ffffff',
        color: '#000000'
      });
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      icon: <Globe className="text-blue-600" size={24} />,
      title: "Public Identity & Handle",
      content: "Your unique username and display name will be released immediately. The handle may be claimed by any new or existing member."
    },
    {
      icon: <Zap className="text-yellow-600" size={24} />,
      title: "Account Status & Verification",
      content: "All account milestones, including verified status and badges, will be permanently revoked and cannot be restored."
    },
    {
      icon: <Image className="text-purple-600" size={24} />,
      title: "Media & Content Purge",
      content: "All uploaded media, including videos, reels, and photos, will be permanently removed from our storage servers."
    },
    {
      icon: <Users className="text-green-600" size={24} />,
      title: "Network & Connections",
      content: "Your entire network of followers and the list of accounts you follow will be wiped. All professional connections will be severed."
    },
    {
      icon: <Heart className="text-red-600" size={24} />,
      title: "Interactions & Engagement",
      content: "Historic interactions, including likes, comments, and saved collections, will be scrubbed from the platform's database."
    },
    {
      icon: <MessageSquare className="text-indigo-600" size={24} />,
      title: "Private Communications",
      content: "Access to your messaging inbox and all historical conversations will be terminated and permanently inaccessible."
    },
    {
      icon: <ShieldAlert className="text-orange-600" size={24} />,
      title: "Tool & Feature Access",
      content: "You will lose access to all integrated professional tools, dashboard customizations, and premium features."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans">
      <div className="p-5 flex items-center border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer mr-6 text-gray-900" size={28} />
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Account Deletion</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-10 text-center border-b border-gray-50">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">Permanent Action</h2>
          <p className="text-gray-600 mt-3 text-base font-bold">Review the impact and verify ownership below.</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="Confirm account email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-black focus:bg-white transition-all text-base font-bold"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="password" 
              placeholder="Confirm password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-black focus:bg-white transition-all text-base font-bold"
            />
          </div>
        </div>

        <div className="p-6 space-y-12 pb-32">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[3px] border-b-2 border-gray-100 pb-3">Loss Disclosure</h3>
          {sections.map((section, idx) => (
            <div key={idx} className="flex gap-6">
              <div className="mt-1 shrink-0">{section.icon}</div>
              <div>
                <h4 className="font-black text-gray-900 text-lg mb-1">{section.title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed font-bold">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-white border-t-2 border-gray-100 shadow-[0_-15px_50px_rgba(0,0,0,0.05)]">
        <div 
          onClick={() => setIsConfirmed(!isConfirmed)}
          className="flex items-start gap-4 p-5 rounded-2xl cursor-pointer group transition-all active:scale-95"
        >
          <div className={`mt-1 shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
            isConfirmed ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300 group-hover:border-gray-900'
          }`}>
            {isConfirmed && <Check size={18} className="text-white stroke-[4px]" />}
          </div>
          <div>
            <p className="font-black text-base text-gray-900">Acknowledge Consequences</p>
            <p className="text-sm text-gray-500 font-bold mt-1 leading-tight">I understand that all data associated with this profile is non-recoverable.</p>
          </div>
        </div>

        <button
          disabled={!isConfirmed || loading}
          onClick={handleDeleteProcess}
          className={`w-full py-5 mt-4 rounded-2xl font-black uppercase text-xs tracking-[3px] transition-all shadow-xl ${
            isConfirmed 
              ? 'bg-red-600 text-white shadow-red-200 active:bg-red-700' 
              : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
          }`}
        >
          {loading ? "Wiping Data..." : "Confirm Permanent Deletion"}
        </button>
      </div>
    </div>
  );
}

