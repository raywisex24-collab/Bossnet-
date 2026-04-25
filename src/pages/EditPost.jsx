import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';

export default function EditPost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      const docSnap = await getDoc(doc(db, "posts", postId));
      if (docSnap.exists()) {
        setText(docSnap.data().text);
      }
      setLoading(false);
    };
    fetchPost();
  }, [postId]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, "posts", postId), { text: text });
      navigate('/feed');
    } catch (err) { console.error(err); }
    setUpdating(false);
  };

  if (loading) return <div className="min-h-screen bg-boss-bg flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full"><ChevronLeft /></button>
          <h2 className="font-bold text-lg">Edit Post</h2>
          <button onClick={handleUpdate} disabled={updating} className="text-blue-500 font-bold disabled:opacity-50">
            {updating ? 'Saving...' : 'Done'}
          </button>
        </div>

        <textarea 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          className="w-full h-64 bg-transparent border-none text-lg focus:outline-none resize-none"
          placeholder="What's on your mind?"
        />
      </div>
    </div>
  );
}

