export const categoryIdToName = (id, categories) => {
  const category = categories.find(cat => cat.category_id === id);
  return category ? category.name : '';
};

export const formatListUserDisplay = (otherUsers) => {
  /* otherUsers is an array of usernames */
  if (otherUsers.length === 0) return '';
  if (otherUsers.length === 1) return otherUsers[0];
  if (otherUsers.length === 2) return `${otherUsers[0]} and ${otherUsers[1]}`;
  return `${otherUsers[0]}, ${otherUsers[1]} and ${otherUsers.length - 2} others`;
};

export const capitalize = (s) => {
  if (s === null || s === undefined) return '';
  return String(s)
    .split(/([ /])/g) // split by space or '/' but keep the delimiters
    .map(part => {
      // only capitalize non-delimiter parts
      return part === ' ' || part === '/' ? part : part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
};

export const sortArray = (array, key, ascending = true) => {
  console.log(`Array: ${JSON.stringify(array)}\nKey: ${key}`);
  if (!key) return array;
  const rkey = key.replace(/ /g, "_");

  return [...array].sort((a, b) => {
    let aVal = a[rkey];
    let bVal = b[rkey];

    // Handle string comparison (case-insensitive)
    if (typeof aVal === "string" && typeof bVal === "string") {
      // If both look like date strings, parse them
      const aDate = Date.parse(aVal);
      const bDate = Date.parse(bVal);

      if (!isNaN(aDate) && !isNaN(bDate)) {
        aVal = aDate;
        bVal = bDate;
      } else {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
    }

    if (aVal < bVal) return ascending ? -1 : 1;
    if (aVal > bVal) return ascending ? 1 : -1;
    return 0;
  });
};

export function convertUTCToLocal(utcString, options = {
  dateStyle: "medium",
  timeStyle: "short"
}) {
  if (!utcString) return null;
  try {
    const utcDate = new Date(utcString + " UTC");
    return utcDate.toLocaleString(undefined, options);
  } catch (err) {
    console.error("Error converting UTC to local:", err);
    return null;
  }
}