import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    phoneNumber: { type: String },
    email: { type: String },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true }
});

otpSchema.index({ phoneNumber: 1, email: 1 }, { unique: true, sparse: true });

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;