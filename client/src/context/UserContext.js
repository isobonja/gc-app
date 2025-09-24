import { createContext, useState, useEffect } from "react";
import axios from 'axios';

import CenterSpinner from "../components/CenterSpinner";

export const UserContext = createContext({
  user: { username: "", currentListId: null },
  setUser: () => {},
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, fetch Flask session
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await axios.get("/api/session", {
          withCredentials: true, // send cookies to Flask
        });

        if (res.data.loggedIn) {
          setUser({
            username: res.data.username,
            currentListId: res.data.currentListId,
          });
        }
      } catch (err) {
        console.error("Error fetching session:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, []);

  if (loading) {
    return <CenterSpinner />; // optional spinner
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}