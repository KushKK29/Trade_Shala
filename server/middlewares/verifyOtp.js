import OTP from "../models/Otp.Model.js"; // OTP schema to store OTPs

const verifyOTP = async (req, res, next) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return res
      .status(400)
      .json({ message: "Phone number and OTP are required" });
  }

  try {
    const otpRecord = await OTP.findOne({ phoneNumber, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const currentTime = new Date();
    if (otpRecord.expiresAt < currentTime) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // OTP is valid, proceed
    await OTP.deleteOne({ _id: otpRecord._id }); // Remove OTP after verification
    next();
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default verifyOTP;
