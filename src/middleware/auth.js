import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication token is required." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }

  const user = await User.findById(decoded.id).populate("zone", "name code").populate("unit", "name code zone");
  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Account is not active." });
  }

  req.user = user;
  next();
});
