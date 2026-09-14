import mongoose from "mongoose";
import bcrypt from "bcryptjs";
// used to securely hash passwords

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: "" },
  },
  { timestamps: true },
  // createdAt, updatedAt,
);

// passwords must be hashed before storing
userSchema.pre("save", async function () {
  // this hook runs whenever you save the user
  // so the following line is to ensure that any other changes do not cause the password to be hashed again
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  // bcrypt generates a salt, which adds randomness to password hashing
  this.password = await bcrypt.hash(this.password, salt);
  // Hash the password
});

// lets you verify a login password without ever storing the original password
// bcrypt checks whether "hello123" produces the same hash represented by the stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
