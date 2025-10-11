import { useState, useEffect } from "react";
import axios from "axios";
import { getUserSuggestions } from "../api/requests";

export function useUserSuggestions(username, setUsername, setUsers) {
  const [suggestions, setSuggestions] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!username.trim() || username.trim().length < 2) {
      setSuggestions([]);
      setVisible(false);
      return;
    }

    const controller = new AbortController();

    const fetchSuggestions = async () => {
      try {
        const data = await getUserSuggestions(username, controller.signal);
        setSuggestions(data.users || []);
        setVisible(true);
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log("Request canceled", err.message);
        } else {
          console.error("Error fetching suggestions:", err);
        }
      }
    };

    const timeout = setTimeout(fetchSuggestions, 300);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [username]);

  const handleClick = (suggestion) => {
    setUsers((prev) => [...prev, suggestion]);
    setUsername("");
    setVisible(false);
  };

  return { suggestions, visible, handleClick };
}