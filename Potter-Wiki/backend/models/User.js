import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    firstname: { type: String, required: true },
    middlename: { type: String }, // optional
    lastname: { type: String, required: true },
    username: { type: String }, // optional for Google users
    email: { type: String, required: true, unique: true },

    // Local Auth
    password: { type: String, default: null }, // ✅ allow null for Google users

    // Google Auth
    googleId: { type: String, default: null }, // ✅ store Google user ID

    // Role setup
    role: {
      type: String,
      enum: ["superUser", "publicUser", "adminUser"],
      default: "publicUser",
    },
  },
  { timestamps: true }
);

// ✅ Compare password (for local login)
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Prevent Google users from local login
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Hash password before saving (for local users only)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next(); // Skip for Google users
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("User", userSchema);
