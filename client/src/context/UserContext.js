import { createContext, useState, useEffect } from "react";
import axios from 'axios';

import CenterSpinner from "../components/CenterSpinner";

import { getSession } from "../api/requests";

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
        const data = await getSession();

        if (data.loggedIn) {
          setUser({
            username: data.username,
            currentListId: data.currentListId,
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

  //if (loading) {
  //  return <CenterSpinner />; // optional spinner
  //}

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}