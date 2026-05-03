import mongoose from "mongoose";

const unitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      required: true,
      index: true
    },
    area: {
      type: String,
      trim: true
    },
    meetingDay: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

unitSchema.index({ zone: 1, name: 1 });

export const Unit = mongoose.model("Unit", unitSchema);
