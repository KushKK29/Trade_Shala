import User from "../models/User.Model.js";
import OTP from "../models/Otp.Model.js";
import twilio from "twilio";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
configDotenv();

// Twilio Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// Generate OTP
const generateOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60000);

    // Store OTP in the database
    await OTP.findOneAndUpdate(
      { phoneNumber },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Send OTP via Twilio
    const message = await client.messages.create({
      body: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
      from: twilioPhone,
      to: phoneNumber,
    });

    res.status(200).json({ message: "OTP sent successfully", otp: otp });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP", error });
  }
};

// Signup
const signup = async (req, res) => {
  const { name, email, phoneNumber, password } = req.body;

  if (!name || !email || !phoneNumber || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { phoneNumber }],
  });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    phoneNumber,
    password: hashedPassword,
  });

  res.status(201).json({ message: "User registered successfully", user });
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.status(200).json({ message: "Login successful", token, user });
};

// Verify OTP and login user
const verifyAndLogin = async (req, res) => {
  const { phoneNumber } = req.body;

  const user = await User.findOne({ phoneNumber });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res
    .status(200)
    .json({ message: "OTP verified, login successful", token, user });
};

// get user details
const getUser = async (req, res) => {
  try {
    const { phone } = req.body; // Get phone number from the request body
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required to access user details",
      });
    }

    const userDetail = await User.findOne({ phoneNumber: phone }).select(
      "-password"
    ); // Find user by phone number

    if (!userDetail) {
      return res.status(404).json({
        success: false,
        message: "No such user exists",
      });
    }

    return res.status(200).json({
      success: true,
      data: userDetail,
      message: "User details fetched",
    });
  } catch (err) {
    console.error(err); // Log the error for debugging
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export { generateOTP, signup, login, verifyAndLogin, getUser };
