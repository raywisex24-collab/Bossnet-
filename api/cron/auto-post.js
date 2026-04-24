import { v2 as cloudinary } from 'cloudinary';
import admin from 'firebase-admin';

// 1. Setup Cloudinary using the URL variable you added
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

// 2. Setup Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

// 3. Real Professional Names List
const ghostUsers = [
  { name: "Emeka Nwosu", pic: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg" },
  { name: "Adesua Etomi", pic: "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg" },
  { name: "Tunde Bakare", pic: "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg" },
  { name: "Blessing Okereke", pic: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg" },
  { name: "Chinelo Opara", pic: "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg" },
  { name: "Damilola Adegbite", pic: "https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg" },
  { name: "Victor Ikechukwu", pic: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg" }
];

export default async function handler(req, res) {
  try {
    // 4. Fetch from Apify (TikTok Scraper)
    const apifyResponse = await fetch(`https://api.apify.com/v2/acts/apify~tiktok-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}&limit=1`);
    const tiktokData = await apifyResponse.json();
    const video = tiktokData[0];

    // 5. Upload to Cloudinary
    const upload = await cloudinary.uploader.upload(video.videoMeta.downloadAddr, {
      resource_type: "video",
      folder: "bossnet_auto_reels"
    });

    // 6. Pick a Random Real Person
    const randomUser = ghostUsers[Math.floor(Math.random() * ghostUsers.length)];

    // 7. Save to Firestore
    const db = admin.firestore();
    await db.collection('posts').add({
      caption: video.text || "Vibe check! 🚀",
      videoUrl: upload.secure_url,
      thumbnail: upload.thumbnail_url || "",
      authorName: randomUser.name,
      authorImg: randomUser.pic,
      type: "reel",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ success: true, postedBy: randomUser.name });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
