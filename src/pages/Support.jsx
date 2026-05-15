import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { ArrowLeft, Send, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

export default function Support() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_name: '', user_id: '', user_email: '', user_phone: '',
    subject: '', complaint_details: '', suggestions: ''
  });

  // Safety check: if the component crashes, we'll see this in the console
  useEffect(() => {
    console.log("Support Page Mounted Successfully");
  }, []);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await emailjs.send('service_kw24hsj', 'template_icyra5b', {
        ...formData,
        timestamp: new Date().toLocaleString()
      }, 'd-aowhtvThUi9eA0W');

      Swal.fire({
        title: 'SUBMITTED',
        icon: 'success',
        background: '#000',
        color: '#fff'
      });
      setFormData({ user_name: '', user_id: '', user_email: '', user_phone: '', subject: '', complaint_details: '', suggestions: '' });
    } catch (err) {
      Swal.fire({ title: 'ERROR', text: 'Failed to send', icon: 'error', background: '#000' });
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="p-4 flex items-center gap-4 border-b border-white/10">
        <ArrowLeft onClick={() => navigate(-1)} className="text-white cursor-pointer" size={24} />
        <span className="text-xs font-bold uppercase tracking-widest">Support Center</span>
      </header>

      {/* Form Area */}
      <form onSubmit={handleSendEmail} className="flex-1 p-6 flex flex-col justify-between max-w-lg mx-auto w-full">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-b border-white/20 pb-1">
              <label className="text-[9px] uppercase text-white/40">Full Name</label>
              <input type="text" required className="w-full bg-transparent outline-none text-sm" value={formData.user_name} onChange={e => setFormData({...formData, user_name: e.target.value})} />
            </div>
            <div className="border-b border-white/20 pb-1">
              <label className="text-[9px] uppercase text-white/40">Username</label>
              <input type="text" required className="w-full bg-transparent outline-none text-sm" value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value})} />
            </div>
          </div>

          <div className="border-b border-white/20 pb-1">
            <label className="text-[9px] uppercase text-white/40">Email</label>
            <input type="email" required className="w-full bg-transparent outline-none text-sm" value={formData.user_email} onChange={e => setFormData({...formData, user_email: e.target.value})} />
          </div>

<div className="border-b border-white/20 pb-1">
  <label className="text-[9px] uppercase text-white/40">Phone Number</label>
  <input 
    type="tel" 
    className="w-full bg-transparent outline-none text-sm text-white" 
    placeholder="+000..."
    value={formData.user_phone} 
    onChange={e => setFormData({...formData, user_phone: e.target.value.slice(0, 14)})} 
  />
</div>

          <div className="border-b border-white/20 pb-1">
            <label className="text-[9px] uppercase text-white/40">Reason</label>
            <input type="text" required className="w-full bg-transparent outline-none text-sm" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
          </div>

          <div className="bg-white/5 rounded-lg p-2">
            <label className="text-[9px] uppercase text-white/40">Details</label>
            <textarea required rows="2" className="w-full bg-transparent outline-none text-sm resize-none" value={formData.complaint_details} onChange={e => setFormData({...formData, complaint_details: e.target.value})} />
          </div>
        </div>

        {/* Button Section */}
        <div className="pb-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full bg-blue-600 h-14 rounded-xl font-bold uppercase tracking-tighter"
          >
            {loading ? "Sending..." : "Submit Report"}
          </motion.button>
          <div className="flex justify-center items-center gap-2 mt-4 opacity-30 text-[8px] uppercase font-bold">
            <ShieldCheck size={10} /> Secure Encryption
          </div>
        </div>
      </form>

      <style>{`
        .custom-phone .react-tel-input .form-control { background: transparent !important; }
        .react-tel-input .country-list { background: #111 !important; border: 1px solid #333 !important; }
      `}</style>
    </div>
  );
}

