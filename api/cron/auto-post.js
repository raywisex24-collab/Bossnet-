import admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

// 1. INITIALIZE FIREBASE
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

// 2. CONFIGURE CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ghostUsers = [
  { name: 'Emeka Nwosu', avatar: 'https://i.pravatar.cc/150?u=emeka' },
  { name: 'Adesua Etomi', avatar: 'https://i.pravatar.cc/150?u=adesua' },
  { name: 'Tunde Ednut', avatar: 'https://i.pravatar.cc/150?u=tunde' },
  { name: 'Chioma Ade', avatar: 'https://i.pravatar.cc/150?u=chioma' }
];

export default async function handler(req, res) {
  try {
    // UPDATED: Calling the TikTok Scraper Actor directly
    const APIFY_URL = `https://api.apify.com/v2/acts/apify~tiktok-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`;
    
    const apifyResponse = await fetch(APIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "type": "hashtag",
        "hashtags": ["trending"], 
        "resultsPerPage": 1,
        "shouldDownloadVideos": false,
        "shouldDownloadCovers": false
      })
    });

    const data = await apifyResponse.json();

    // Check if TikTok returned data
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ 
        success: false, 
        message: "TikTok scraper returned no items.", 
        debug: data 
      });
    }

    const item = data[0];
    // TikTok scraper uses 'videoMeta.downloadAddr' or 'webVideoUrl'
    const videoUrl = item.videoMeta?.downloadAddr || item.webVideoUrl;

    if (!videoUrl) {
      return res.status(200).json({ 
        success: false, 
        message: "Found a TikTok post, but couldn't find the video link.",
        itemFound: item 
      });
    }

    // 3. UPLOAD TO CLOUDINARY
    const uploadResponse = await cloudinary.uploader.upload(videoUrl, {
      resource_type: 'video',
      folder: 'bossnet_tiktok',
    });

    // 4. SAVE TO FIREBASE
    const randomUser = ghostUsers[Math.floor(Math.random() * ghostUsers.length)];

    await db.collection('posts').add({
      authorName: randomUser.name,
      authorAvatar: randomUser.avatar,
      videoUrl: uploadResponse.secure_url,
      caption: item.text || "New trending TikTok! #Bossnet",
      likes: Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ 
      success: true, 
      message: "Victory! TikTok post is live on your app.",
      video: uploadResponse.secure_url
    });

  } catch (error) {
    console.error("Scraper Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
