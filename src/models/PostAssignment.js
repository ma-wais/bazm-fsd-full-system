import mongoose from "mongoose";

const postAssignmentSchema = new mongoose.Schema(
  {
    scopeType: {
      type: String,
      enum: ["city", "zone", "unit"],
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
    title: {
      type: String,
      enum: ["president", "vice_president", "secretary", "finance_manager", "social_media_manager", "other"],
      required: true
    },
    customTitle: {
      type: String,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member"
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

postAssignmentSchema.index({ scopeType: 1, zone: 1, unit: 1, title: 1, isActive: 1 });

export const PostAssignment = mongoose.model("PostAssignment", postAssignmentSchema);
