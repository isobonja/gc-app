export const categoryIdToName = (id, categories) => {
  const category = categories.find(cat => cat.category_id === id);
  return category ? category.name : '';
};

export const formatListCardUserDisplay = (otherUsers) => {
  /* otherUsers is an array of usernames */
  if (otherUsers.length === 0) return '';
  if (otherUsers.length === 1) return otherUsers[0];
  if (otherUsers.length === 2) return `${otherUsers[0]} and ${otherUsers[1]}`;
  return `${otherUsers[0]}, ${otherUsers[1]} and ${otherUsers.length - 2} others`;
};