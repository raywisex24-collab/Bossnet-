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
  const [callStatus, setCallStatus] = useState("Ringing...");
  const [remoteUser, setRemoteUser] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timer, setTimer] = useState(0);
  
  const client = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
  const localTracks = useRef({ audioTrack: null });
  const timerInterval = useRef(null);

  // Timer Logic
  useEffect(() => {
    if (isAnswered) {
      timerInterval.current = setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(timerInterval.current);
  }, [isAnswered]);

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const startAgora = async () => {
    try {
      if (client.current.connectionState === "CONNECTED") return;
      
      await client.current.join(APP_ID, roomId, null, auth.currentUser.uid);
      localTracks.current.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await client.current.publish(localTracks.current.audioTrack);

      client.current.on("user-published", async (user, mediaType) => {
        await client.current.subscribe(user, mediaType);
        if (mediaType === "audio") user.audioTrack.play();
      });

      client.current.on("user-left", () => handleEndCall());
      setCallStatus("Connected");
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const callSnap = await getDoc(doc(db, "calls", roomId));
      if (callSnap.exists() && isMounted) {
        const data = callSnap.data();
        const otherId = data.callerId === auth.currentUser.uid ? data.receiverId : data.callerId;
        const userSnap = await getDoc(doc(db, "users", otherId));
        if (userSnap.exists()) setRemoteUser(userSnap.data());
      }
    };
    init();

    const unsub = onSnapshot(doc(db, "calls", roomId), (snap) => {
      if (!snap.exists()) {
        navigate('/chatbox');
        return;
      }
      const data = snap.data();
      
      // If receiver accepts, start Agora
      if (data.status === 'active' || data.status === 'accepted') {
        setIsAnswered(true);
        startAgora();
      }

      // If call is explicitly ended
      if (data.status === 'ended' || data.status === 'declined') {
        handleEndCall();
      }
    });

    return () => {
      isMounted = false;
      unsub();
      leaveCall();
    };
  }, [roomId]);

  const leaveCall = async () => {
    if (localTracks.current.audioTrack) {
      localTracks.current.audioTrack.stop();
      localTracks.current.audioTrack.close();
    }
    if (client.current) await client.current.leave();
  };

  const handleEndCall = async () => {
    await leaveCall();
    try {
      await updateDoc(doc(db, "calls", roomId), { status: 'ended' });
      // Short delay before cleaning up the doc to let the other person's listener catch it
      setTimeout(async () => {
        const snap = await getDoc(doc(db, "calls", roomId));
        if (snap.exists()) await deleteDoc(doc(db, "calls", roomId));
      }, 2000);
    } catch (e) {}
    navigate('/chatbox');
  };

  return (
    <div className="h-[100dvh] bg-[#0b141a] text-boss-text flex flex-col relative overflow-hidden">
       {/* Background Pattern */}
       <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `url('https://i.pinimg.com/originals/ab/ab/60/abab600fbc02693247076da4663e800c.jpg')`, backgroundSize: '400px' }}>
      </div>

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

      <div className="flex-1 z-10 flex items-center justify-center">
        <div className="w-56 h-56 rounded-full overflow-hidden border-2 border-white/5 shadow-2xl relative">
          <img src={remoteUser?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} className="w-full h-full object-cover" />
          {!isAnswered && <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-ping"></div>}
        </div>
      </div>

      <div className="z-20 bg-[#121b22] px-6 py-10 rounded-t-[40px] flex justify-between items-center border-t border-white/5 shadow-2xl">
        <button className="p-3 bg-white/5 rounded-full text-gray-400"><MoreHorizontal size={24} /></button>
        <button className="p-3 bg-white/5 rounded-full text-gray-400"><VideoOff size={24} /></button>
        <button className="p-3 bg-white/5 rounded-full text-gray-400"><Volume2 size={24} /></button>
        <button 
          onClick={() => {
            localTracks.current.audioTrack.setEnabled(isMuted);
            setIsMuted(!isMuted);
          }}
          className={`p-3 rounded-full ${isMuted ? 'bg-white text-black' : 'bg-white/5 text-boss-text'}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button onClick={handleEndCall} className="p-5 bg-[#ea0038] rounded-full"><PhoneOff size={28} fill="white" stroke="none" /></button>
      </div>
    </div>
  );
}

