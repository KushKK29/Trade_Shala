import mongoose from "mongoose";


const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Decimal,
      required: true,
      min: 0,
    },
    transactionType: {
      type: String,
      enum: ["deposit", "withdrawal"],
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for common queries
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ userId: 1, transactionDate: -1 });
PaymentSchema.index({ transactionType: 1, status: 1 });

const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;
