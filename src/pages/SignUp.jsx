import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { auth, db } from '../firebase'; 
import Swal from 'sweetalert2';
import { collection, query, where, getDocs } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

export default function SignUp() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [isAvailable, setIsAvailable] = useState(null); 
  const [suggestions, setSuggestions] = useState([]);

  // Generate Suggestions if the name is taken
  const generateSuggestions = (name) => {
    const base = name.toLowerCase().replace(/\s/g, '');
    const num = () => Math.floor(Math.random() * 99);
    return [
      `${base}_boss`,
      `the_${base}`,
      `${base}${num()}${num()}`
    ];
  };

  // TikTok-style Real-time Username Check
  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      setSuggestions([]);
      return;
    }

    setIsAvailable('loading');
    const timer = setTimeout(async () => {
      try {
        const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setIsAvailable('yes');
          setSuggestions([]);
        } else {
          setIsAvailable('no');
          setSuggestions(generateSuggestions(firstName || username));
        }
      } catch (err) {
        console.error("Username check error:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, firstName]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (isAvailable === 'no') {
      Swal.fire({
        title: 'Username Taken',
        text: 'Please choose another username or use a suggestion, boss.',
        icon: 'error',
        background: '#1a1a20',
        color: '#fff'
      });
      return;
    }

    emailjs.init("FOxONsRPS4W7EA5zK"); 
    const fullName = `${firstName} ${surname}`;

    Swal.fire({
      title: 'Processing...',
      text: 'Building your Bossnet profile',
      background: 'rgba(26, 26, 32, 0.8)',
      color: '#fff',
      backdrop: `rgba(0,0,0,0.6) blur(10px)`,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const newCode = Math.floor(100000 + Math.random() * 900000);

      await emailjs.send(
        'service_r3hyhto',
        'template_5z3lkwn', 
        { 
          to_name: fullName, 
          to_email: email, 
          verification_code: newCode 
        },
        'F0x0NsRPS4W7EA5zK'
      );

      Swal.fire({
        title: 'COMPLETED',
        text: `Confirm email address, ${firstName}! Verification code sent.`,
        icon: 'success',
        iconColor: '#4ade80',
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
        backdrop: `rgba(0,0,0,0.7) blur(15px)`,
        confirmButtonText: 'Continue',
        confirmButtonColor: '#4ade80',
      }).then(() => {
        navigate('/verify', { state: { generatedCode: newCode, email, password, firstName, surname, username: username.toLowerCase() } });
      });

    } catch (error) {
      console.error(error);
      Swal.fire({
        title: 'ERROR',
        text: error.message,
        icon: 'error',
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
      });
    }
  };

  return (
<div 
  className="min-h-screen w-full flex flex-col items-center justify-center py-12 px-4 font-sans relative overflow-hidden"
  style={{
    background: "linear-gradient(135deg, #ff9d00 0%, #1877f2 35%, #8e44ad 70%, #d1f2eb 100%)"
  }}
>
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
      </div>

<h1 className="relative z-10 text-5xl md:text-6xl font-extrabold mb-10 bg-gradient-to-r from-[#ff9d00] to-[#8e44ad] bg-clip-text text-transparent drop-shadow-md">
  Join Bossnet
</h1>

      <div className="w-full max-w-md z-10">
        <button 
          onClick={() => navigate('/login')} 
          className="h-[54px] w-full text-boss-text rounded-full font-semibold flex items-center justify-center gap-3 transition-all bg-gradient-to-r from-[#FF8C00] via-[#A855F7] to-[#3B82F6] mb-6"
        >
          <span>←</span> Back to Login
        </button>

          <form onSubmit={handleSignUp} className="space-y-5 bg-[#0f172a]/90 p-8 rounded-[40px] border border-white/10 backdrop-blur-2xl shadow-2xl relative z-10">
          <h2 className="text-xl font-semibold text-boss-text text-center mb-2">Create Account</h2>
          
          <div className="flex gap-3">
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required className="w-1/2 py-4 px-6 bg-[#1a1a20]/90 border border-white/10 rounded-full text-boss-text outline-none focus:border-purple-500 transition-all" />
            <input type="text" value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="Surname" required className="w-1/2 py-4 px-6 bg-[#1a1a20]/90 border border-white/10 rounded-full text-boss-text outline-none focus:border-purple-500 transition-all" />
          </div>

          {/* USERNAME FIELD */}
          <div className="relative">
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} 
              placeholder="Username" 
              required 
              className={`w-full py-4 px-6 bg-[#1a1a20]/90 border rounded-full text-boss-text outline-none transition-all ${
                isAvailable === 'yes' ? 'border-green-500' : isAvailable === 'no' ? 'border-red-500' : 'border-white/10'
              }`} 
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              {isAvailable === 'loading' && <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />}
              {isAvailable === 'yes' && <span className="text-green-500">✓</span>}
              {isAvailable === 'no' && <span className="text-red-500">✕</span>}
            </div>
          </div>

          {/* SUGGESTIONS SECTION */}
          {isAvailable === 'no' && suggestions.length > 0 && (
            <div className="px-2 animate-fadeIn">
              <p className="text-xs text-boss-text/60 mb-2">Suggested for you:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setUsername(sug)}
                    className="text-xs py-1 px-3 rounded-full bg-white/10 text-purple-300 border border-white/5 hover:bg-white/20 transition-all"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required className="w-full py-4 px-6 bg-[#1a1a20]/90 border border-white/10 rounded-full text-boss-text outline-none focus:border-purple-500 transition-all" />
          
          <div className="relative">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" required className="w-full py-4 px-6 bg-[#1a1a20]/90 border border-white/10 rounded-full text-boss-text outline-none focus:border-purple-500 transition-all" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-boss-text/70 font-bold text-sm">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="flex items-center justify-between px-2 mt-2">
            <div 
              onClick={() => setTermsAccepted(!termsAccepted)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                termsAccepted ? 'bg-blue-600 border-blue-600' : 'border-white/30 group-hover:border-white'
              }`}>
                {termsAccepted && <Check size={14} className="text-white stroke-[4px]" />}
              </div>
              <span className="text-xs font-bold text-boss-text/80 uppercase">I Agree</span>
            </div>
            
            <Link 
              to="/terms" 
              className="text-xs font-bold text-blue-400 hover:text-blue-300 underline uppercase tracking-wider"
            >
              Read Terms
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={!termsAccepted}
            className={`w-full h-14 mt-4 rounded-full font-bold shadow-lg transition-all ${
              termsAccepted 
                ? 'bg-gradient-to-r from-[#8e44ad] to-[#1877f2] text-boss-text active:scale-95' 
                : 'bg-gray-600/50 text-white/20 cursor-not-allowed opacity-50'
            }`}
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
