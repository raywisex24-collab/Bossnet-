import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { auth } from '../firebase';

export default function VideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const myMeeting = async (element) => {
    // Verified Credentials Applied
    const appID = 355477203; 
    const serverSecret = "c9a12370fde16dbb35dd46d9713d0ede";
    
    // Generate the Kit Token using your credentials
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID, 
      serverSecret, 
      roomId, 
      user?.uid || Date.now().toString(), 
      user?.displayName || "Boss User"
    );

    // Create instance object from Kit Token.
    const zp = ZegoUIKitPrebuilt.create(kitToken);

    // Start the call
    zp.joinRoom({
      container: element,
      sharedLinks: [
        {
          name: 'Personal link',
          url: window.location.protocol + '//' + window.location.host + window.location.pathname + '?roomID=' + roomId,
        },
      ],
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall, // Optimized for 1-on-1 BossNet calls
      },
      showScreenSharingButton: false, // Keeping it clean for social use
      showPreJoinView: false,        // Skips the setup screen to jump straight in
      onLeaveRoom: () => {
        navigate('/chatbox');        // Returns to messages when finished
      },
      // Settings for better mobile experience
      showUserHideButtonInUI: true,
      showMyCameraToggleButton: true,
      showMyMicrophoneToggleButton: true,
      showAudioVideoSettingsButton: false,
    });
  };

  return (
    <div className="w-screen h-[100dvh] bg-black overflow-hidden flex items-center justify-center">
      <div 
        ref={myMeeting} 
        className="w-full h-full"
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
}
