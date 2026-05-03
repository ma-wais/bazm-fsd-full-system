import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { roleOptionsForUser } from "../utils/roles.js";

function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

function authResponse(user) {
  return {
    token: signToken(user),
    user: user.toSafeJSON(),
    creatableRoles: roleOptionsForUser(user)
  };
}

export const setupInitialPresident = asyncHandler(async (req, res) => {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    return res.status(409).json({ message: "Initial setup has already been completed." });
  }

  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ message: "Name, email, and an 8+ character password are required." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "city_president",
    mustChangePassword: false
  });

  res.status(201).json(authResponse(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  user.lastLoginAt = new Date();
  await user.save();

  res.json(authResponse(user));
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    user: req.user.toSafeJSON(),
    creatableRoles: roleOptionsForUser(req.user)
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: "Current password and an 8+ character new password are required." });
  }

  const user = await User.findById(req.user._id);
  const matches = await user.comparePassword(currentPassword);
  if (!matches) {
    return res.status(401).json({ message: "Current password is incorrect." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  user.passwordChangedAt = new Date();
  await user.save();

  res.json({ message: "Password changed successfully." });
});
