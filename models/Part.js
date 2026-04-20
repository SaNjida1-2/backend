import mongoose from "mongoose";

const partSchema = new mongoose.Schema({
    part_name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    image: { type: String }
});

export default mongoose.model("Part", partSchema);
