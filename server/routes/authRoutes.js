import express from "express";
import { generateOTP, signup, login, verifyAndLogin, getUser, generateEmailOTP, googleSignup, googleLogin } from "../controllers/auth.js";
import verifyOTP from "../middlewares/verifyOtp.js";

const router = express.Router();

router.post("/generate_otp", generateOTP);
router.post("/generate_email_otp", generateEmailOTP);
router.post("/signup", verifyOTP, signup);
router.post("/login/email", login);
router.post("/login/phone", verifyOTP, verifyAndLogin);
router.post("/user", getUser);
router.post("/google-signup", googleSignup);
router.post("/google-login", googleLogin); 
export default router;