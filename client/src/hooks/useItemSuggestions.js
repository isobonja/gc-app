import { useState, useEffect } from "react";
import axios from "axios";
import { getItemSuggestions } from "../api/requests";
import { categoryIdToName } from "../util/utils";

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