import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    fatherName: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    className: {
      type: String,
      required: true,
      trim: true
    },
    institution: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    guardianPhone: {
      type: String,
      trim: true
    },
    cnicOrBForm: {
      type: String,
      trim: true
    },
    dateOfBirth: Date,
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
      index: true
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      required: true,
      index: true
    },
    joinDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["active", "inactive", "alumni"],
      default: "active"
    },
    notes: {
      type: String,
      trim: true
    },
    isShaheen: {
      type: Boolean,
      default: false
    },
    shaheenSince: Date,
    shaheenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

memberSchema.index({ fullName: "text", phone: "text", address: "text", institution: "text" });
memberSchema.index({ zone: 1, unit: 1, status: 1 });

export const Member = mongoose.model("Member", memberSchema);
