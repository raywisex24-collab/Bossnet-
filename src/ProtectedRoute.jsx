import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [hasUsername, setHasUsername] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // ✅ CHECK FIRESTORE FOR USERNAME
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists() && userDoc.data().username) {
            setHasUsername(true);
          } else {
            setHasUsername(false);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setHasUsername(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(147,51,234,0.3)]"></div>
      </div>
    );
  }

  // 1. If not logged in at all, go to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. ✅ FORCE ONBOARDING
  // If they are logged in but HAVE NO USERNAME, and aren't already on the onboarding page
  if (!hasUsername && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // 3. Prevent loop: If they HAVE a username, don't let them stay on onboarding
  if (hasUsername && location.pathname === "/onboarding") {
    return <Navigate to="/feed" replace />;
  }

  return children;
};

export default ProtectedRoute;

