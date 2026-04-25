import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgoraRTC from "agora-rtc-sdk-ng";
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { Mic, MicOff, PhoneOff, Volume2, VideoOff, MoreHorizontal, Shield } from 'lucide-react';

const APP_ID = "f757726d96d84723ac4be6b789fe0c40"; 

export default function VoiceCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [remoteUser, setRemoteUser] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timer, setTimer] = useState(0);

  const client = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
  const localTracks = useRef({ audioTrack: null });
  const timerInterval = useRef(null);

  // Timer Logic
  useEffect(() => {
    if (isAnswered) {
      timerInterval.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerInterval.current);
  }, [isAnswered]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startAgora = async () => {
    try {
      // Guard: Don't start if already connected
      if (client.current.connectionState === "CONNECTED") return;

      client.current.on("user-published", async (user, mediaType) => {
        await client.current.subscribe(user, mediaType);
        if (mediaType === "audio") user.audioTrack.play();
      });

      client.current.on("user-left", () => handleEndCall());

      await client.current.join(APP_ID, roomId, null, auth.currentUser.uid);
      localTracks.current.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await client.current.publish(localTracks.current.audioTrack);
      
      setCallStatus("Connected");
    } catch (err) {
      console.error("Agora Error:", err);
      setCallStatus("Connection Failed");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const unsub = onSnapshot(doc(db, "calls", roomId), (snap) => {
      if (!isMounted) return;

      // 🛑 The Fix: If the document doesn't exist, only leave if the call was already live.
      // This prevents the caller from being kicked out before the receiver even sees the call.
      if (!snap.exists()) {
        if (isAnswered) navigate('/chatbox');
        return; 
      }

      const data = snap.data();

      // Identify and set the Remote User info once
      if (!remoteUser) {
        const otherId = data.callerId === auth.currentUser.uid ? data.receiverId : data.callerId;
        getDoc(doc(db, "users", otherId)).then(uSnap => {
          if (uSnap.exists() && isMounted) setRemoteUser(uSnap.data());
        });
      }

      // Handle Status: 'active' or 'accepted' means start the audio stream
      if (data.status === 'active' || data.status === 'accepted') {
        if (!isAnswered) {
          setIsAnswered(true);
          startAgora();
        }
      } else if (data.status === 'ringing') {
        setCallStatus("Ringing...");
      }

      // Handle explicit call termination
      if (data.status === 'ended' || data.status === 'declined') {
        handleEndCall();
      }
    });

    return () => {
      isMounted = false;
      unsub();
      leaveCall();
    };
  }, [roomId, isAnswered]);

  const leaveCall = async () => {
    if (localTracks.current.audioTrack) {
      localTracks.current.audioTrack.stop();
      localTracks.current.audioTrack.close();
      localTracks.current.audioTrack = null;
    }
    if (client.current && client.current.connectionState !== "DISCONNECTED") {
      await client.current.leave();
    }
  };

  const handleEndCall = async () => {
    await leaveCall();
    try {
      // Update status to let the other user know to hang up
      await updateDoc(doc(db, "calls", roomId), { status: 'ended' });
      
      // Clean up the call document after a short delay
      setTimeout(async () => {
        const snap = await getDoc(doc(db, "calls", roomId));
        if (snap.exists()) await deleteDoc(doc(db, "calls", roomId));
      }, 1500);
    } catch (e) {
      console.warn("Cleanup error:", e);
    }
    navigate('/chatbox');
  };

  return (
    <div className="h-[100dvh] bg-[#0b141a] text-boss-text flex flex-col relative overflow-hidden font-sans">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `url('https://i.pinimg.com/originals/ab/ab/60/abab600fbc02693247076da4663e800c.jpg')`, backgroundSize: '400px' }}>
      </div>

      {/* Header Info */}
      <div className="z-10 pt-16 flex flex-col items-center">
        <div className="flex items-center gap-1 text-gray-500 mb-1">
          <Shield size={12} />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em]">End-to-end encrypted</span>
        </div>
        <h1 className="text-2xl font-bold mt-2">{remoteUser?.username || "BossNet User"}</h1>
        <p className="text-blue-500 text-xs font-bold mt-1 tracking-widest uppercase">
          {isAnswered ? formatTime(timer) : callStatus}
        </p>
      </div>

      {/* Profile Picture & Animation */}
      <div className="flex-1 z-10 flex items-center justify-center">
        <div className="w-56 h-56 rounded-full overflow-hidden border-2 border-white/5 shadow-2xl relative">
          <img 
            src={remoteUser?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
            className="w-full h-full object-cover" 
            alt="Profile" 
          />
          {!isAnswered && (
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-ping"></div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="z-20 bg-[#121b22] px-6 py-10 rounded-t-[40px] flex justify-between items-center border-t border-white/5 shadow-2xl">
        <button className="p-3 bg-white/5 rounded-full text-gray-400"><MoreHorizontal size={24} /></button>
        <button className="p-3 bg-white/5 rounded-full text-gray-400"><VideoOff size={24} /></button>
        <button className="p-3 bg-white/5 rounded-full text-gray-400"><Volume2 size={24} /></button>
        
        <button 
          onClick={() => {
            if (localTracks.current.audioTrack) {
              const newMuteState = !isMuted;
              localTracks.current.audioTrack.setEnabled(!newMuteState);
              setIsMuted(newMuteState);
            }
          }}
          className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-white text-black' : 'bg-white/5 text-boss-text'}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button 
          onClick={handleEndCall} 
          className="p-5 bg-[#ea0038] rounded-full active:scale-95 transition-transform"
        >
          <PhoneOff size={28} fill="white" stroke="none" />
        </button>
      </div>
    </div>
  );
}
