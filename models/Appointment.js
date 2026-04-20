import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }, 
    phone: { type: String, required: true },
    address: { type: String, required: true },
    
    services: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Service' 
    }],
    parts: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Part' 
    }],
    
    date: { type: Date, required: true },
    
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
        default: 'pending' 
    },
    created_at: { type: Date, default: Date.now }
});

export default mongoose.model("Appointment", appointmentSchema);
