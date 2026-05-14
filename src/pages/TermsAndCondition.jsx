import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, ArrowLeft, Shield, Scale, Lock, 
  Info, CreditCard, AlertTriangle, Copyright, 
  RefreshCcw, Users, HardDrive, Zap, Mail 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- DATA STRUCTURE (FULL HIERARCHY) ---
const legalData = [
  {
    id: 'tc',
    title: 'Terms & Conditions',
    icon: <Scale className="text-blue-500" size={22} />,
    subsections: [
      {
        subTitle: '1. Introduction',
        items: [
          { label: 'Welcome Statement', content: 'Welcome to Bossnet. We provide a specialized ecosystem for artists and developers.' },
          { label: 'Purpose of Platform', content: 'Designed for Afrofusion creative expression and software collaboration.' },
          { label: 'Acceptance of Terms', content: 'By using the app, you enter a binding legal agreement.' },
          { label: 'Eligibility', content: 'Minimum age of 13 required. Geographic restrictions may apply based on local laws.' },
          { label: 'Definitions', content: 'Includes specific terms for "User Content," "Services," and "Platform Ownership."' }
        ]
      },
      {
        subTitle: '2. User Accounts',
        items: [
          { label: 'Account Creation', content: 'Accurate information is required for all registration fields.' },
          { label: 'Username Policies', content: 'No offensive names or impersonation of brands/public figures.' },
          { label: 'Security Obligations', content: 'You are responsible for password protection and reporting unauthorized access.' },
          { label: 'Account Rights', content: 'Bossnet reserves the right to suspend accounts or delete inactive ones.' },
          { label: 'Transfer Prohibition', content: 'Accounts are non-transferable and belong to the original creator.' }
        ]
      },
      {
        subTitle: '3. Acceptable Use Policy',
        items: [
          { label: 'Lawful Usage', content: 'You must comply with all local and international laws.' },
          { label: 'Prohibited Activities', content: 'No spam, fake engagement, bots, or automated scraping.' },
          { label: 'Safety Rules', content: 'No harassment, hate speech, threats, or fraudulent behavior.' },
          { label: 'Platform Security', content: 'No malicious software, exploitation, or manipulation of the UI/code.' }
        ]
      },
      {
        subTitle: '4. Content Ownership & Licensing',
        items: [
          { label: 'User Content', content: 'You own your generated content but grant Bossnet a license to host/distribute it.' },
          { label: 'Platform Rights', content: 'We reserve rights for media storage, reproduction for promotion, and moderation.' },
          { label: 'AI & Metadata', content: 'Includes policies on AI-generated content handling and metadata usage.' }
        ]
      },
      {
        subTitle: '5. Intellectual Property Rights',
        items: [
          { label: 'Ownership', content: 'Bossnet owns all trademarks, software, UI/UX, logos, and source code.' },
          { label: 'Restrictions', content: 'No reverse engineering or unauthorized branding usage allowed.' }
        ]
      },
      {
        subTitle: '6. Features & Payments',
        items: [
          { label: 'Platform Services', content: 'Covers Messaging, Voice/Video, Stories, Reels, and Marketplace features.' },
          { label: 'Billing Cycles', content: 'Automatic renewals, taxes, and failed payment handling policies.' },
          { label: 'Refunds', content: 'Strict refund eligibility and chargeback handling rules.' }
        ]
      },
      {
        subTitle: '7. Enforcement & Termination',
        items: [
          { label: 'Actions', content: 'Includes warnings, temporary suspensions, permanent bans, and shadow restrictions.' },
          { label: 'Appeals', content: 'Procedures for investigating and appealing account restrictions.' },
          { label: 'Termination', content: 'Conditions for user or company-led account termination.' }
        ]
      },
      {
        subTitle: '8. Liability & Law',
        items: [
          { label: 'Limitations', content: 'Service provided "As Is". No warranty for data loss or technical failure.' },
          { label: 'Indemnification', content: 'User responsibility for legal claims arising from violations.' },
          { label: 'Governing Law', content: 'Legal jurisdiction, arbitration clauses, and dispute resolution venues.' }
        ]
      }
    ]
  },
  {
    id: 'pp',
    title: 'Privacy Policy',
    icon: <Lock className="text-blue-500" size={22} />,
    subsections: [
      {
        subTitle: '1. Information Collected',
        items: [
          { label: 'Personal Data', content: 'Name, email, phone, and payment details.' },
          { label: 'Device Info', content: 'IP addresses, browser info, and location data.' },
          { label: 'Usage Activity', content: 'Cookies, identifiers, and uploaded media tracking.' }
        ]
      },
      {
        subTitle: '2. Data Usage & Sharing',
        items: [
          { label: 'Purpose', content: 'Used for authentication, personalization, safety, and AI improvements.' },
          { label: 'Sharing', content: 'Shared with cloud hosts, processors, and legal authorities if required.' }
        ]
      },
      {
        subTitle: '3. Your Rights & Security',
        items: [
          { label: 'User Rights', content: 'Access, correction, deletion, and data portability requests.' },
          { label: 'Security', content: 'Encryption, access controls, and breach notification systems.' },
          { label: 'Children', content: 'Strict compliance with child protection and guardian rights.' }
        ]
      }
    ]
  },
  {
    id: 'cg',
    title: 'Community Guidelines',
    icon: <Users className="text-blue-500" size={22} />,
    subsections: [
      {
        subTitle: '1. Standards',
        items: [
          { label: 'Respectful Behavior', content: 'Non-discrimination and anti-harassment rules.' },
          { label: 'Safety Standards', content: 'Strict prohibition of violence, self-harm, and exploitation.' },
          { label: 'Content Rules', content: 'Prohibition of spam, fake news, and illegal content.' },
          { label: 'Authenticity', content: 'No identity impersonation or artificial engagement.' }
        ]
      }
    ]
  },
  {
    id: 'cr',
    title: 'Copyright & Refund',
    icon: <Copyright className="text-blue-500" size={22} />,
    subsections: [
      {
        subTitle: '1. Copyright Policy',
        items: [
          { label: 'Infringement', content: 'DMCA procedures and required complaint information.' },
          { label: 'Repeat Violators', content: 'Strike systems leading to permanent bans.' }
        ]
      },
      {
        subTitle: '2. Refund Policy',
        items: [
          { label: 'Eligibility', content: 'Subscription and technical issue refund timelines.' },
          { label: 'Non-Refundable', content: 'Consumed digital products and promotional gifts.' }
        ]
      }
    ]
  },
  {
    id: 'sp',
    title: 'Specialized Policies',
    icon: <Zap className="text-blue-500" size={22} />,
    subsections: [
      {
        subTitle: '1. Social & Creator Rules',
        items: [
          { label: 'Moderation', content: 'Human and automated content review systems.' },
          { label: 'Verification', content: 'Identity requirements and public figure standards.' },
          { label: 'Monetization', content: 'Revenue sharing, payouts, and ad eligibility.' }
        ]
      },
      {
        subTitle: '2. Ads & Developers',
        items: [
          { label: 'Ad Policy', content: 'Prohibited ads and sponsored content disclosures.' },
          { label: 'API Policy', content: 'Rate limits and developer data usage restrictions.' }
        ]
      }
    ]
  }
];

// --- UI COMPONENTS ---

const AccordionItem = ({ label, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 px-2 flex justify-between items-center hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-medium text-white/80">{label}</span>
        <ChevronDown size={16} className={`text-blue-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="p-4 text-sm text-white/60 leading-relaxed bg-black/20">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SubSection = ({ subTitle, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mb-4 bg-[#1e293b] rounded-xl overflow-hidden border border-white/5">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex justify-between items-center bg-[#1e293b] hover:bg-[#334155] transition-colors"
      >
        <h3 className="text-md font-bold text-white uppercase tracking-tight">{subTitle}</h3>
        <ChevronDown size={20} className={`text-blue-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden bg-[#0f172a]"
          >
            {items.map((item, idx) => <AccordionItem key={idx} {...item} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MainSection = ({ title, icon, subsections }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center gap-4 bg-[#0f172a] border border-white/10 rounded-2xl hover:border-blue-500/50 transition-all shadow-xl"
      >
        <div className="p-2 bg-blue-500/10 rounded-lg">{icon}</div>
        <span className="text-lg font-black text-white uppercase tracking-widest flex-1 text-left">{title}</span>
        <ChevronDown size={24} className={`text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4 pl-4 border-l-2 border-blue-500/30"
          >
            {subsections.map((sub, idx) => <SubSection key={idx} {...sub} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LegalCenter() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#020617] border-b border-white/10 p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer text-blue-500" size={28} />
          <h1 className="text-xl font-black uppercase tracking-tighter">Legal <span className="text-blue-500">Center</span></h1>
        </div>
        <Shield className="text-blue-500" size={24} />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full pb-20">
        <div className="mb-10 text-center">
          <p className="text-blue-400 font-bold uppercase text-xs tracking-[0.2em] mb-2">Transparency & Compliance</p>
          <h2 className="text-4xl font-black">Platform Policies</h2>
          <div className="w-20 h-1 bg-blue-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {legalData.map((section) => (
          <MainSection key={section.id} {...section} />
        ))}

        {/* Support Section */}
        <section className="mt-12 p-8 bg-blue-600 rounded-[30px] flex flex-col items-center text-center shadow-2xl">
          <Mail className="text-white mb-4" size={40} />
          <h3 className="text-2xl font-black mb-2 text-white">Need Legal Clarification?</h3>
          <p className="text-white/80 text-sm mb-6 max-w-xs font-medium">Contact our compliance team for any inquiries regarding these policies.</p>
<button 
  onClick={() => navigate('/support')}
  className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold uppercase text-sm hover:scale-105 transition-transform"
>
  Contact Support
</button>
        </section>
      </main>
    </div>
  );
}
