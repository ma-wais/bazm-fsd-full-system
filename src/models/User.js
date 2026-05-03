import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { ROLES, getRoleLevel, roleLabel } from "../utils/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ROLES,
      required: true
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone"
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit"
    },
    phone: {
      type: String,
      trim: true
    },
    mustChangePassword: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    lastLoginAt: Date,
    passwordChangedAt: Date
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    roleLabel: roleLabel(this.role),
    level: getRoleLevel(this.role),
    zone: this.zone,
    unit: this.unit,
    phone: this.phone,
    mustChangePassword: this.mustChangePassword,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export const User = mongoose.model("User", userSchema);
