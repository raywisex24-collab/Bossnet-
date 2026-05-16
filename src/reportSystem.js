import { db, auth } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

/**
 * Global Report Handler for Bossnet
 * @param {string} itemType - 'post' | 'reel' | 'comment' | 'user' | 'group'
 * @param {Object} itemData - The raw object data of the item being reported
 */
export const submitGlobalReport = async (itemType, itemData) => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    Swal.fire("Authentication Required", "You must be logged in to file a report.", "error");
    return;
  }

  // 1. Let the user choose a reason using SweetAlert
  const { value: reasonText } = await Swal.fire({
    title: `Report this ${itemType}?`,
    input: 'select',
    inputOptions: {
      'Spam': 'Spam / Automated content',
      'Hate Speech': 'Hate speech or symbols',
      'Harassment': 'Harassment or bullying',
      'Inappropriate': 'Inappropriate media / Nudity',
      'Scam': 'Scam or fraud',
      'Other': 'Other violations'
    },
    inputPlaceholder: 'Select a reason for the report',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Submit Report',
    background: '#1a1a20',
    color: '#fff',
    customClass: { popup: 'rounded-[25px] border border-white/10' }
  });

  // If user cancels or doesn't select a reason, exit early
  if (!reasonText) return;

  try {
    // 2. Map standard fields depending on what type of item is being reported
    const reportPayload = {
      targetType: itemType, // tells the admin panel what it is looking at
      targetId: itemData.id || itemData.uid || "", // the document ID of the item
      reason: reasonText,
      reportedByUid: currentUser.uid,
      reportedByUsername: currentUser.displayName || "anonymous",
      createdAt: new Date(),
      
      // Dynamic snapshots so the Admin Panel can display context instantly
      postText: itemData.text || itemData.caption || itemData.content || itemData.bio || `Reported ${itemType}`,
      postImage: itemData.image || itemData.imageUrl || itemData.profilePic || null,
      ownerUid: itemData.userId || itemData.uid || itemData.senderId || ""
    };

    // 3. Push to your unified global reports collection
    await addDoc(collection(db, "reports"), reportPayload);

    Swal.fire({
      title: "Report Submitted",
      text: "Thank you, boss. Our administration team will review this item immediately.",
      icon: "success",
      background: '#1a1a20',
      color: '#fff',
      confirmButtonColor: '#0095f6',
      customClass: { popup: 'rounded-[25px]' }
    });

  } catch (error) {
    console.error(`Failed to submit report for ${itemType}:`, error);
    Swal.fire("Error", "Could not submit report right now.", "error");
  }
};

