import express from "express";
import {
  generateOTP,
  signup,
  login,
  verifyAndLogin,
  getUser,
} from "../controllers/auth.js";
import verifyOTP from "../middlewares/verifyOtp.js";

const router = express.Router();

router.post("/generate-otp", generateOTP);
router.post("/signup", verifyOTP, signup);
router.post("/login/email", login);
router.post("/login/phone", verifyOTP, verifyAndLogin);
router.post("/user", getUser);

export default router;
