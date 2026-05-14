import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { 
  Send, ArrowLeft, User, Mail, Phone, 
  MessageSquare, Lightbulb, Paperclip, ShieldCheck 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

export default function Support() {
  const navigate = useNavigate();
  const formRef = useRef();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    user_name: '',
    user_id: '',
    user_email: '',
    user_phone: '',
    subject: '',
    complaint_details: '',
    suggestions: '',
    timestamp: new Date().toLocaleString()
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Update timestamp right before sending
    const finalData = { ...formData, timestamp: new Date().toLocaleString() };

    try {
      await emailjs.send(
        'YOUR_SERVICE_ID', // Replace with your EmailJS Service ID
        'YOUR_TEMPLATE_ID', // Replace with your EmailJS Template ID
        finalData,
        'YOUR_PUBLIC_KEY' // Replace with your EmailJS Public Key
      );

      Swal.fire({
        title: 'Sent Successfully!',
        text: 'Your complaint has been logged. Our team will review it shortly.',
        icon: 'success',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#3b82f6',
        customClass: { popup: 'rounded-[30px] border border-white/10' }
      });

      setFormData({
        user_name: '', user_id: '', user_email: '', user_phone: '',
        subject: '', complaint_details: '', suggestions: ''
      });
      
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Something went wrong. Please try again later.',
        icon: 'error',
        background: '#0f172a',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full bg-[#1e293b] border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all mb-4";

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/10 p-5 flex items-center gap-4">
        <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer text-blue-500" size={28} />
        <h1 className="text-xl font-black uppercase tracking-tighter text-blue-500">Support Center</h1>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full pb-20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black mb-2">Complaints & Suggestions</h2>
          <p className="text-white/50 text-sm font-medium">Help us make Bossnet better for everyone.</p>
        </div>

        <form ref={formRef} onSubmit={handleSendEmail} className="bg-[#0f172a] p-8 rounded-[40px] border border-white/10 shadow-2xl">
          
          {/* Identity Section */}
          <div className="flex items-center gap-2 mb-4 text-blue-400">
            <User size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Personal Info</span>
          </div>
          
          <input type="text" name="user_name" placeholder="Full Name" required value={formData.user_name} onChange={handleChange} className={inputStyle} />
          <input type="text" name="user_id" placeholder="Username" required value={formData.user_id} onChange={handleChange} className={inputStyle} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-4">
            <input type="email" name="user_email" placeholder="Email Address" required value={formData.user_email} onChange={handleChange} className={inputStyle} />
            <input type="tel" name="user_phone" placeholder="Phone Number (Optional)" value={formData.user_phone} onChange={handleChange} className={inputStyle} />
          </div>

          {/* Details Section */}
          <div className="flex items-center gap-2 mb-4 mt-4 text-blue-400">
            <MessageSquare size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Complaint Details</span>
          </div>

          <input type="text" name="subject" placeholder="Subject / Title" required value={formData.subject} onChange={handleChange} className={inputStyle} />
          
          <div className="relative">
            <textarea name="complaint_details" placeholder="Describe your issue..." required maxLength="2000" rows="5" 
              value={formData.complaint_details} onChange={handleChange} className={inputStyle}></textarea>
            <span className="absolute bottom-6 right-4 text-[10px] text-white/20 uppercase font-bold">
              {formData.complaint_details.length}/2000
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4 mt-2 text-blue-400">
            <Lightbulb size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Suggestions</span>
          </div>

          <textarea name="suggestions" placeholder="What should we improve?" rows="3" 
            value={formData.suggestions} onChange={handleChange} className={inputStyle}></textarea>

          {/* Attachment UI (Visual Only for now) */}
          <div className="p-4 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white/30 hover:border-blue-500/50 cursor-pointer mb-8 transition-all">
            <Paperclip size={20} />
            <span className="text-sm font-bold uppercase italic">Attach Screenshots</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className={`w-full h-16 rounded-full font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
              loading ? 'bg-gray-700 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              <>
                <span>Submit Report</span>
                <Send size={20} />
              </>
            )}
          </motion.button>

          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-white/20 font-bold uppercase">
            <ShieldCheck size={12} />
            <span>Secure SSL Encrypted Submission</span>
          </div>
        </form>
      </main>
    </div>
  );
}
