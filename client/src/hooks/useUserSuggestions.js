import { useState, useEffect } from "react";
import axios from "axios";
import { getUserSuggestions } from "../api/requests";

/**
 * Custom React hook to fetch and manage user suggestions for an input field.
 *
 * @param {string} username - The current username input value.
 * @param {Function} setUsername - Setter function to update the username input value.
 * @param {Function} setUsers - Setter function to update the selected users list.
 *
 * @returns {Object} An object containing:
 * - `suggestions` {Array}: List of suggested user objects from the API.
 * - `visible` {boolean}: Whether the suggestions dropdown should be visible.
 * - `handleClick` {Function}: Handles selection of a suggestion (adds it to the list, clears input).
 *
 * @example
 * const { suggestions, visible, handleClick } = useUserSuggestions(username, setUsername, setUsers);
 *
 * @description
 * - The hook automatically debounces API requests by 300ms to reduce server load.
 * - Uses an `AbortController` to cancel previous requests when the user types quickly.
 * - Only triggers API calls when the input has at least 2 characters.
 * - On suggestion click, it clears the input, hides the dropdown, and updates the selected users list.
 * - Relies on an external API method `getUserSuggestions` for fetching suggestions.
 */
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