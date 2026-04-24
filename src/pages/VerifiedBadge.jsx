import React from 'react';

export default function VerifiedBadge({ isVerified }) {
  // If the user isn't verified in Firestore, show nothing
  if (!isVerified) return null;

  return (
    <svg 
      viewBox="0 0 24 24" 
      className="w-[14px] h-[14px] fill-[#0095f6] ml-0.2 flex-shrink-0"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z" />
    </svg>
  );
}

