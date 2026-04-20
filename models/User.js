import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    phone: String,
    address: String,
    role: { 
        type: String, 
        enum: ['customer', 'admin'], 
        default: 'customer' 
    },
    created_at: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);