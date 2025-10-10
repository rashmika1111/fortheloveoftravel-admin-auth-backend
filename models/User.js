const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    url: String,
    alt: String
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'contributor'],
    default: 'contributor'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  socialLinks: {
    website: String,
    twitter: String,
    linkedin: String,
    instagram: String
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  emailVerified: { 
    type: Boolean, 
    default: false 
  },
  emailVerificationToken: String,
  resetToken: String,
  resetTokenExpiry: Date,
  lastLogin: Date
}, { timestamps: true });

// Password hashing before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed one
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Role-based permission checks
userSchema.methods.can = function(action) {
  const permissions = {
    admin: ['post:create', 'user:delete', 'settings:edit'],
    editor: ['post:create', 'post:edit'],
    contributor: ['post:create']
  };
  return permissions[this.role]?.includes(action) || false;
};

module.exports = mongoose.model('User', userSchema);
