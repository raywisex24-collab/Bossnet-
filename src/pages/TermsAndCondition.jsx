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
          { label: 'Welcome Statement', content: 'Welcome to Bossnet, a secure and innovative digital platform built to connect people, empower communication, encourage creativity, and deliver a modern social experience designed for today’s fast-moving world. By accessing and using this application, you become part of a growing community focused on meaningful interaction, authentic engagement, privacy protection, and responsible digital expression. Our goal is to provide users with a reliable, user-friendly, and continuously evolving environment where individuals can communicate freely, share ideas confidently, build valuable connections, discover new opportunities, and enjoy advanced features designed to improve their overall experience. We are committed to maintaining a platform that values safety, respect, transparency, innovation, and community standards while ensuring that every user has access to tools and services that support creativity, networking, entertainment, collaboration, and personal growth. Bossnet continuously works to improve performance, strengthen security systems, introduce new technologies, optimize user satisfaction, and create a smooth and enjoyable experience across all supported devices and services. By continuing to use this platform, you acknowledge and agree to follow our policies, community standards, operational guidelines, and security measures established to protect both users and the integrity of the platform. We appreciate your trust, support, and participation in helping us build a strong, respectful, and engaging digital community where everyone has the opportunity to connect, interact, share experiences, and grow together in a secure and professional environment.' },
          { label: 'Purpose of Platform', content: 'The purpose of Bossnet is to provide users with a modern digital platform where individuals can connect, communicate, share content, express creativity, build communities, and engage in meaningful social interaction within a secure and user-friendly environment. The platform is designed to support real-time communication, content sharing, entertainment, networking, collaboration, and online engagement while giving users access to features that encourage interaction, self-expression, and community participation. Bossnet aims to create a balanced social experience where users can discover new people, maintain relationships, share updates, exchange ideas, upload media, participate in discussions, and explore content that matches their interests and preferences. Our mission is to build a reliable and continuously evolving platform that prioritizes innovation, accessibility, user satisfaction, digital safety, privacy protection, and respectful communication while maintaining high standards for performance, security, and community integrity. Through advanced technology and ongoing development, Bossnet seeks to provide an engaging social environment that supports personal connections, entertainment, creativity, communication, and global interaction for users across different backgrounds, devices, and regions.' },
          { label: 'Acceptance of Terms', content: 'By accessing, registering for, downloading, browsing, or using Bossnet and any of its related services, features, technologies, content, applications, or platforms, you acknowledge that you have read, understood, and agreed to enter into a legally binding agreement governed by our Terms of Service, Privacy Policy, Community Guidelines, and all additional policies, rules, operational procedures, and platform standards established by Bossnet. Your continued access to or use of the platform confirms your acceptance of these terms and your agreement to comply with all applicable laws, regulations, user responsibilities, security requirements, and community standards associated with the use of the services provided through the platform. If you do not agree with any part of these terms, policies, or conditions, you must immediately discontinue access to and use of the platform and all related services. Bossnet reserves the right to modify, update, restrict, suspend, or terminate access to any feature, service, account, or part of the platform at its sole discretion in order to maintain platform integrity, user safety, operational security, legal compliance, and overall service quality.' },
          { label: 'Eligibility', content: 'Users must be at least thirteen (13) years of age or the minimum digital consent age required within their country, region, or jurisdiction before creating an account, accessing, registering for, or using Bossnet and any of its related services, applications, features, technologies, or platforms. By accessing or using the platform, users confirm and represent that they meet the applicable minimum age requirements and possess the legal authority and capacity required to enter into and comply with this agreement under all relevant local, national, and international laws and regulations. Parents, guardians, or legal representatives are responsible for supervising minors where required by law and ensuring that such use complies with all applicable legal obligations and platform requirements. Access to certain features, services, or areas of the platform may be restricted, limited, modified, or unavailable in specific countries, territories, or jurisdictions due to local laws, regulatory requirements, licensing limitations, sanctions, operational policies, or other legal restrictions. Bossnet reserves the right to implement geographic limitations, deny access, suspend accounts, request age verification, or restrict platform availability at any time in order to maintain legal compliance, user safety, operational integrity, and adherence to applicable international regulations and regional legal standards.' },
          { label: 'Definitions', content: 'These Terms and Conditions include detailed provisions, definitions, responsibilities, limitations, and legal standards relating to User Content, platform services, technologies, intellectual property rights, digital communications, account usage, and Platform Ownership in order to clearly establish the rights, obligations, and protections applicable to all users and to Bossnet as the platform provider. “User Content” refers to all forms of content, information, materials, media, communications, uploads, submissions, comments, messages, audio, videos, photographs, graphics, usernames, profile details, creative works, and other data shared, published, transmitted, stored, displayed, or otherwise made available by users through the platform. “Services” refers to all applications, systems, software, features, technologies, tools, messaging functions, social networking capabilities, media-sharing functions, support systems, digital experiences, updates, and related operations provided, maintained, or controlled by Bossnet. “Platform Ownership” refers to the exclusive ownership, control, rights, titles, interests, branding, software architecture, systems, interfaces, technologies, designs, trademarks, proprietary materials, operational frameworks, and intellectual property associated with Bossnet and its related services, all of which remain the sole property of Bossnet and its authorized licensors unless otherwise expressly stated in writing. These provisions are intended to establish clear legal standards regarding content usage, user responsibilities, service limitations, intellectual property protection, operational control, licensing rights, platform management, and the lawful use of all services and technologies made available through the platform.' }
        ]
      },
      {
        subTitle: '2. User Accounts',
        items: [
          { label: 'Account Creation', content: 'Users are required to provide complete, accurate, current, and truthful information during the account registration process and throughout their continued use of Bossnet and its related services, features, applications, and technologies. All registration details, including but not limited to usernames, display names, email addresses, phone numbers, dates of birth, profile information, verification details, and other requested account data, must be valid, authentic, and lawfully provided by the individual creating or managing the account. Users may not provide false identities, misleading information, impersonate another individual or entity, use unauthorized credentials, create fraudulent accounts, or intentionally submit inaccurate, deceptive, or incomplete registration data for any purpose. Maintaining accurate account information is necessary to support account security, identity verification, communication reliability, user safety, service integrity, legal compliance, fraud prevention, and proper platform operation. Bossnet reserves the right to verify account information, request additional documentation or identity confirmation, restrict certain features, suspend access, remove inaccurate details, or permanently terminate accounts found to contain false, misleading, unauthorized, or unverifiable registration information in violation of platform policies, operational standards, or applicable laws and regulations.' },
          { label: 'Username Policies', content: 'Users are strictly prohibited from creating, using, registering, displaying, or promoting usernames, display names, profile identities, account descriptions, or related account information that contain offensive, abusive, hateful, discriminatory, misleading, defamatory, sexually explicit, violent, unlawful, or otherwise inappropriate language or content that may violate community standards, public safety requirements, intellectual property protections, or applicable laws and regulations. Users may not impersonate, imitate, falsely represent, or misleadingly associate themselves with any individual, organization, company, government entity, celebrity, public figure, brand, trademark holder, business, platform representative, or other identifiable person or entity in a manner that may cause confusion, deception, fraud, reputational harm, or unauthorized affiliation. This includes the unauthorized use of names, logos, branding elements, profile images, verification indicators, official titles, or other identifying characteristics intended to mislead other users into believing that an account is officially connected to, endorsed by, operated by, or affiliated with another person, company, or organization. Bossnet reserves the right to review, restrict, modify, remove, suspend, or permanently terminate any account, username, profile identity, or related content that violates these standards or is determined to create confusion, impersonation risks, community harm, intellectual property conflicts, or breaches of platform integrity, operational policies, or applicable legal requirements.' },
          { label: 'Security Obligations', content: 'Users are responsible for maintaining the security, confidentiality, and protection of their Bossnet accounts, login credentials, authentication methods, personal devices, and all activities conducted through their accounts. Each user must take reasonable and appropriate measures to safeguard account access information, including passwords, verification codes, recovery credentials, authentication devices, and linked communication channels, from unauthorized access, disclosure, misuse, theft, or compromise. Users may not share account credentials with unauthorized individuals, permit unauthorized access to their accounts, bypass security systems, attempt to gain unauthorized access to other accounts or platform infrastructure, exploit vulnerabilities, interfere with platform operations, distribute malicious software, engage in fraudulent activities, or perform any action intended to compromise the confidentiality, integrity, availability, or security of Bossnet services, systems, networks, databases, or users. Users are required to immediately notify Bossnet of any suspected or confirmed unauthorized access, security breach, account compromise, suspicious activity, identity misuse, or violation of platform security standards that may affect their accounts or the safety of the platform and its community. Bossnet may implement security monitoring systems, authentication procedures, verification requirements, device recognition technologies, automated threat detection measures, account reviews, access limitations, temporary restrictions, or other protective actions in order to maintain platform integrity, protect user data, prevent fraud, enforce operational security standards, and comply with applicable laws and regulatory obligations. Users acknowledge and agree that Bossnet reserves the right to suspend, restrict, investigate, recover, or permanently terminate accounts involved in activities that threaten platform security, violate operational safeguards, disrupt services, compromise user safety, infringe on intellectual property rights, or breach these Terms and Conditions. While Bossnet continuously works to maintain advanced security measures, users also understand and acknowledge that no digital platform, network, communication system, or online service can guarantee absolute security, uninterrupted operation, or complete protection against unauthorized access, cyber threats, technical failures, or unforeseen security incidents.' },
          { label: 'Account Rights', content: 'Bossnet reserves the full right, at its sole discretion and without prior notice where permitted by applicable law, to temporarily suspend, permanently disable, restrict access to, investigate, deactivate, remove, or permanently terminate user accounts that violate platform policies, community standards, operational requirements, legal obligations, security protocols, intellectual property protections, or any provisions contained within these Terms and Conditions. This includes accounts involved in fraudulent activities, unauthorized access attempts, impersonation, abusive conduct, harmful behavior, policy circumvention, spam distribution, suspicious activity, security threats, unlawful conduct, repeated violations, or any actions determined to negatively affect the integrity, safety, stability, reputation, or operation of the platform and its users. Bossnet also reserves the right to identify, restrict, archive, deactivate, or permanently delete accounts considered inactive, abandoned, unused, dormant, or unmaintained for an extended period of time in accordance with internal operational policies, storage management practices, security standards, or service maintenance requirements. Inactive accounts may be subject to removal of stored data, profile information, content, media, messages, usernames, preferences, and related account materials in order to maintain system efficiency, optimize platform resources, strengthen security management, and improve overall operational performance. Where appropriate and reasonably possible, Bossnet may provide warnings, notifications, recovery opportunities, or reactivation procedures before certain account actions are finalized; however, Bossnet is not obligated to preserve inactive accounts, maintain unused data indefinitely, or guarantee continued access to any account, content, feature, or service. Users acknowledge and agree that account suspension, deactivation, restriction, or deletion may result in the permanent loss of access to content, communications, followers, connections, stored materials, premium features, account history, and other associated platform data, and Bossnet shall not be held responsible for any resulting losses, interruptions, damages, or inconveniences arising from such actions taken in accordance with platform policies, operational needs, legal compliance obligations, or security requirements.' },
          { label: 'Transfer Prohibition', content: 'All Bossnet accounts are personal, non-transferable, and intended solely for use by the individual or authorized entity that originally created and registered the account through the official platform registration process. Ownership, control, access rights, account identity, usernames, profile history, verification status, followers, connections, and all associated account privileges remain exclusively tied to the original account creator and may not be transferred, reassigned, rented, leased, licensed, shared, gifted, traded, purchased, inherited, or otherwise provided to another individual, group, organization, or third party without the prior written authorization of Bossnet. Users are strictly prohibited from engaging in the sale, purchase, exchange, transfer, brokerage, trafficking, or commercial distribution of accounts, usernames, account credentials, verification badges, follower-based accounts, or any related account assets or access rights for financial gain, personal benefit, promotional purposes, fraudulent activity, or any unauthorized purpose. Any attempt to sell, purchase, transfer, or unlawfully obtain ownership or control of a Bossnet account shall constitute a serious violation of these Terms and Conditions, platform security standards, and operational policies. If Bossnet discovers, suspects, verifies, or reasonably determines that an account has been sold, transferred, exchanged, unlawfully reassigned, or otherwise compromised through unauthorized ownership activity, Bossnet reserves the immediate right to suspend, restrict, permanently disable, recover, or terminate the account and all related services without prior notice, warning, compensation, liability, or obligation to restore access. Such enforcement actions may also include the removal of associated content, forfeiture of usernames, cancellation of premium features, revocation of verification status, restriction of connected accounts, investigation of related activities, and additional enforcement measures deemed necessary to protect platform integrity, user security, operational stability, and compliance with applicable legal and regulatory standards. Users acknowledge and agree that Bossnet retains full authority to determine account ownership authenticity, investigate suspicious account activities, and enforce non-transferability policies at its sole discretion in order to maintain a secure, trustworthy, and transparent platform environment for all users.' }
        ]
      },
      {
        subTitle: '3. Acceptable Use Policy',
        items: [
          { label: 'Lawful Usage', content: 'All users of Bossnet are required to access and use the platform in full compliance with all applicable local, national, regional, and international laws, regulations, legal requirements, governmental directives, industry standards, and regulatory obligations relating to digital communications, online conduct, intellectual property, privacy protection, cybersecurity, data protection, financial activity, consumer protection, content distribution, and all other laws relevant to the use of online platforms and digital services. Users may not utilize Bossnet or any related services, technologies, systems, applications, or features for any unlawful, fraudulent, harmful, abusive, deceptive, unauthorized, or prohibited activity, including but not limited to identity theft, impersonation, harassment, cybercrime, unauthorized access, copyright infringement, fraud, distribution of malicious software, unlawful data collection, financial scams, misinformation campaigns, illegal advertising, or any conduct that violates the rights, safety, privacy, security, or legal protections of individuals, organizations, businesses, governments, or third parties. Users are solely responsible for ensuring that their activities, communications, content, transactions, interactions, and use of the platform remain lawful within their respective jurisdictions and comply with all applicable legal standards and restrictions. Bossnet reserves the right to investigate, monitor, restrict, suspend, report, cooperate with legal authorities regarding, or permanently terminate any account, activity, content, communication, transaction, or platform usage reasonably believed to violate applicable laws, legal processes, regulatory requirements, court orders, law enforcement requests, or these Terms and Conditions. Bossnet may also preserve, disclose, or provide account information, activity records, communications, technical data, or other relevant materials where legally required or reasonably necessary to comply with legal obligations, protect platform security, enforce platform policies, prevent unlawful conduct, safeguard users, cooperate with investigations, or defend the rights, property, reputation, operations, and legal interests of Bossnet and its community. Users acknowledge and agree that failure to comply with applicable laws or platform requirements may result in immediate enforcement actions, including content removal, feature restrictions, account suspension, permanent termination, legal reporting, forfeiture of platform privileges, or additional actions deemed necessary to maintain platform integrity, legal compliance, public safety, and operational security.' },
          { label: 'Prohibited Activities', content: 'Users are strictly prohibited from engaging in, promoting, facilitating, or participating in any form of spam, artificial engagement manipulation, automated activity, unauthorized data collection, or platform abuse through the use of scripts, bots, crawlers, automated systems, third-party tools, or deceptive digital practices. This includes, but is not limited to, the mass distribution of repetitive or unsolicited messages, misleading promotions, unauthorized advertisements, bulk communications, fake interactions, engagement farming, artificial follower growth, automated liking, automated commenting, automated sharing, fake views, coordinated manipulation of platform metrics, creation of fraudulent traffic, or any activity intended to falsely influence visibility, popularity, recommendations, rankings, trends, analytics, or user perception within the platform. Users may not use bots, automated software, emulators, unauthorized APIs, scraping technologies, extraction tools, indexing systems, or similar technologies to access, monitor, copy, harvest, collect, reproduce, download, store, exploit, or distribute platform data, user information, content, system resources, metadata, algorithms, or operational infrastructure without the prior written authorization of Bossnet. Any attempt to interfere with platform functionality, overload systems, bypass security protections, manipulate algorithms, exploit vulnerabilities, disrupt normal operations, or gain unfair advantages through automation or unauthorized technical activity shall constitute a serious violation of these Terms and Conditions and platform security standards. Bossnet reserves the right to implement monitoring technologies, automated detection systems, rate limitations, verification requirements, access controls, technical restrictions, security enforcement measures, and investigative procedures in order to identify, prevent, and respond to spam, automation abuse, scraping activity, fake engagement operations, fraudulent conduct, or other activities that threaten platform integrity, performance, fairness, user trust, or operational stability. Accounts, services, networks, devices, or related activities associated with prohibited automation, spam behavior, fake engagement, unauthorized scraping, or abusive technical conduct may be restricted, suspended, permanently terminated, blocked from access, reported to relevant authorities, or subjected to additional enforcement actions without prior notice at the sole discretion of Bossnet.' },
          { label: 'Safety Rules', content: 'Users are strictly prohibited from engaging in any form of harassment, abuse, intimidation, hate speech, threatening behavior, fraudulent activity, deceptive conduct, or any other actions that may harm, exploit, endanger, discriminate against, manipulate, or negatively affect other users, organizations, communities, or third parties through the use of Bossnet and its related services. This prohibition applies to all forms of communication, interactions, content, media, profile activity, messaging systems, comments, usernames, group participation, and any other activity conducted on or through the platform. Harassment includes, but is not limited to, repeated unwanted contact, bullying, stalking, targeted abuse, humiliation, intimidation, blackmail, malicious accusations, coordinated attacks, or behavior intended to cause emotional distress, fear, reputational damage, or disruption to another individual’s experience on the platform. Hate speech and discriminatory conduct, including content or behavior that promotes, encourages, glorifies, or targets individuals or groups based on race, ethnicity, nationality, religion, disability, gender, sexual orientation, age, or other protected characteristics, are strictly forbidden and will not be tolerated under any circumstances. Users may not post, share, communicate, or distribute threats of violence, harmful conduct, unlawful activity, extortion, coercion, or any statements intended to create fear, panic, intimidation, or danger to individuals, communities, organizations, or public safety. Fraudulent behavior, including scams, impersonation, financial deception, phishing attempts, identity theft, misleading schemes, fake promotions, unauthorized solicitation, deceptive advertising, manipulation of users for financial or personal gain, or any activity intended to unlawfully obtain money, information, access, influence, or benefits from others, is strictly prohibited and may result in immediate enforcement action. Bossnet reserves the right to investigate, restrict, remove, report, suspend, or permanently terminate any accounts, content, communications, activities, or interactions determined to violate these standards or pose a risk to user safety, community trust, legal compliance, operational integrity, or platform security. Bossnet may also cooperate with law enforcement agencies, regulatory authorities, legal representatives, or other relevant entities where required by law or reasonably necessary to prevent harm, investigate unlawful conduct, protect users, enforce platform policies, or safeguard the rights, reputation, security, and operations of Bossnet and its community.' },
          { label: 'Platform Security', content: 'Users are strictly prohibited from creating, uploading, distributing, deploying, transmitting, promoting, testing, introducing, or attempting to use any form of malicious software, harmful code, unauthorized scripts, exploitative technologies, reverse-engineering methods, automated attack systems, or technical mechanisms intended to interfere with, manipulate, damage, disrupt, exploit, monitor, compromise, or gain unauthorized access to Bossnet, its applications, infrastructure, services, systems, databases, networks, software architecture, security mechanisms, source code, user interfaces, APIs, or related technologies. This prohibition includes, but is not limited to, malware, viruses, trojans, ransomware, spyware, worms, keyloggers, hidden scripts, unauthorized plugins, injection attacks, denial-of-service attacks, scraping systems, exploit frameworks, packet manipulation, code tampering, unauthorized debugging, bypass systems, modified application packages, cloned applications, emulators designed for abuse, unauthorized automation tools, security circumvention methods, decompilation attempts, reverse engineering activities, vulnerability exploitation, source code extraction, interface manipulation, or any technical activity intended to alter, interfere with, or undermine the normal operation, security, appearance, functionality, stability, integrity, or intended behavior of the platform and its related services. Users may not manipulate, modify, imitate, intercept, alter, repackage, duplicate, interfere with, or tamper with any aspect of the user interface, operational systems, application structure, backend technologies, databases, algorithms, authentication systems, monetization systems, verification systems, account controls, security layers, or proprietary code used in the creation, operation, maintenance, or protection of Bossnet. Any attempt to exploit vulnerabilities, bypass restrictions, gain unauthorized privileges, manipulate platform behavior, interfere with platform performance, alter service functionality, compromise platform integrity, or tamper with the technological foundations of Bossnet shall constitute a severe violation of these Terms and Conditions, intellectual property protections, cybersecurity standards, operational policies, and applicable laws and regulations. Bossnet reserves the unrestricted right to actively monitor platform activity, investigate suspicious behavior, analyze technical interactions, implement automated detection systems, deploy security countermeasures, preserve technical evidence, and take immediate enforcement action against any account, device, network, software environment, or activity associated with unauthorized manipulation, exploitation, interference, tampering, or malicious technical conduct. Any account found, suspected, or reasonably determined by Bossnet to have manipulated, modified, exploited, reverse engineered, interfered with, or tampered with the platform’s user interface, operational systems, security mechanisms, software code, proprietary technologies, or foundational infrastructure may be immediately suspended, permanently deleted, restricted from future access, and removed from all related services without prior warning, notification, appeal, compensation, or obligation to restore access. Bossnet also reserves the right to pursue additional enforcement actions, including civil claims, financial recovery, intellectual property enforcement, injunctive relief, cooperation with cybersecurity investigators, reporting to regulatory bodies, and referral to law enforcement authorities where necessary to protect the platform, its users, its proprietary technologies, its business operations, and its legal rights. Users acknowledge and agree that the software, systems, designs, architecture, interfaces, operational structures, security technologies, algorithms, databases, and underlying code that form the foundation of Bossnet constitute protected proprietary property and confidential technological assets owned, licensed, or controlled by Bossnet, and any unauthorized tampering, interference, exploitation, duplication, manipulation, or misuse of these systems may expose the responsible individual or entity to permanent platform bans, legal liability, financial damages, criminal investigations, regulatory penalties, and other legal consequences permitted under applicable local, national, and international laws.' }
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
