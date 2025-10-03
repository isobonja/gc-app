export const categoryIdToName = (id, categories) => {
  const category = categories.find(cat => cat.category_id === id);
  return category ? category.name : '';
};