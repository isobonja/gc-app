// UNUSED AT THE MOMENT

import { useState, useMemo } from 'react';
import { sortArray } from '../util/utils';

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
