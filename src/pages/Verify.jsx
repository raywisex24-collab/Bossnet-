import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; 
import Swal from 'sweetalert2';

export default function Verify() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { email, password, generatedCode, firstName, surname, username } = location.state || {}; 
  const [userCode, setUserCode] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();

    if (userCode === generatedCode?.toString()) {
      
      Swal.fire({
        title: 'Creating Account...',
        text: 'Setting up your Bossnet profile',
        background: '#1a1a20',
        color: '#fff',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save initial profile
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          username: username.toLowerCase(),
          email: email,
          firstName: firstName,
          surname: surname,
          fullName: `${firstName} ${surname}`,
          createdAt: serverTimestamp(),
          isVerified: true,
          onboarded: false // Flag to check if they finished onboarding
        });
        
        // Success Message
        Swal.fire({
          title: 'Verified!',
          text: 'Account created successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#1a1a20',
          color: '#fff'
        }).then(() => {
          // REDIRECT TO ONBOARDING INSTEAD OF FEED
          navigate('/onboarding');
        });

      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: err.message,
          background: '#1a1a20',
          color: '#fff'
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Wrong Code',
        text: 'Please check the code and try again.',
        background: '#1a1a20',
        color: '#fff'
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#0f0f13]">
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[5%] left-[-10%] w-[70%] h-[70%] rounded-full bg-purple-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[0%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] shadow-2xl">
          
          <button 
            onClick={() => navigate(-1)}
            className="mb-6 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg transition-transform active:scale-90"
          >
            <span className="text-2xl">←</span>
          </button>

          <h2 className="text-2xl font-bold text-white mb-2 text-center italic tracking-tight">SECURITY CHECK</h2>
          <p className="text-gray-400 mb-8 text-sm text-center">
            Verification code sent to <br/>
            <span className="text-blue-400 font-medium">{email}</span>
          </p>

          <form onSubmit={handleVerify} className="space-y-6">
<input
  type="text"
  inputMode="numeric"
  placeholder="000000"
  value={userCode}
  onChange={(e) => setUserCode(e.target.value.replace(/\D/g, ''))}
  // UPDATED CLASSNAME BELOW
  className="w-full py-5 text-center text-5xl font-mono tracking-[0.15em] bg-[#1a1a20]/90 border-2 border-blue-500/50 rounded-3xl text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)]"
  maxLength="6"
  required
/>

            <button
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-black rounded-full shadow-lg active:scale-95 transition-transform uppercase tracking-widest"
            >
              Confirm Code
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

