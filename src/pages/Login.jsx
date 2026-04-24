import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { auth, googleProvider, db } from '../firebase'; 
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore'; 
import Swal from 'sweetalert2';

export default function Login() {
  const navigate = useNavigate();
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!emailOrUser || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Empty Fields',
        text: 'Please enter your username/email and password.',
        background: 'rgba(20, 20, 20, 0.85)',
        color: '#fff',
        backdrop: 'rgba(0, 0, 0, 0.6) blur(20px)',
        customClass: { popup: 'glass-modal border border-white/20 rounded-[30px]' }
      });
      return;
    }

    // Show Loader
    Swal.fire({
      title: 'Verifying...',
      background: 'rgba(20, 20, 20, 0.85)',
      color: '#fff',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      let loginEmail = emailOrUser.trim().toLowerCase();

      // DUAL-LOGIN LOGIC: If no '@', it's a username lookup
      if (!loginEmail.includes('@')) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", loginEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error("Username not found. Check your spelling, boss.");
        }

        loginEmail = querySnapshot.docs[0].data().email;
      }

      await signInWithEmailAndPassword(auth, loginEmail, password);
      localStorage.setItem('userToken', 'active_session');
      Swal.close();
      
      // ✅ Updated to replace history entry
      navigate('/feed', { replace: true });

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.message,
        background: 'rgba(0, 0, 0, 0.6) blur(15px)',
        color: '#fff',
        backdrop: 'rgba(0, 0, 0, 0.6) blur(20px)',
        customClass: { popup: 'glass-modal border border-white/20 rounded-[30px] shadow-2xl' }
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.setItem('userToken', 'active_session');
      
      // ✅ Updated to replace history entry
      navigate('/feed', { replace: true });

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Google Login Failed',
        text: error.message,
        background: 'rgba(20, 20, 20, 0.85)',
        color: '#fff',
        backdrop: `rgba(0,0,0,0.6) blur(15px)`,
        customClass: { popup: 'glass-modal border border-white/20 rounded-[30px] shadow-2xl' }
      });
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 font-sans"
      style={{
        background: "linear-gradient(135deg, #ff9d00 0%, #1877f2 35%, #8e44ad 70%, #d1f2eb 100%)"
      }}
    >
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-[#ff9d00] to-[#8e44ad] bg-clip-text text-transparent drop-shadow-md">
          Bossnet
        </h1>
        <p className="text-white text-xl mt-2 font-semibold">
          Connect, Innovate, and Lead.
        </p>
      </div>

      <div className="relative bg-[#0f172a]/90 backdrop-blur-2xl p-8 rounded-[40px] shadow-2xl max-w-[400px] w-full border border-white/10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div className="mb-4">
            <input
              type="text"
              value={emailOrUser}
              onChange={(e) => setEmailOrUser(e.target.value)}
              placeholder="Username or email address"
              required
              className="w-full py-4 px-6 bg-[#1a1a20]/90 border border-white/10 rounded-full text-white placeholder-white/70 focus:border-purple-500 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full py-4 px-6 bg-[#1a1a20]/90 border border-white/10 rounded-full text-white placeholder-white/70 focus:border-purple-500 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 font-bold text-sm hover:text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="flex justify-end">
            <Link 
              to="/forgot-password" 
              className="text-blue-500 text-xs mt-1 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full h-12 mb-4 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-white shadow-lg transition-all active:scale-95"
          >
            Log In
          </button>
        </form>

        <div className="border-b border-white/10 pb-4 relative z-10">
          <button 
            onClick={handleGoogleLogin}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-full border border-gray-300 bg-white text-gray-700 font-semibold shadow-sm active:scale-95 transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
            Continue with Google
          </button>
        </div>

        <div className="pt-2 flex justify-center relative z-10">
          <button 
            onClick={() => navigate('/signup')} 
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#8e44ad] to-[#1877f2] text-white font-bold text-lg shadow-md active:scale-95 transition-transform"
          >
            Create new account
          </button>
        </div>
      </div>
    </div>
  );
}

