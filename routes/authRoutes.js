const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const { authMiddleware } = require("../middleware/authmiddleware");

const router = express.Router();

// Rate limiting for forgot password
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: "Too many password reset attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔹 Signup
router.post("/signup", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    // Validate required fields
    if (!fullname || !email || !password) {
      return res.status(400).json({ message: "Full name, email, and password are required" });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = new User({ fullname, email, password });
    await user.save();

    res.status(201).json({ 
      message: "User created successfully",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for:", email);
    console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    console.log("User found:", user.email);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    console.log("Password match successful");

    // JWT token
    const token = jwt.sign({ 
      id: user._id, 
      email: user.email, 
      role: user.role,
      fullname: user.fullname 
    }, process.env.JWT_SECRET, { expiresIn: "2h" });

    console.log("JWT token created successfully");

    // ✅ Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "lax",
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});
// 🔹 Forgot Password
router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ message: "Email service not configured" });
    }

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    // Create reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry
    await user.save();
    
    // Construct reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/reset-password?token=${resetToken}`;

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    }); 

    // Send email with reset link
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset - Project LV",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${user.fullname},</p>
            <p>You requested a password reset for your Project LV account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetLink}" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
              Reset Password
            </a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetLink}</p>
            <p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      
      res.json({ message: "Password reset link sent to your email!" });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Clear the reset token if email fails
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();
      
      res.status(500).json({ message: "Failed to send email. Please try again later." });
    }
    
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Forgot Password (DEV Ethereal)
router.post("/forgot-password-test", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Create reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/resetpassword?token=${resetToken}`;

    // Create Ethereal transporter
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Project LV Dev" <no-reply@example.com>',
      to: email,
      subject: "Password Reset - Project LV (DEV)",
      html: `
        <p>Hello ${user.fullname || "User"},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log("📧 Ethereal preview URL:", previewUrl);

    res.json({ message: "Password reset email sent (Ethereal preview)", previewUrl });
  } catch (err) {
    console.error("Forgot password DEV error:", err);
    res.status(500).json({ error: err.message });
  }
});



// 🔹 Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = password; // will be hashed by pre("save")
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Protected Routes (require authentication)

// Get user profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      message: "Profile retrieved successfully",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { fullname, email } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    if (fullname) {
      user.fullname = fullname;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre("save") middleware
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout (clear cookie)
router.post("/logout", authMiddleware, (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "lax",
    });
    
    res.json({ message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify token (check if user is authenticated)
router.get("/verify", authMiddleware, (req, res) => {
  res.json({
    message: "Token is valid",
    user: {
      id: req.user.id
    }
  });
});

module.exports = router;
