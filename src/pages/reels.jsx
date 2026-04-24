import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase'; 
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, increment, addDoc, serverTimestamp, getDocs, where, limit, getDoc, deleteDoc } from 'firebase/firestore';
import { Heart, MessageCircle, Share2, Music, MoreVertical, Play, ArrowLeft, Send, X, Download, Repeat2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VerifiedBadge from './VerifiedBadge'; // Since they are in the same folder

const ReelItem = ({ post }) => {
  const videoRefs = useRef([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [heartPos, setHeartPos] = useState({ x: 0, y: 0 });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  const navigate = useNavigate();
  const user = auth.currentUser;
  const longPressTimer = useRef(null);
  const shareLongPressTimer = useRef(null);

  // Original Intersection Observer
  useEffect(() => {
    const options = { threshold: 0.7 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playCurrentVideo();
          setIsPlaying(true);
        } else {
          pauseAllVideos();
          setIsPlaying(false);
        }
      });
    }, options);

    const currentItem = videoRefs.current[0]?.closest('.reel-container');
    if (currentItem) observer.observe(currentItem);
    return () => { if (currentItem) observer.unobserve(currentItem); };
  }, [activeIndex]);

  // Comments Listener: Sorted by Likes (Desc) then Newest
  // Comments Listener: Fixed Query & Real-time updates
  useEffect(() => {
    if (showComments) {
      // Note: If comments still don't show, check the browser console for a Firebase Index link
      const q = query(
        collection(db, "videos", post.id, "comments"), 
        orderBy("createdAt", "desc") 
      );
      
      const unsub = onSnapshot(q, (snap) => {
        const fetchedComments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Manual Sort: Highest likes first, then newest
        const sorted = fetchedComments.sort((a, b) => {
          if (b.likes !== a.likes) return b.likes - a.likes;
          return b.createdAt?.seconds - a.createdAt?.seconds;
        });
        
        setComments(sorted);
      });
      return () => unsub();
    }
  }, [showComments, post.id]);

  // Fetch Friends for Share List
  useEffect(() => {
    if (showShareModal && user) {
      const q = query(collection(db, "users"), limit(20));
      getDocs(q).then(snap => {
        setFriends(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(f => f.id !== user.uid));
      });
    }
  }, [showShareModal, user]);

  const playCurrentVideo = () => {
    const currentVid = videoRefs.current[activeIndex];
    if (currentVid && currentVid.tagName === 'VIDEO') {
      currentVid.play().catch(err => console.log("Auto-play blocked"));
    }
  };

  const pauseAllVideos = () => {
    videoRefs.current.forEach(vid => {
      if (vid && vid.tagName === 'VIDEO') vid.pause();
    });
  };

  const handleHorizontalScroll = (e) => {
    const width = e.target.offsetWidth;
    const newIndex = Math.round(e.target.scrollLeft / width);
    if (newIndex !== activeIndex) {
      pauseAllVideos();
      setActiveIndex(newIndex);
    }
  };

  // Double Tap Like Logic
  const handleDoubleTap = async (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHeartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 800);

    if (!user || post.likedBy?.includes(user.uid)) return;

    const postRef = doc(db, "videos", post.id);
    await updateDoc(postRef, {
      likedBy: arrayUnion(user.uid),
      likes: increment(1)
    });
  };

  const handleLikeClick = async () => {
    if (!user) return;
    const postRef = doc(db, "videos", post.id);
    const isLiked = post.likedBy?.includes(user.uid);
    await updateDoc(postRef, {
      likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      likes: isLiked ? increment(-1) : increment(1)
    });
  };

  // 1.1s Long Press Logic for Main Screen (Download)
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowDownloadMenu(true);
    }, 1100);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  // 1.1s Long Press Logic for Share Button
  const handleShareLongPressStart = (e) => {
    e.stopPropagation();
    shareLongPressTimer.current = setTimeout(() => {
      if (navigator.share) {
        navigator.share({
          title: 'BossNet Reel',
          text: post.caption,
          url: window.location.href,
        });
      }
    }, 1100);
  };

  const handleShareLongPressEnd = () => {
    clearTimeout(shareLongPressTimer.current);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      const postRef = doc(db, "videos", post.id);

      await addDoc(collection(db, "videos", post.id, "comments"), {
        text: commentText,
        userId: user.uid,
        username: userData.username || "Anonymous User",
        userImg: userData.profilePic || userData.userImg || "",
        isVerified: userData.isVerified || false,
        likes: 0,
        replyCount: 0,
        likedBy: [],
        createdAt: serverTimestamp()
      });

      await updateDoc(postRef, { commentsCount: increment(1) });
      setCommentText("");
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    } catch (err) {
      console.error("Comment Error:", err);
    }
  };

  const handleReplyToComment = async (parentComment) => {
    if (!commentText.trim() || !user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      const repliesRef = collection(db, "videos", post.id, "comments", parentComment.id, "replies");
      await addDoc(repliesRef, {
        text: commentText,
        userId: user.uid,
        username: userData.username || "Anonymous User",
        userImg: userData.profilePic || "",
        isVerified: userData.isVerified || false,
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp()
      });

      const parentDocRef = doc(db, "videos", post.id, "comments", parentComment.id);
      await updateDoc(parentDocRef, { replyCount: increment(1) });
      
      setCommentText("");
      document.activeElement.blur();
    } catch (err) {
      console.error("Reply Error:", err);
    }
  };

  const handleCommentLike = async (commentId, likedBy) => {
    if (!user) return;
    const comRef = doc(db, "videos", post.id, "comments", commentId);
    const isLiked = likedBy?.includes(user.uid);
    await updateDoc(comRef, {
      likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      likes: isLiked ? increment(-1) : increment(1)
    });
  };

  const deleteComment = async (commentId) => {
    if (!user) return;
    // Post creator or Comment author can delete
    const isCreator = user.uid === post.userId;
    const commentRef = doc(db, "videos", post.id, "comments", commentId);
    
    // Note: To delete all sub-comments automatically, you'd usually use a Firebase Function.
    // For client-side, we delete the main ref and the counter.
    await deleteDoc(commentRef);
    await updateDoc(doc(db, "videos", post.id), { 
      commentsCount: increment(-1) 
    });
  };

  return (
    <div 
      className="h-screen w-full snap-start relative bg-black flex items-center justify-center reel-container"
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. HORIZONTAL MEDIA CAROUSEL */}
      <div onScroll={handleHorizontalScroll} className="w-full h-full overflow-x-auto snap-x snap-mandatory flex no-scrollbar scroll-smooth">
        {post.media && post.media.map((item, index) => (
          <div key={index} className="w-full h-full min-w-full snap-center relative flex items-center justify-center" onDoubleClick={handleDoubleTap}>
            {item.type === 'video' ? (
              <video 
                ref={el => videoRefs.current[index] = el}
                src={item.url} 
                className="h-full w-full object-contain md:object-cover" 
                loop playsInline 
                onClick={() => {
                  const vid = videoRefs.current[index];
                  vid.paused ? vid.play() : vid.pause();
                  setIsPlaying(!vid.paused);
                }}
              />
            ) : (
              <img src={item.url} className="h-full w-full object-contain md:object-cover" alt="reel-content" />
            )}

            {showHeartAnim && (
              <div className="absolute pointer-events-none animate-heart-pop" style={{ left: heartPos.x - 50, top: heartPos.y - 50 }}>
                <Heart size={99} fill="#FF3040" color="#FF3040" />
              </div>
            )}

            {item.type === 'video' && !isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/20 p-5 rounded-full backdrop-blur-sm"><Play size={30} fill="white" color="white" className="ml-1" /></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 2. CAROUSEL DOTS INDICATOR */}
      {post.media?.length > 1 && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-1.5 z-50">
          {post.media.map((_, i) => (
            <div key={i} className={`transition-all duration-300 rounded-full ${i === activeIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'}`} />
          ))}
        </div>
      )}

      {/* 3. HEADER OVERLAY */}
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-[60]">
        <div className="flex items-center gap-4">
          <ArrowLeft size={28} className="text-white cursor-pointer active:scale-90" onClick={() => navigate('/feed')} />
          <h2 className="text-white text-xl font-black italic tracking-tighter">REELS</h2>
        </div>
        <MoreVertical size={24} className="text-white" />
      </div>

      {/* 4. RIGHT SIDE ACTIONS */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-5 items-center z-30">
        <div className="relative mb-2" onClick={() => navigate(`/profile/${post.userId}`)}>
          <div className="w-11 h-11 rounded-full border-2 border-white overflow-hidden shadow-lg"><img src={post.userProfilePic || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="pfp" /></div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#1877F2] rounded-full w-4 h-4 flex items-center justify-center border-2 border-black"><span className="text-white text-[10px] font-bold">+</span></div>
        </div>

        <div className="flex flex-col items-center" onClick={handleLikeClick}>
          <Heart size={32} className={`drop-shadow-lg transition-all ${post.likedBy?.includes(user?.uid) ? 'text-[#FF3040] fill-[#FF3040]' : 'text-white'}`} />
          <span className="text-white text-[11px] font-bold mt-1">{post.likes || '0'}</span>
        </div>
        
        <div className="flex flex-col items-center" onClick={() => setShowComments(true)}>
          <MessageCircle size={32} color="white" className="drop-shadow-lg" />
          <span className="text-white text-[11px] font-bold mt-1">{post.commentsCount || '0'}</span>
        </div>

        <div 
          className="flex flex-col items-center cursor-pointer"
          onClick={() => setShowShareModal(true)}
          onMouseDown={handleShareLongPressStart}
          onMouseUp={handleShareLongPressEnd}
          onTouchStart={handleShareLongPressStart}
          onTouchEnd={handleShareLongPressEnd}
        >
          <Share2 size={30} color="white" className="drop-shadow-lg" />
        </div>

        <div className="w-9 h-9 rounded-full border-2 border-zinc-500 overflow-hidden animate-spin-slow mt-2 p-1 bg-black/50 backdrop-blur-md">
           <img src={post.userProfilePic} className="w-full h-full rounded-full object-cover" alt="" />
        </div>
      </div>

      {/* 5. BOTTOM INFO AREA */}
      <div className="absolute bottom-8 left-4 right-16 z-30">
        {post.isReposted && (
          <div className="flex items-center gap-1 mb-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            <Repeat2 size={12} /> Reposted from {post.originalAuthor}
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-bold lowercase tracking-tight">{post.username || "..."}</h1>
            <VerifiedBadge isVerified={post.isVerified} />
          </div>
          <span className="w-1 h-1 bg-white rounded-full"></span>
          <button className="text-[11px] font-bold text-[#1877F2]">Follow</button>
        </div>
        <p className="text-white text-[13px] leading-snug line-clamp-2 mb-4 font-medium">{post.caption}</p>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg border border-white/10 rounded-full px-3 py-2 w-fit">
          <Music size={12} className="text-white animate-pulse" />
          <div className="overflow-hidden w-36"><div className="whitespace-nowrap text-white text-[10px] font-bold uppercase tracking-widest animate-marquee">{post.songName || `Original Audio`}</div></div>
        </div>
      </div>

      {/* 6. COMMENT BOTTOM SHEET - FIXED POSITIONING */}
      {showComments && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowComments(false)} />
          <div className="relative bg-[#121212] w-full h-[75%] rounded-t-[30px] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-white/5">
              <h3 className="text-white font-black text-sm uppercase tracking-widest">Comments ({post.commentsCount})</h3>
              <div className="p-2 bg-white/5 rounded-full" onClick={() => setShowComments(false)}><X size={20} className="text-zinc-400" /></div>
            </div>

            {/* Comment List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-24">
              {comments.map((com) => (
                <div key={com.id} className="group flex flex-col gap-2">
                  <div className="flex gap-3 items-start">
                    <img 
                      src={com.userImg || 'https://via.placeholder.com/150'} 
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white/5" 
                      alt="User Avatar" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white text-[13px] font-bold">{com.username}</p>
                        <VerifiedBadge isVerified={com.isVerified} />
                        <span className="text-[10px] text-zinc-500">• {com.likes || 0} likes</span>
                      </div>
                      <p className="text-zinc-200 text-[14px] mt-1 pr-4 leading-relaxed">{com.text}</p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <button 
                          onClick={() => {
                            setCommentText(`@${com.username} `);
                            // Logic to track that this is a reply can be added here
                          }}
                          className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-tighter"
                        >
                          Reply
                        </button>
                        {(user?.uid === com.userId || user?.uid === post.userId) && (
                          <button 
                            onClick={() => deleteComment(com.id)} 
                            className="text-[11px] font-extrabold text-red-500/70 uppercase tracking-tighter"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1 pt-2" onClick={() => handleCommentLike(com.id, com.likedBy)}>
                      <Heart size={18} className={com.likedBy?.includes(user?.uid) ? "text-red-500 fill-red-500" : "text-zinc-600"} />
                    </div>
                  </div>

                  {/* Sub-comment Indicator and Subsection */}
                  {com.replyCount > 0 && (
                    <div className="ml-12 mt-2 flex flex-col gap-4 border-l border-zinc-800 pl-4">
                      <div className="flex items-center gap-2 cursor-pointer group/arrow">
                        <div className="w-4 h-[1px] bg-zinc-800"></div>
                        <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1 group-hover/arrow:text-[#1877F2]">
                          View {com.replyCount} replies <Play size={8} className="rotate-90 fill-current" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input - Sticky at bottom with fixed padding for mobile */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#121212] border-t border-white/5 pb-8">
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
                <input 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                  placeholder="Drop a comment, boss..." 
                  className="flex-1 bg-transparent border-none text-white text-sm outline-none px-3"
                  onFocus={() => { /* This helps handle the visual shift on some browsers */ }}
                />
                <button onClick={handleAddComment} className="p-2.5 bg-[#1877F2] rounded-xl shadow-lg shadow-[#1877F2]/20 active:scale-90 transition-transform">
                  <Send size={18} color="white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. SHARE MODAL */}
      {showShareModal && (
        <div className="absolute inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowShareModal(false)} />
          <div className="relative bg-[#1c1c1e] w-full h-[50%] rounded-t-[30px] p-6 flex flex-col animate-in slide-in-from-bottom duration-300">
            <h3 className="text-white font-bold mb-4">Send to friends</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
              {friends.map(friend => (
                <div key={friend.id} className="flex flex-col items-center gap-2 min-w-[70px]">
                  <div className="w-14 h-14 rounded-full border border-zinc-700 p-0.5">
                    <img src={friend.profilePic || 'https://via.placeholder.com/150'} className="w-full h-full rounded-full object-cover" alt="" />
                  </div>
                  <p className="text-[10px] text-zinc-400 font-medium truncate w-full text-center">{friend.username}</p>
                  <button className="bg-[#1877F2] text-white text-[10px] font-bold px-3 py-1 rounded-full">Send</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. DOWNLOAD MENU */}
      {showDownloadMenu && (
        <div className="absolute inset-0 z-[110] bg-black/60 flex items-center justify-center p-10" onClick={() => setShowDownloadMenu(false)}>
          <div className="bg-[#1c1c1e] w-full max-w-[280px] rounded-3xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center border-b border-zinc-800">
              <p className="text-white font-bold">Reel Options</p>
            </div>
            <button className="w-full p-4 flex items-center justify-center gap-3 text-white font-semibold active:bg-zinc-800" onClick={() => {
              window.open(post.media[activeIndex].url, '_blank');
              setShowDownloadMenu(false);
            }}>
              <Download size={20} />
              <span>Save Video</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Reels = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="h-screen w-full bg-black overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-150%); } }
        .animate-marquee { display: inline-block; animation: marquee 10s linear infinite; }
        .animate-spin-slow { animation: spin 6s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes heart-pop { 
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-heart-pop { animation: heart-pop 0.8s ease-out forwards; }
      `}</style>
      
      {posts.length > 0 ? (
        posts.map((post) => <ReelItem key={post.id} post={post} />)
      ) : (
        <div className="h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-500 uppercase tracking-[4px] text-[10px] font-black">SYNCING REELS...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reels;
