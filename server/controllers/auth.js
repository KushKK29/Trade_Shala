import User from "../models/User.Model.js";
import OTP from "../models/Otp.Model.js";
import twilio from "twilio";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import nodemailer from "nodemailer";

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

const generateEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60000);

    // Save or update OTP in database
    await OTP.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "OTP sent to email successfully", otp: otp }); // Remove `otp` in production
  } catch (error) {
    console.error("Error sending OTP via email:", error);
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

const googleSignup = async (req, res) => {
  try {
    const { email, name } = req.body;
    console.log("Google signup request body:", req.body);
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    let user = await User.findOne({ email });
    console.log("User found:", user);
    let isNew = false;
    if (!user) {
      user = await User.create({
        name,
        email,
        provider: "google",
        password: "",
      });
      console.log("New user created:", user);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(isNew ? 201 : 200).json({
      message: "Google signup/login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Google signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const googleLogin = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: "Email and name are required" });
    }

    let user = await User.findOne({ email });
    let isNew = false;

    if (!user) {
      user = await User.create({
        name,
        email,
        provider: "google",
        password: "", // Not used for Google
      });
      isNew = true;
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(isNew ? 201 : 200).json({
      message: isNew
        ? "Signup successful via Google"
        : "Login successful via Google",
      token,
      user,
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export {
  generateOTP,
  signup,
  login,
  verifyAndLogin,
  getUser,
  generateEmailOTP,
  googleSignup,
  googleLogin,
};
