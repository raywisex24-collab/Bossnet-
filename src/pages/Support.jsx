import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { ArrowLeft, Send, ShieldCheck, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

export default function Support() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    user_name: '',
    user_id: '',
    user_email: '',
    user_phone: '+', // Pre-filled + as requested
    subject: '',
    complaint_details: '',
    suggestions: ''
  });

  // Automatically handles spacing: +000 000 000 0000
  const handlePhoneChange = (e) => {
    let value = e.target.value;
    if (!value.startsWith('+')) value = '+' + value.replace(/\+/g, '');
    const cleanValue = value.replace(/[^\d+]/g, '');
    const formatted = cleanValue
      .replace(/(.{4})/g, '$1 ')
      .replace(/(.{8})/g, '$1 ')
      .trim()
      .slice(0, 25); // Max digits for global compatibility (usually 15 + spaces)
    setFormData({ ...formData, user_phone: formatted });
  };

  const complaintOptions = [
    "Bug or app not working properly",
    "Account login issues",
    "Slow performance or lag",
    "App crashing unexpectedly",
    "Payment or subscription problems",
    "Fake account or impersonation",
    "Harassment or bullying",
    "Spam or scam activity",
    "Inappropriate content",
    "Privacy or security concerns",
    "Feature not working as expected",
    "Poor customer support experience",
    "Problem with notifications",
    "Data loss or missing messages/files",
    "Other"
  ];

  const handleSelectReason = (reason) => {
    setFormData({
      ...formData,
      subject: reason,
      // If it's not "Other", we auto-fill the details with the reason name
      complaint_details: reason === "Other" ? "" : `Issue reported: ${reason}`
    });
    setShowDropdown(false);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Exact mapping for your EmailJS Template
    const templateParams = {
      timestamp: new Date().toLocaleString(),
      user_name: formData.user_name,
      user_id: formData.user_id,
      user_email: formData.user_email,
      user_phone: formData.user_phone,
      subject: formData.subject,
      complaint_details: formData.complaint_details,
      suggestions: formData.suggestions
    };

    try {
      await emailjs.send(
        'service_kw24hsj',
        'template_icyra5b',
        templateParams,
        'd-aowhtvThUi9eA0W'
      );

      Swal.fire({
        title: 'Thank you for your feedback',
        text: "We'll learn more ways to best serve you.",
        icon: 'success',
        background: '#000',
        color: '#fff',
        confirmButtonColor: '#3b82f6',
        customClass: { popup: 'rounded-2xl border border-white/10' }
      });
      
      setFormData({ user_name: '', user_id: '', user_email: '', user_phone: '', subject: '', complaint_details: '', suggestions: '' });
    } catch (err) {
      Swal.fire({ title: 'ERROR', text: 'Failed to send', icon: 'error', background: '#000', color: '#fff' });
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "text-[10px] font-bold uppercase text-white/40 mb-1 block";
  const inputClass = "w-full bg-transparent border-b border-white/20 p-2 text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-white/20";

  return (
    <div className="fixed inset-0 w-full bg-black text-white font-sans overflow-hidden flex flex-col">
      <header className="p-4 flex items-center gap-4">
        <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer text-white" size={24} />
        <h1 className="text-sm font-bold tracking-widest uppercase">Support Center</h1>
      </header>

      <form onSubmit={handleSendEmail} className="flex-1 px-6 flex flex-col justify-between pb-8 max-w-xl mx-auto w-full">
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input type="text" required className={inputClass} value={formData.user_name} onChange={(e) => setFormData({...formData, user_name: e.target.value})} />
            </div>
            <div>
              <label className={labelClass}>Username</label>
              <input type="text" required className={inputClass} value={formData.user_id} onChange={(e) => setFormData({...formData, user_id: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email Address</label>
              <input type="email" required className={inputClass} value={formData.user_email} onChange={(e) => setFormData({...formData, user_email: e.target.value})} />
            </div>
<div>
  <label className={labelClass}>Phone Number</label>
  <input 
    type="tel" 
    placeholder="+000" 
    className={inputClass} 
    value={formData.user_phone} 
    onChange={handlePhoneChange} 
  />
</div>
          </div>

          {/* Reason for Complaint Dropdown */}
          <div className="relative">
            <label className={labelClass}>Reason for Complaint</label>
            <div 
              onClick={() => setShowDropdown(!showDropdown)}
              className={`${inputClass} cursor-pointer flex justify-between items-center`}
            >
              <span className={formData.subject ? "text-white" : "text-white/20"}>
                {formData.subject || "Choose your reason"}
              </span>
              <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-1 bg-[#111] border border-white/10 rounded-xl max-h-60 overflow-y-auto shadow-2xl shadow-blue-500/10"
                >
                  {complaintOptions.map((option) => (
                    <div 
                      key={option} 
                      onClick={() => handleSelectReason(option)}
                      className="p-3 text-xs hover:bg-blue-600 transition-colors cursor-pointer border-b border-white/5 last:border-none"
                    >
                      {option}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className={labelClass}>Complaint Details</label>
            <textarea 
              required 
              rows="2" 
              placeholder="Describe the issue..."
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none transition-all resize-none mt-1" 
              value={formData.complaint_details} 
              onChange={(e) => setFormData({...formData, complaint_details: e.target.value})} 
            />
          </div>

          <div>
            <label className={labelClass}>Suggestions</label>
            <input type="text" placeholder="How can we improve?" className={inputClass} value={formData.suggestions} onChange={(e) => setFormData({...formData, suggestions: e.target.value})} />
          </div>
        </div>

        <div className="mt-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full bg-blue-600 h-14 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <>SUBMIT REPORT <Send size={16} /></>}
          </motion.button>
          
          <div className="mt-4 flex items-center justify-center gap-2 opacity-20">
            <ShieldCheck size={12} />
            <span className="text-[9px] font-bold uppercase">Secure Encryption Active</span>
          </div>
        </div>
      </form>
    </div>
  );
}

