export const ROLE_META = {
  city_president: {
    label: "City President",
    level: "city",
    rank: 3,
    canCreate: ["city_vice_president", "city_secretary", "city_finance_manager", "social_media_manager", "zone_president", "zone_vice_president", "zone_secretary", "zone_finance_manager", "unit_president", "unit_vice_president", "unit_secretary", "unit_finance_manager"]
  },
  city_vice_president: {
    label: "City Vice President",
    level: "city",
    rank: 3,
    canCreate: ["zone_president", "zone_vice_president", "zone_secretary", "unit_president", "unit_vice_president", "unit_secretary"]
  },
  city_secretary: {
    label: "City Secretary",
    level: "city",
    rank: 3,
    canCreate: ["zone_secretary", "unit_secretary"]
  },
  city_finance_manager: {
    label: "City Finance Manager",
    level: "city",
    rank: 3,
    canCreate: []
  },
  zone_president: {
    label: "Zone President",
    level: "zone",
    rank: 2,
    canCreate: ["zone_vice_president", "zone_secretary", "zone_finance_manager", "social_media_manager", "unit_president", "unit_vice_president", "unit_secretary", "unit_finance_manager"]
  },
  zone_vice_president: {
    label: "Zone Vice President",
    level: "zone",
    rank: 2,
    canCreate: ["unit_president", "unit_vice_president", "unit_secretary"]
  },
  zone_secretary: {
    label: "Zone Secretary",
    level: "zone",
    rank: 2,
    canCreate: ["unit_secretary"]
  },
  zone_finance_manager: {
    label: "Zone Finance Manager",
    level: "zone",
    rank: 2,
    canCreate: []
  },
  unit_president: {
    label: "Unit President",
    level: "unit",
    rank: 1,
    canCreate: ["unit_vice_president", "unit_secretary", "unit_finance_manager", "social_media_manager"]
  },
  unit_vice_president: {
    label: "Unit Vice President",
    level: "unit",
    rank: 1,
    canCreate: ["unit_secretary"]
  },
  unit_secretary: {
    label: "Unit Secretary",
    level: "unit",
    rank: 1,
    canCreate: []
  },
  unit_finance_manager: {
    label: "Unit Finance Manager",
    level: "unit",
    rank: 1,
    canCreate: []
  },
  social_media_manager: {
    label: "Social Media Manager",
    level: "unit",
    rank: 1,
    canCreate: []
  }
};

export const ROLES = Object.keys(ROLE_META);

export function getRoleLevel(role) {
  return ROLE_META[role]?.level;
}

export function roleLabel(role) {
  return ROLE_META[role]?.label || role;
}

export function canCreateRole(actorRole, targetRole) {
  return ROLE_META[actorRole]?.canCreate.includes(targetRole) || false;
}

export function isCityUser(user) {
  return ROLE_META[user.role]?.level === "city";
}

export function idOf(value) {
  if (!value) return value;
  if (value._id) return value._id;
  return value;
}

export function sameId(left, right) {
  if (!left || !right) return false;
  return String(idOf(left)) === String(idOf(right));
}

export function canAccessScope(user, scopeType, zoneId, unitId) {
  const level = getRoleLevel(user.role);

  if (level === "city") return true;

  if (level === "zone") {
    if (scopeType === "city") return false;
    return sameId(user.zone, zoneId);
  }

  if (level === "unit") {
    return scopeType === "unit" && sameId(user.unit, unitId);
  }

  return false;
}

export function canWriteFinance(user, scopeType, zoneId, unitId) {
  const level = getRoleLevel(user.role);
  const financeRoles = new Set([
    "city_president",
    "city_finance_manager",
    "zone_president",
    "zone_finance_manager",
    "unit_president",
    "unit_finance_manager"
  ]);

  if (!financeRoles.has(user.role)) return false;
  return canAccessScope(user, scopeType, zoneId, unitId) || level === "city";
}

export function scopedQueryForUser(user) {
  const level = getRoleLevel(user.role);
  if (level === "city") return {};
  if (level === "zone") return { zone: user.zone };
  if (level === "unit") return { unit: user.unit };
  return { _id: null };
}

export function roleOptionsForUser(user) {
  return ROLE_META[user.role]?.canCreate || [];
}
