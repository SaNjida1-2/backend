import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    comment: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: Date, default: Date.now }
});

export default mongoose.model("Testimonial", testimonialSchema);
