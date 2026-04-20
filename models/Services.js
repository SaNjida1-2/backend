import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  service_name: String,
  description: String,
  price: Number,
  duration: String,
  image: String
});


export default mongoose.model("Service", serviceSchema);