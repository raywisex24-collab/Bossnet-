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

export default async function handler(req, res) {
  try {
    // UPDATED URL: Using the 'clockworks' TikTok Scraper which is the standard
    const APIFY_URL = `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`;
    
    const apifyResponse = await fetch(APIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "hashtags": ["trending"], 
        "resultsPerPage": 1,
        "excludeFakeAds": true
      })
    });

    const data = await apifyResponse.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ 
        success: false, 
        message: "No TikToks found. Check Apify URL or Token.", 
        debug: data 
      });
    }

    const item = data[0];
    
    // TikTok data mapping based on your console screenshot
    const videoUrl = item.videoMeta?.downloadAddr || item.webVideoUrl;
    const authorName = item.authorMeta?.name || "TikTok User";
    const authorAvatar = item.authorMeta?.avatar || "https://i.pravatar.cc/150";
    const caption = item.text || "Check this out! #Bossnet";

    if (!videoUrl) {
      return res.status(200).json({ success: false, message: "Video link missing in TikTok data." });
    }

    // 3. UPLOAD TO CLOUDINARY
    const uploadResponse = await cloudinary.uploader.upload(videoUrl, {
      resource_type: 'video',
      folder: 'bossnet_tiktok',
    });

    // 4. SAVE TO FIREBASE
    await db.collection('posts').add({
      authorName: authorName,
      authorAvatar: authorAvatar,
      videoUrl: uploadResponse.secure_url,
      caption: caption,
      likes: item.diggCount || Math.floor(Math.random() * 500),
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ 
      success: true, 
      message: "Victory! The TikTok is now on Bossnet.",
      video: uploadResponse.secure_url
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
