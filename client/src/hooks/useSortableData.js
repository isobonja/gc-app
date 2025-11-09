import { useState, useMemo } from 'react';
import { sortArray } from '../util/utils';

/**
 * Custom React hook for sorting an array of objects by a given key.
 *
 * @param {Array} list - The array of data to sort.
 * @param {Object} [initialConfig={ key: null, ascending: true }] - Optional initial sort configuration.
 * @param {string|null} initialConfig.key - The key used to sort the list.
 * @param {boolean} initialConfig.ascending - Whether the initial sort order is ascending.
 *
 * @returns {Object} An object containing:
 * - `sortedList` {Array}: The list sorted according to the current configuration.
 * - `sortConfig` {Object}: The current sorting configuration (`{ key, ascending }`).
 * - `handleSortItems` {Function}: Function to toggle sorting by a specific key.
 *
 * @example
 * const { sortedList, sortConfig, handleSortItems } = useSortableData(items);
 *
 * // Example usage in a component:
 * <th onClick={() => handleSortItems('name')}>
 *   Name {sortConfig.key === 'name' && (sortConfig.ascending ? '▲' : '▼')}
 * </th>
 *
 * @description
 * - The hook automatically memoizes the sorted data to prevent unnecessary recomputation.
 * - If the same key is clicked twice, it toggles between ascending and descending order.
 * - Relies on a utility function `sortArray` for sorting logic.
 */
export const useSortableData = (list, initialConfig = { key: null, ascending: true }) => {
  const [sortConfig, setSortConfig] = useState(initialConfig);

  const sortedList = useMemo(() => {
    if (!sortConfig.key) return list;
    return sortArray(list, sortConfig.key, sortConfig.ascending);
  }, [list, sortConfig]);

  const handleSortItems = (key) => {
    setSortConfig((prev) => ({
      key,
      ascending: prev.key === key ? !prev.ascending : true,
    }));
  };

  return { sortedList, sortConfig, handleSortItems };
};
