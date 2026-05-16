import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth, db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore"; // 👈 Changed getDoc to onSnapshot for real-time security
import Swal from 'sweetalert2';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [hasUsername, setHasUsername] = useState(false);
  const [isBanned, setIsBanned] = useState(false); // 👈 1. ADDED BAN STATE
  const location = useLocation();

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // 👈 2. REAL-TIME LISTENER ON THE USER DOCUMENT
        unsubscribeDoc = onSnapshot(doc(db, "users", currentUser.uid), (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();

            // 👈 3. CRITICAL BAN CHECK LOGIC
            if (data.isBanned === true) {
              setIsBanned(true);
              auth.signOut(); // Force clear their active auth session
              Swal.fire({
                title: "Account Suspended",
                text: "Your account has been banned for violating community guidelines, boss.",
                icon: "error",
                background: "#050505",
                color: "#fff",
                confirmButtonColor: "#ef4444",
                customClass: { popup: 'rounded-[25px] border border-white/10' }
              });
              setLoading(false);
              return;
            }

            // 👈 4. FIXED ONBOARDING BUG HERE
            // Checks if a username actually exists in the database.
            // If username exists, onboarding is complete!
            if (data.username && data.username.trim() !== "") {
              setHasUsername(true);
            } else {
              setHasUsername(false);
            }
          } else {
            setHasUsername(false);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user data:", error);
          setLoading(false);
        });
      } else {
        // If not logged in at all, turn off loading and clean up document stream listener
        if (unsubscribeDoc) unsubscribeDoc();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(147,51,234,0.3)]"></div>
      </div>
    );
  }

  // 1. If not logged in at all or account is flagged as banned, kick to login screen
  if (!user || isBanned) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. FORCE ONBOARDING
  if (!hasUsername && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // 3. Prevent loop: If they HAVE a username, don't let them stay on onboarding page
  if (hasUsername && location.pathname === "/onboarding") {
    return <Navigate to="/feed" replace />;
  }

  return children;
};

export default ProtectedRoute;
