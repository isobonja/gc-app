import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { logout as apiLogOut } from "../api/requests";

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