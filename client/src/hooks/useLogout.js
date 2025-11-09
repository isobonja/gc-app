import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { logout as apiLogOut } from "../api/requests";

/**
 * Custom React hook that returns a logout function.
 *
 * @returns {Function} - An asynchronous function that:
 *   - Calls the backend API to log out the user.
 *   - Clears the user context.
 *   - Navigates the user to the home (`"/"`) route.
 *
 * @example
 * const logout = useLogout();
 * <Button onClick={logout}>Log Out</Button>
 *
 * @description
 * When invoked, this hook:
 * - Calls the `logout` API endpoint to invalidate the user session.
 * - On success, sets the global user context to `null`.
 * - Redirects the user to the home page.
 * - Logs an error message to the console if logout fails.
 */
export function useLogout() {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  return async () => {
    try {
      const data = await apiLogOut();
      if (data.success) {
        setUser(null);
        navigate('/');
      }
    } catch {
      console.error("Unable to log out, please try again later.");
    }
  };
}