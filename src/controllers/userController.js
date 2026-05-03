import bcrypt from "bcryptjs";
import { Unit } from "../models/Unit.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { canAccessScope, canCreateRole, getRoleLevel, roleOptionsForUser, sameId } from "../utils/roles.js";

function serialize(user) {
  return user.toSafeJSON ? user.toSafeJSON() : user;
}

function scopedUserQuery(user) {
  const level = getRoleLevel(user.role);
  if (level === "city") return {};
  if (level === "zone") return { zone: user.zone?._id || user.zone };
  if (level === "unit") return { unit: user.unit?._id || user.unit };
  return { _id: null };
}

export const getRoleOptions = asyncHandler(async (req, res) => {
  res.json({ roles: roleOptionsForUser(req.user) });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find(scopedUserQuery(req.user))
    .select("-passwordHash")
    .populate("zone", "name code")
    .populate("unit", "name code")
    .sort({ createdAt: -1 });

  res.json({ users });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, zone, unit } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Name, email, password, and role are required." });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Temporary password must be at least 8 characters." });
  }

  if (!canCreateRole(req.user.role, role)) {
    return res.status(403).json({ message: "You cannot create this role." });
  }

  const targetLevel = getRoleLevel(role);
  let userZone = undefined;
  let userUnit = undefined;

  if (targetLevel === "zone") {
    if (!zone) return res.status(400).json({ message: "Zone is required for this role." });
    if (!canAccessScope(req.user, "zone", zone)) {
      return res.status(403).json({ message: "You cannot create users in this zone." });
    }
    userZone = zone;
  }

  if (targetLevel === "unit") {
    if (!unit) return res.status(400).json({ message: "Unit is required for this role." });
    const unitDoc = await Unit.findById(unit);
    if (!unitDoc) return res.status(404).json({ message: "Unit not found." });
    if (!canAccessScope(req.user, "unit", unitDoc.zone, unitDoc._id)) {
      return res.status(403).json({ message: "You cannot create users in this unit." });
    }
    userZone = unitDoc.zone;
    userUnit = unitDoc._id;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    phone,
    zone: userZone,
    unit: userUnit,
    createdBy: req.user._id,
    mustChangePassword: true
  });

  await user.populate("zone", "name code");
  await user.populate("unit", "name code");

  res.status(201).json({ user: serialize(user) });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const target = await User.findById(req.params.id);

  if (!target) {
    return res.status(404).json({ message: "User not found." });
  }

  if (sameId(target._id, req.user._id)) {
    return res.status(400).json({ message: "You cannot change your own active status." });
  }

  const targetLevel = getRoleLevel(target.role);
  const canAccess =
    targetLevel === "city"
      ? getRoleLevel(req.user.role) === "city" && req.user.role === "city_president"
      : canAccessScope(req.user, targetLevel, target.zone, target.unit);

  if (!canAccess) {
    return res.status(403).json({ message: "You cannot update this account." });
  }

  target.isActive = Boolean(isActive);
  await target.save();
  await target.populate("zone", "name code");
  await target.populate("unit", "name code");

  res.json({ user: serialize(target) });
});
