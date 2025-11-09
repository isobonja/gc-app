import { useState, useEffect } from "react";
import axios from "axios";
import { getItemSuggestions } from "../api/requests";
import { categoryIdToName } from "../util/utils";

/**
 * Custom React hook to manage item suggestions for an input field.
 *
 * @param {string} currentName - The current input value for the item name.
 * @param {Array<Object>} categories - List of available categories, used to resolve category names.
 * @param {Function} setItem - Setter function to update the selected item object.
 *
 * @returns {{
 *   suggestions: Array<Object>,
 *   visible: boolean,
 *   handleClick: (suggestion: Object) => void
 * }} - Returns an object containing:
 *   - `suggestions`: Array of suggested items fetched from the backend.
 *   - `visible`: Whether the suggestions dropdown should be visible.
 *   - `handleClick`: Function to call when a suggestion is selected.
 *
 * @example
 * const { suggestions, visible, handleClick } = useItemSuggestions(itemName, categories, setItem);
 *
 * @description
 * - Automatically fetches item suggestions when `currentName` changes and has ≥ 2 characters.
 * - Debounces API calls by 300ms to prevent excessive requests.
 * - Cancels previous API calls if a new one is triggered (via `AbortController`).
 * - On suggestion click, updates the item’s `name`, `category`, and `id` using the provided setter.
 */
export function useItemSuggestions(currentName, categories, setItem) {
  const [suggestions, setSuggestions] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!currentName.trim() || currentName.trim().length < 2) {
      setSuggestions([]);
      setVisible(false);
      return;
    }

    const controller = new AbortController();

    const fetchSuggestions = async () => {
      try {
        const data = await getItemSuggestions(currentName, controller.signal);
        setSuggestions(data.items || []);
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
  }, [currentName]);

  const handleClick = (suggestion) => {
    setItem((prev) => ({
      ...prev,
      name: suggestion.name,
      category: categoryIdToName(suggestion.category_id, categories),
      id: suggestion.item_id,
    }));
    setVisible(false);
  };

  return { suggestions, visible, handleClick };
}