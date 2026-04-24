import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import Swal from 'sweetalert2';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  // --- THIS IS THE LOGIC (Your Snippet) ---
  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      Swal.fire({
        title: 'Success!',
        text: 'Reset link sent to your Gmail.',
        icon: 'success',
        background: '#1a1a2e',
        color: '#fff'
      });
      navigate('/login');
    } catch (error) {
      console.log("Firebase Error Code:", error.code);
      let errorMessage = "An error occurred. Please try again.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "Account not found.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }
      Swal.fire({
        icon: 'error',
        title: 'Search Failed',
        text: errorMessage,
        background: '#1a1a2e',
        color: '#fff'
      });
    }
  };

  // --- THIS IS THE UI (The colors and buttons you need) ---
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      minHeight: '100vh',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '20px', fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(15px)',
        borderRadius: '30px',
        padding: '40px 30px',
        width: '100%', maxWidth: '380px',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* The Blue/Purple Back Button */}
        <div onClick={() => navigate('/login')} style={{
          width: '40px', height: '40px',
          background: 'linear-gradient(45deg, #6a11cb, #2575fc)',
          borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
          cursor: 'pointer', marginBottom: '20px'
        }}>
          <span style={{ color: 'white', fontSize: '20px' }}>←</span>
        </div>

        <h2 style={{ color: 'white', fontSize: '26px', marginBottom: '10px' }}>Reset Password</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '30px' }}>
          Please enter the email or phone number associated with your account.
        </p>
        
        <form onSubmit={handleReset}>
          <input 
            type="email" 
            placeholder="Email or Phone"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{
              width: '100%', padding: '18px', borderRadius: '15px', border: 'none',
              background: '#161b22', color: 'white', marginBottom: '25px', textAlign: 'center'
            }}
          />
          
          {/* The Styled Action Button */}
          <button type="submit" style={{
            width: '100%', padding: '16px', borderRadius: '50px', border: 'none',
            background: 'linear-gradient(45deg, #a855f7, #3b82f6)',
            color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
          }}>
            Send Link Now
          </button>
        </form>
      </div>
    </div>
  );
}

