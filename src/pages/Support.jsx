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
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [formData, setFormData] = useState({
    user_name: '',
    user_id: '',
    user_email: '',
    user_phone: '+', 
    subject: '',
    complaint_details: '',
    suggestions: ''
  });

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    
    // Forces + to stay at the start and prevents double ++
    if (!value.startsWith('+')) {
      value = '+' + value.replace(/\+/g, '');
    }
    
    // Strip everything except numbers, but keep the leading +
    const numbersOnly = value.slice(1).replace(/\D/g, '');
    
    // Apply spacing every 3-4 digits for a professional look
    const formatted = numbersOnly
      .replace(/(\d{3})(\d{3})(\d{4,})/, '$1 $2 $3')
      .trim();

    setFormData({ ...formData, user_phone: '+' + formatted.slice(0, 25) });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
    }
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
              <input type="text" required placeholder="Full names here" className={inputClass} value={formData.user_name} onChange={(e) => setFormData({...formData, user_name: e.target.value})} />
            </div>
            <div>
              <label className={labelClass}>Username</label>
              <input type="text" required placeholder="username" className={inputClass} value={formData.user_id} onChange={(e) => setFormData({...formData, user_id: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email Address</label>
              <input type="email" required placeholder="example@bossnet.com" className={inputClass} value={formData.user_email} onChange={(e) => setFormData({...formData, user_email: e.target.value})} />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input type="tel" placeholder="xxx xxx xxx xxx xxx" className={inputClass} value={formData.user_phone} onChange={handlePhoneChange} />
            </div>
          </div>

          <div className="relative">
            <label className={labelClass}>Reason for Complaint</label>
            <div onClick={() => setShowDropdown(!showDropdown)} className={`${inputClass} cursor-pointer flex justify-between items-center`}>
              <span className={formData.subject ? "text-white" : "text-white/20"}>{formData.subject || "Choose your reason"}</span>
              <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </div>
            <AnimatePresence>
              {showDropdown && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full mt-1 bg-[#111] border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-2xl">
                  {complaintOptions.map((option) => (
                    <div key={option} onClick={() => handleSelectReason(option)} className="p-3 text-xs hover:bg-blue-600 cursor-pointer border-b border-white/5 last:border-none">{option}</div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className={labelClass}>Complaint Details</label>
            <textarea required rows="2" placeholder="describe your issue" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none transition-all resize-none mt-1" value={formData.complaint_details} onChange={(e) => setFormData({...formData, complaint_details: e.target.value})} />
          </div>

          <div>
            <label className={labelClass}>Suggestions</label>
            <input type="text" placeholder="how can we improve" className={inputClass} value={formData.suggestions} onChange={(e) => setFormData({...formData, suggestions: e.target.value})} />
          </div>

          {/* Attachment UI */}
          <div className="mt-2">
            <label className={labelClass}>Attachments (Optional)</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 border-2 border-dashed border-white/10 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer hover:border-blue-500/50 transition-all">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <span className="text-[10px] font-bold uppercase opacity-40 italic">
                  {selectedImage ? "Image Selected" : "Attach Screenshot"}
                </span>
              </label>
              {selectedImage && (
                <div className="w-12 h-12 rounded-lg border border-white/20 overflow-hidden">
                  <img src={selectedImage} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
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
