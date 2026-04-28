import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment, limit, deleteDoc, getDoc, getDocs, where } from 'firebase/firestore';
import { Heart, MessageSquare, MoreHorizontal, Globe, Lock, Send, X, Repeat2, Share2, Bookmark, Trash2, Flag, UserX, BellOff, EyeOff, Link, Edit, MessageCircleOff, Eye, UserPlus } from 'lucide-react';
import StoryAvatar from '../components/StoryAvatar';
import VerifiedBadge from './VerifiedBadge'; 

export default function Feed() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [followingStories, setFollowingStories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [zoomedImage, setZoomedImage] = useState(null);
  
  // New States for Menu and Reporting
  const [activeMenu, setActiveMenu] = useState(null);
  const [reportingPost, setReportingPost] = useState(null);
  const [reportMessage, setReportMessage] = useState("");
  const hasScrolledRef = useRef(false);

  // Comment States
  const [activePostForComments, setActivePostForComments] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [currentComments, setCurrentComments] = useState([]);

  // 1. Fetch User and Posts
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { navigate('/login'); return; }

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) setUserData(doc.data());
    });

    // Changed to 'asc' as requested for "going down" logic
    const qPosts = query(collection(db, "posts"), orderBy("createdAt", "asc"));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubUser(); unsubPosts(); };
  }, [navigate]);

  // 1.5. Listen for "Refresh" tap from Navbar
  useEffect(() => {
    const handleGlobalRefresh = () => {
      if (posts.length > 0) {
        const randomIndex = Math.floor(Math.random() * posts.length);
        const postElements = document.querySelectorAll('.post-container');
        
        if (postElements[randomIndex]) {
          postElements[randomIndex].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }
    };

    window.addEventListener('refreshFeed', handleGlobalRefresh);
    return () => window.removeEventListener('refreshFeed', handleGlobalRefresh);
  }, [posts]);

  // Fetch Stories Tray Logic - FETCH ALL MODE
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // We removed the 'where' filter to get EVERY story in the collection
    const q = query(collection(db, "stories"));

    const unsubStories = onSnapshot(q, (snap) => {
      const storyMap = {};
      let selfHasStory = false;
      const now = Date.now();

      snap.docs.forEach(doc => {
        const data = doc.data();
        const expiry = data.expiresAt;
        
        // Still filter for time so we don't see dead stories
        if (expiry > now) {
          if (data.userId === user.uid) {
            selfHasStory = true;
          } else {
            // Only add to others if it's not you
            if (!storyMap[data.userId]) {
              storyMap[data.userId] = {
                userId: data.userId,
                username: data.username,
                profilePic: data.profilePic,
                createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : 0 
              };
            }
          }
        }
      });

      const allOtherStories = Object.values(storyMap)
        .sort((a, b) => b.createdAt - a.createdAt);

      setUserData(prev => ({ ...prev, hasActiveStory: selfHasStory }));
      setFollowingStories(allOtherStories);
    });

    return () => unsubStories();
  }, []); // Only runs once on mount


  // 2. Real-time Comments Listener
  useEffect(() => {
    if (!activePostForComments) return;
    const q = query(collection(db, "posts", activePostForComments, "comments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setCurrentComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [activePostForComments]);

  // NEW: Reply State
  const [replyTo, setReplyTo] = useState(null); // {commentId, username}

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      const colPath = replyTo 
        ? collection(db, "posts", activePostForComments, "comments", replyTo.commentId, "replies")
        : collection(db, "posts", activePostForComments, "comments");

      await addDoc(colPath, {
        text: replyTo ? `@${replyTo.username} ${commentText}` : commentText,
        username: userData.username,
        userImg: userData.profilePic,
        isVerified: userData.isVerified || false,
        userId: auth.currentUser.uid,
        likes: [],
        createdAt: serverTimestamp()
      });

      if (!replyTo) {
        await updateDoc(doc(db, "posts", activePostForComments), { commentCount: increment(1) });
      }
      setCommentText("");
      setReplyTo(null);
    } catch (err) { console.error("Comment Error:", err); }
  };

  const handleLikeComment = async (postId, commentId, likes = [], isReply = false, parentId = null) => {
    const userId = auth.currentUser.uid;
    const commentRef = isReply 
      ? doc(db, "posts", postId, "comments", parentId, "replies", commentId)
      : doc(db, "posts", postId, "comments", commentId);
    
    try {
      if (likes.includes(userId)) {
        await updateDoc(commentRef, { likes: arrayRemove(userId) });
      } else {
        await updateDoc(commentRef, { likes: arrayUnion(userId) });
      }
    } catch (err) { console.error(err); }
  };

  // Sub-comment Listener Component (To avoid heavy re-renders)
  function ReplyList({ postId, commentId }) {
    const [replies, setReplies] = useState([]);
    useEffect(() => {
      const q = query(collection(db, "posts", postId, "comments", commentId, "replies"), orderBy("createdAt", "asc"));
      return onSnapshot(q, (snap) => setReplies(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, [postId, commentId]);

    return (
      <div className="ml-8 mt-2 space-y-3 border-l-2 border-white/5 pl-4">
        {replies.map(r => (
          <div key={r.id} className="flex gap-2 items-start">
            <img src={r.userImg} onClick={() => navigate(`/profile/${r.userId}`)} className="w-6 h-6 rounded-full object-cover cursor-pointer" />
            <div className="flex-1">
              <div className="bg-white/5 p-2 rounded-xl text-xs">
                <span onClick={() => navigate(`/profile/${r.userId}`)} className="font-bold text-blue-400 cursor-pointer">@{r.username} </span>
                <span className="text-zinc-200">{r.text}</span>
              </div>
              <button 
                onClick={() => handleLikeComment(postId, r.id, r.likes || [], true, commentId)}
                className={`text-[9px] font-bold mt-1 ml-1 ${r.likes?.includes(auth.currentUser.uid) ? 'text-red-500' : 'text-zinc-500'}`}
              >
                {r.likes?.length || 0} Likes
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Mini Preview Component for the Post Card
  function CommentPreview({ postId }) {
    const [topComments, setTopComments] = useState([]);
    useEffect(() => {
      const q = query(collection(db, "posts", postId, "comments"), orderBy("likes", "desc"), limit(2));
      return onSnapshot(q, (snap) => setTopComments(snap.docs.map(d => d.data())));
    }, [postId]);

    if (topComments.length === 0) return null;
    return (
      <div className="px-5 py-2 space-y-1 bg-black/10">
        {topComments.map((c, i) => (
          <p key={i} className="text-[11px] text-zinc-400 truncate">
            <span className="font-bold text-zinc-300">@{c.username}</span> {c.text}
          </p>
        ))}
      </div>
    );
  }

  const formatTime = (ts) => {
    if (!ts) return "Just now";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const sec = Math.floor((new Date() - date) / 1000);
    if (sec < 60) return "Just now";
    if (sec < 3600) return Math.floor(sec / 60) + "m";
    if (sec < 84600) return Math.floor(sec / 3600) + "h";
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full bg-boss-bg text-[#e4e6eb] min-h-screen">
      <main className="w-full max-w-lg mx-auto pb-10">
        
        {/* Stories Tray - Persistent Header Style */}
        <div className="w-full py-4 px-4 overflow-x-auto no-scrollbar flex items-center gap-1.5 bg-boss-bg border-b border-white/5">
          
          {/* PERSISTENT SELF BUTTON */}
          <div className="flex flex-col items-center gap-1.5 min-w-[75px] shrink-0">
            <div className="relative">
              {/* Profile Pic Circle */}
              <div 
                onClick={() => {
                  if (userData?.hasActiveStory) {
                    navigate(`/story-viewer/${auth.currentUser?.uid}`);
                  } else {
                    navigate('/upload-story'); // Changed from /me to /upload-story
                  }
                }}
                className={`p-[3px] rounded-full transition-all active:scale-90 cursor-pointer ${userData?.hasActiveStory ? 'bg-gradient-to-tr from-[#00f2ea] to-[#ff0050]' : 'bg-zinc-800'}`}
              >
                <div className="p-[2px] bg-boss-bg rounded-full">
                  <StoryAvatar 
                    userId={auth.currentUser?.uid} 
                    profilePic={userData?.profilePic} 
                    size="62px" 
                  />
                </div>
              </div>

              {/* GREEN PLUS BUTTON */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/upload-story');
                }}
                className="absolute bottom-1 right-1 bg-green-500 border-4 border-boss-bg w-5 h-5 rounded-full flex items-center justify-center text-white hover:bg-green-400 transition-colors shadow-lg"
              >
                <span className="text-lg font-bold mt-[-2px]">+</span>
              </button>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter text-center">
              YOU
            </span>
          </div>

          {/* OTHERS' STORIES */}
          {followingStories.map((story) => (
            <div 
              key={story.userId} 
              className="flex flex-col items-center gap-1.5 min-w-[72px] active:scale-95 transition-transform cursor-pointer"
              onClick={() => navigate(`/story-viewer/${story.userId}`)}
            >
              <div className="p-[3px] rounded-full bg-gradient-to-tr from-[#00f2ea] to-[#ff0050]">
                <div className="p-[2px] bg-boss-bg rounded-full">
                  <StoryAvatar 
                    userId={story.userId} 
                    profilePic={story.profilePic} 
                    size="62px" 
                  />
                </div>
              </div>
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-tighter truncate w-24 text-center">
                {story.username}
              </span>
            </div>
          ))}
        </div>

        {posts.map((post) => {
          const isLiked = post.likes ? post.likes.includes(auth.currentUser?.uid) : false;
          const isSaved = userData?.savedPosts?.includes(post.id);
          const isOwner = post.userId === auth.currentUser?.uid;
          const isRepostedByUser = posts.some(p => p.isRepost && p.originalPostId === post.id && p.userId === auth.currentUser.uid);

          // Hide logic
          if (post.hidden && !isOwner) return null;
          
          return (
<div key={post.id} className="post-container w-full mb-6 bg-transparent border-y border-white/5 md:border md:rounded-3xl overflow-hidden shadow-2xl relative">
              
              {post.isRepost && (
                <div className="px-4 pt-2 flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest border-b border-white/5 pb-2">
                   <Repeat2 size={12} className="text-blue-500" />
                   <span>Reposted from {post.originalOwnerName}</span>
                </div>
              )}

              {/* Header */}
              <div className="p-4 flex items-center justify-between relative">
<div className="flex items-center gap-3">
  <StoryAvatar 
    userId={post.userId} 
    profilePic={post.userId === auth.currentUser.uid ? userData?.profilePic : post.userImg} 
    size="40px" 
  />
  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="font-bold text-sm text-boss-text">{post.username}</h4>
                      <VerifiedBadge isVerified={post.isVerified} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                      <span>{formatTime(post.createdAt)}</span> · {post.privacy === 'private' ? <Lock size={10}/> : <Globe size={10}/>}
                    </div>
                  </div>
                </div>
                
                <button onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}>
                   <MoreHorizontal className="text-zinc-600" />
                </button>

                {/* DYNAMIC DROP DOWN MENU */}
                {activeMenu === post.id && (
                  <div className="absolute right-4 top-12 z-[200] w-64 bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                    {isOwner ? (
                      <>
                        <button onClick={() => { if(window.confirm("Delete post?")) deleteDoc(doc(db, "posts", post.id)) }} className="w-full px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-white/5 text-xs font-bold transition-colors">
                          <Trash2 size={16} /> Delete Post
                        </button>
                        <button onClick={() => handleHidePost(post.id, post.hidden)} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold transition-colors">
                          {post.hidden ? <Eye size={16} /> : <EyeOff size={16} />} {post.hidden ? "Show Post" : "Hide Post"}
                        </button>
                        <button onClick={() => copyPostLink(post)} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold transition-colors">
                          <Link size={16} /> Copy link of post
                        </button>
                        <button onClick={() => navigate(`/edit-post/${post.id}`)} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold transition-colors">
                          <Edit size={16} /> Edit post
                        </button>
                        <button onClick={() => handleToggleComments(post.id, post.commentsDisabled)} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold transition-colors">
                          <MessageCircleOff size={16} /> Turn off comments
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleReport(post)} className="w-full px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-white/5 text-xs font-bold">
                          <Flag size={16} /> Report post
                        </button>
                        <button onClick={() => { /* Logic for actual gallery save usually requires a library or server-side proxy */ alert("Saving to gallery...") }} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold">
                          <Bookmark size={16} /> Save to gallery
                        </button>
                        <button className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold">
                          <BellOff size={16} /> Turn off notifications
                        </button>
                        <button className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold">
                          {userData?.following?.includes(post.userId) ? <UserX size={16}/> : <UserPlus size={16}/>} {userData?.following?.includes(post.userId) ? "Unfollow" : "Follow"} user
                        </button>
                        <button onClick={() => handleHidePost(post.id, false)} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold">
                          <EyeOff size={16} /> Hide the post
                        </button>
                        <button onClick={() => copyPostLink(post)} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold">
                          <Link size={16} /> Copy the link
                        </button>
                        <button onClick={() => handleRepost(post)} className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 text-xs font-bold ${isRepostedByUser ? 'text-blue-500' : 'text-boss-text'}`}>
                          <Repeat2 size={16} /> {isRepostedByUser ? "Unrepost" : "Repost"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3 cursor-pointer" onClick={() => navigate(`/post/${post.isRepost ? post.originalPostId : post.id}`)}>
                <p className="text-[15px] leading-relaxed text-zinc-200">{post.text}</p>
              </div>

              {/* Multi-Image Swipe Logic */}
              {post.image && (
                <div className="relative group">
                  {/* ... all the old image code ... */}
                </div>
              )}

              {/* Post Content & Media */}
              <div 
                className={`transition-all duration-500 ${post.postType === 'text' ? 'aspect-square flex items-center justify-center p-8 text-center' : 'px-4 pb-3'}`}
                style={{ background: post.postType === 'text' ? post.textBg : 'transparent' }}
                onClick={() => navigate(`/post/${post.isRepost ? post.originalPostId : post.id}`)}
              >
                <p className={`${post.postType === 'text' ? 'text-2xl font-bold leading-tight' : 'text-[15px] leading-relaxed text-zinc-200'}`}>
                  {post.text}
                </p>
              </div>

              {/* Multi-Image Swipe Carousel */}
              {post.postType !== 'text' && (
                <>
                  {post.images && post.images.length > 0 ? (
                    <div className="relative group w-full bg-zinc-900/40">
                      <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth">
                        {post.images.map((img, idx) => (
                          <div 
                            key={idx} 
                            className="min-w-full snap-center flex justify-center cursor-zoom-in"
                            onClick={() => setZoomedImage({ images: post.images, index: idx })}
                          >
                            <img src={img} className="max-h-[500px] w-full object-cover" alt="" />
                          </div>
                        ))}
                      </div>
                      
                      {/* Image Indicator Dots */}
                      {post.images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 rounded-full bg-black/20 backdrop-blur-md">
                          {post.images.map((_, idx) => (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === 0 ? 'bg-white' : 'bg-white/40'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : post.image && (
                    <div className="w-full bg-zinc-900/40 flex justify-center cursor-zoom-in" onClick={() => setZoomedImage({ images: [post.image], index: 0 })}>
                      <img src={post.image} className="max-h-[500px] w-full object-cover" alt="" />
                    </div>
                  )}
                </>
              )}
              {/* Top 2 Comments Preview */}
              <CommentPreview postId={post.id} />

              {/* Interaction Bar */}
              <div className="p-3 flex items-center justify-between border-t border-white/5 px-6">
                <div className="flex flex-col items-center gap-1">
                   <button onClick={() => handleLike(post, post.likes || [])} className={`flex items-center gap-2 transition-all ${isLiked ? 'text-red-500' : 'text-zinc-400'}`}>
                      <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                      <span className="text-[11px] font-bold">Like</span>
                   </button>
                   <span className="text-[10px] text-zinc-500 font-bold">{post.likes?.length || 0}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <button onClick={() => setActivePostForComments(post.id)} className="flex items-center gap-2 text-zinc-400">
                      <MessageSquare size={18} />
                      <span className="text-[11px] font-bold">Comment</span>
                   </button>
                   <span className="text-[10px] text-zinc-500 font-bold">{post.commentCount || 0}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <button onClick={() => handleRepost(post)} className={`flex items-center gap-2 transition-colors ${isRepostedByUser ? 'text-blue-500' : 'text-zinc-400'}`}>
                      <Repeat2 size={18} />
                      <span className="text-[11px] font-bold">Repost</span>
                   </button>
                   <span className="text-[10px] text-zinc-500 font-bold">{post.repostCount || 0}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <button onClick={() => handleShare(post)} className="flex items-center gap-2 text-zinc-400 hover:text-blue-500">
                      <Share2 size={18} />
                   </button>
                   <span className="text-[10px] text-zinc-500 font-bold opacity-0">0</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <button onClick={() => handleSave(post)} className={`flex items-center gap-2 transition-colors ${isSaved ? 'text-yellow-500' : 'text-zinc-400'}`}>
                      <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
                   </button>
                   <span className="text-[10px] text-zinc-500 font-bold opacity-0">0</span>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* REPORT MODAL */}
      {reportingPost && (
        <div className="fixed inset-0 z-[500] bg-boss-bg/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[30px] p-6 border border-white/10 shadow-2xl">
            <h3 className="text-boss-text font-bold text-lg mb-2">Report Content</h3>
            <p className="text-zinc-400 text-xs mb-4">Explain why you are reporting @{reportingPost.username}'s post.</p>
            <textarea 
              value={reportMessage} 
              onChange={(e) => setReportMessage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-boss-text text-sm h-32 focus:outline-none focus:border-blue-500 mb-4" 
              placeholder="Your message..."
            />
            <div className="flex gap-3">
              <button onClick={() => setReportingPost(null)} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-sm">Cancel</button>
              <button onClick={submitReport} className="flex-1 py-3 bg-red-600 rounded-xl font-bold text-sm">Send</button>
            </div>
          </div>
        </div>
      )}


      {/* COMMENT PANEL */}
      {activePostForComments && (
        <div className="fixed inset-0 z-[300] bg-boss-bg/90 backdrop-blur-md flex flex-col justify-end">
          <div className="bg-[#1c1c1e] w-full max-h-[85vh] rounded-t-[30px] flex flex-col border-t border-white/10 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div>
                <h3 className="font-bold text-lg text-boss-text">Conversation</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">WRITE A COMMENT</p>
              </div>
              <button onClick={() => { setActivePostForComments(null); setReplyTo(null); }} className="p-2 bg-white/5 rounded-full text-zinc-400"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
              {currentComments.map(c => {
                const commentLiked = c.likes?.includes(auth.currentUser.uid);
                return (
                  <div key={c.id} className="mb-6">
                    <div className="flex gap-3 group">
                      <img 
                        src={c.userImg} 
                        onClick={() => navigate(`/profile/${c.userId}`)}
                        className="w-9 h-9 rounded-full object-cover cursor-pointer border-2 border-transparent active:border-blue-500" 
                      />
                      <div className="flex-1">
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate(`/profile/${c.userId}`)}>
                              <p className="text-[11px] font-bold text-blue-500">@{c.username}</p>
                              <VerifiedBadge isVerified={c.isVerified} />
                            </div>
                            {c.userId === auth.currentUser.uid && (
                              <button onClick={() => handleDeleteComment(activePostForComments, c.id)} className="text-zinc-600 hover:text-red-500">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-zinc-100">{c.text}</p>
                        </div>
                        
                        <div className="flex items-center gap-6 mt-2 ml-2">
                          <button onClick={() => handleLikeComment(activePostForComments, c.id, c.likes || [])} className={`flex items-center gap-1 text-[10px] font-bold ${commentLiked ? 'text-red-500' : 'text-zinc-500'}`}>
                            <Heart size={14} fill={commentLiked ? "currentColor" : "none"} />
                            {c.likes?.length || 0}
                          </button>
                          <button 
                            onClick={() => {
                              setReplyTo({ commentId: c.id, username: c.username });
                              document.getElementById('commentInput')?.focus();
                            }}
                            className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight"
                          >
                            Reply
                          </button>
                        </div>

                        {/* REPLIES SECTION */}
                        <ReplyList postId={activePostForComments} commentId={c.id} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Section */}
            <div className="p-4 bg-[#1c1c1e] border-t border-white/5">
              {replyTo && (
                <div className="flex items-center justify-between bg-blue-600/10 px-4 py-2 rounded-t-xl border-x border-t border-blue-500/20">
                  <p className="text-[10px] font-bold text-blue-400 uppercase">Replying to @{replyTo.username}</p>
                  <button onClick={() => setReplyTo(null)}><X size={12} className="text-blue-400"/></button>
                </div>
              )}
              <form onSubmit={handleAddComment} className="flex items-center gap-3 pb-8">
                <input 
                  id="commentInput"
                  type="text" 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Write a reply..."}
                  className={`flex-1 bg-white/5 border border-white/10 ${replyTo ? 'rounded-b-2xl rounded-t-none' : 'rounded-full'} px-5 py-3 text-sm text-boss-text focus:outline-none focus:border-blue-500/50`}
                />
                <button type="submit" className="p-3 bg-blue-600 rounded-full text-boss-text active:scale-90 shadow-lg shadow-blue-600/20">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

{/* Full-Screen Swipable Viewer */}
{zoomedImage && (
  <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200">
    {/* Close Button */}
    <button 
      onClick={() => setZoomedImage(null)}
      className="absolute top-10 right-6 z-[1001] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
    >
      <X size={28} strokeWidth={2.5} />
    </button>

    <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
      {zoomedImage.images.map((img, i) => (
        <div key={i} className="min-w-full h-full snap-center flex items-center justify-center">
          <img 
            src={img} 
            className="max-w-full max-h-full object-contain shadow-2xl" 
            alt="Fullscreen" 
            onDoubleClick={() => setZoomedImage(null)}
          />
        </div>
      ))}
    </div>

    {/* Counter for Multiple Images */}
    {zoomedImage.images.length > 1 && (
      <div className="absolute bottom-10 px-4 py-2 bg-white/10 rounded-full text-xs font-bold text-white backdrop-blur-md">
        Swipe to view {zoomedImage.images.length} items
      </div>
    )}
  </div>
)}
    </div>
  );
}
