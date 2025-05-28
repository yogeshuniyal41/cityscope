import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, trim: true ,default:"abc"},
  lastName: { type: String,  trim: true ,default:"xyz"},
  username: { type: String, required: true, unique: true, },
  password: { type: String, required: true }, 
  country: { type: String ,default:"India"},
  mobile: { type: String ,default:"456"},
  imageUrl: { type: String, }, 
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;