import admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

// 1. INITIALIZE FIREBASE (With the final parse fix)
if (!admin.apps.length) {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const formattedKey = rawKey 
    ? rawKey.replace(/\\n/g, '\n').replace(/"/g, '').trim() 
    : undefined;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formattedKey,
    }),
  });
}

const db = admin.firestore();

// 2. CONFIGURE CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 3. GHOST USER DATA
const ghostUsers = [
  { name: 'Emeka Nwosu', avatar: 'https://i.pravatar.cc/150?u=emeka' },
  { name: 'Adesua Etomi', avatar: 'https://i.pravatar.cc/150?u=adesua' },
  { name: 'Tunde Ednut', avatar: 'https://i.pravatar.cc/150?u=tunde' },
  { name: 'Chioma Ade', avatar: 'https://i.pravatar.cc/150?u=chioma' }
];

export default async function handler(req, res) {
  try {
    // A. Fetch from Apify
    const apifyResponse = await fetch(`https://api.apify.com/v2/actor-tasks/raywise~instagram-scraper-task/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`);
    const data = await apifyResponse.json();

    // B. Check if data exists (The fix for your latest error)
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ 
        success: false, 
        message: "Apify returned no items. Check your Instagram Scraper task.",
        debug: data 
      });
    }

    const item = data[0];
    const videoUrl = item.videoUrl || item.displayUrl;

    if (!videoUrl) {
       return res.status(200).json({ 
        success: false, 
        message: "Found an item, but it has no videoUrl.",
        itemFound: item 
      });
    }

    const caption = item.caption || "Check out this new reel! #Bossnet";

    // C. Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(videoUrl, {
      resource_type: 'video',
      folder: 'bossnet_reels',
    });

    // D. Pick a random Ghost User
    const randomUser = ghostUsers[Math.floor(Math.random() * ghostUsers.length)];

    // E. Save to Firebase
    const newPost = {
      authorName: randomUser.name,
      authorAvatar: randomUser.avatar,
      videoUrl: uploadResponse.secure_url,
      caption: caption,
      likes: Math.floor(Math.random() * 500),
      createdAt: new Date().toISOString(),
    };

    // Change 'posts' to whatever your collection is named
    await db.collection('posts').add(newPost);

    return res.status(200).json({ 
      success: true, 
      message: "Post created successfully!", 
      postedBy: randomUser.name,
      video: uploadResponse.secure_url
    });

  } catch (error) {
    console.error("Auto-Post Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
