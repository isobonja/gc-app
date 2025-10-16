// BAREBONES FILE FOR NOW
// Will need to add stuff like base API URL, routes, toast types, etc. later


export const SUGGESTIONS_MAX_SHOW = 5;

export const LIST_TABLE_HEADERS = ["name", "category", "quantity"];

export const DASHBOARD_TABLE_HEADERS = ["name", "type", "role", "last updated"];

// Eventually, move all these role-related things into a separate roles.js file

export const ROLE_LEVELS = {
  Owner: 4,
  Admin: 3,
  Editor: 2,
  Viewer: 1,
  Temporary: 0,
};

// Helper array (if you still need the names)
export const ROLE_NAMES = Object.keys(ROLE_LEVELS);

// Generic comparison helper
export const hasPermission = (userRole, requiredRole) => {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
};

export const getLowerRoles = (role) => {
  const currentLevel = ROLE_LEVELS[role];
  return Object.entries(ROLE_LEVELS)
    .filter(([_, level]) => level < currentLevel)
    .map(([name]) => name);
};

// Specific helpers (if you want shorthand)
export const isOwner = (role) => role === "Owner";
export const canManageUsers = (role) => hasPermission(role, "Admin");
export const canEdit = (role) => hasPermission(role, "Editor");
export const canView = (role) => hasPermission(role, "Viewer");