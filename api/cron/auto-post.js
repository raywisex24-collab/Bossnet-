import admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

// 1. FIREBASE SETUP
if (!admin.apps.length) {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const formattedKey = rawKey ? rawKey.replace(/\\n/g, '\n').replace(/"/g, '').trim() : undefined;
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formattedKey,
    }),
  });
}
const db = admin.firestore();

// 2. CLOUDINARY SETUP
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 3. YOUR 7 PROFESSIONAL GHOST USERS
const ghostUsers = [
  { name: 'Emeka Nwosu', avatar: 'https://i.pravatar.cc/150?u=emeka' },
  { name: 'Adesua Etomi', avatar: 'https://i.pravatar.cc/150?u=adesua' },
  { name: 'Tunde Ednut', avatar: 'https://i.pravatar.cc/150?u=tunde' },
  { name: 'Chioma Adeyemi', avatar: 'https://i.pravatar.cc/150?u=chioma' },
  { name: 'Babatunde Olatunji', avatar: 'https://i.pravatar.cc/150?u=baba' },
  { name: 'Zainab Balogun', avatar: 'https://i.pravatar.cc/150?u=zainab' },
  { name: 'Olumide Oworu', avatar: 'https://i.pravatar.cc/150?u=olumide' }
];

export default async function handler(req, res) {
  try {
    // 4. FETCH FROM APIFY (Using the direct URL from your screenshot)
    const APIFY_URL = `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`;
    
    const apifyResponse = await fetch(APIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "hashtags": ["trending"], 
        "resultsPerPage": 1
      })
    });

    const data = await apifyResponse.json();

    if (!data || data.length === 0) {
      return res.status(200).json({ success: false, message: "No data found on Apify." });
    }

    const item = data[0];
    
    // 5. EXTRACT THE DIRECT VIDEO (Using webVideoUrl from your screenshot)
    const tiktokVideo = item.webVideoUrl;

    if (!tiktokVideo) {
      return res.status(200).json({ success: false, message: "No video URL in the JSON." });
    }

    // 6. UPLOAD TO CLOUDINARY (This makes the link permanent so it doesn't expire)
    const upload = await cloudinary.uploader.upload(tiktokVideo, {
      resource_type: 'video',
      folder: 'bossnet_reels'
    });

    // 7. PICK A GHOST USER & SAVE TO FIREBASE
    const randomUser = ghostUsers[Math.floor(Math.random() * ghostUsers.length)];

    const finalPost = {
      authorName: randomUser.name,
      authorAvatar: randomUser.avatar,
      videoUrl: upload.secure_url,
      caption: item.text || "New trend alert! #Bossnet",
      likes: item.diggCount || Math.floor(Math.random() * 500),
      createdAt: new Date().toISOString()
    };

    // MAKE SURE THIS COLLECTION NAME MATCHES YOUR APP (e.g., 'posts' or 'reels')
    await db.collection('posts').add(finalPost);

    return res.status(200).json({ 
      success: true, 
      message: "Victory! Post is now live on your reels page.",
      video: upload.secure_url,
      postedBy: randomUser.name
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

