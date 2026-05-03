import mongoose from "mongoose";

const financeRecordSchema = new mongoose.Schema(
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
    direction: {
      type: String,
      enum: ["income", "expense"],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "jazzcash", "easypaisa", "other"],
      default: "cash"
    },
    reference: {
      type: String,
      trim: true
    },
    occurredAt: {
      type: Date,
      default: Date.now
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

financeRecordSchema.index({ scopeType: 1, zone: 1, unit: 1, occurredAt: -1 });

export const FinanceRecord = mongoose.model("FinanceRecord", financeRecordSchema);
