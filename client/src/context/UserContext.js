/**
 * User Context and Provider
 *
 * Provides global user session state across the application. Automatically fetches
 * the current Flask session on mount and stores user information (username, current list ID).
 *
 * @module UserProvider
 */
import { createContext, useState, useEffect } from "react";

import { getSession } from "../api/requests";

/**
 * UserContext
 *
 * React context holding user session data and a setter function.
 *
 * @typedef {Object} UserContextValue
 * @property {{ username: string, currentListId: number|null } | null} user
 *    The current user object, or `null` if not logged in.
 * @property {Function} setUser
 *    Updates the user state.
 *
 * @constant
 */
export const UserContext = createContext({
  user: { username: "", currentListId: null },
  setUser: () => {},
});

/**
 * UserProvider Component
 *
 * Wraps the app and provides user session state through `UserContext`.
 * On mount, it fetches the active session from the Flask backend via `getSession()`
 * and sets the `user` state accordingly.
 *
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Components that should have access to user data.
 *
 * @example
 * return (
 *   <UserProvider>
 *     <App />
 *   </UserProvider>
 * );
 *
 * @description
 * - Calls `getSession()` once on initial mount to check if the user is logged in.
 * - Updates the `user` state with username and current list ID if a valid session exists.
 * - Exposes `user` and `setUser` through context for global access.
 *
 * @returns {JSX.Element} React context provider with user session data.
 */
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

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}