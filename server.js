import dns from 'node:dns'; dns.setDefaultResultOrder('ipv4first');
import "dotenv/config";
import nodemailer from 'nodemailer';
import User from "./models/User.js";
import Service from "./models/Services.js";
import Appointment from "./models/Appointment.js";
import Part from "./models/Part.js";
import { verifyAdmin } from './middleware/auth.js';
import Testimonial from "./models/Testimonial.js";
import Contact from "./models/Contact.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors({
    origin: ["https://vercel.app", "http://localhost:3000"],
    credentials: true
}));
app.use(express.json());

const transporter = nodemailer.createTransport({
    host: '74.125.136.108', 
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false,
        servername: 'smtp.gmail.com' 
    }
});


const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB Connected..."))
    .catch(err => console.log("Connection Error:", err));

app.get("/", (req, res) => {
    res.send("API is running successfully! 🚀");
});


app.post("/api/users", async (req, res) => {
    try {
        const newUser = new User(req.body);
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete("/api/users/:id", verifyAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/appointments/:id/accept", verifyAdmin, async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id, 
            { status: 'confirmed' }, 
            { new: true }
        );
        console.log("Sending email to:", appointment.email);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: appointment.email || 'customer@example.com',
            subject: 'Appointment Confirmed - Sanjida\'s Auto',
            text: `Hi ${appointment.name}, your appointment for ${appointment.date} has been accepted!`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Accepted and Email Sent!", appointment });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/contacts", async (req, res) => {
    try {
        const newMessage = new Contact(req.body);
        await newMessage.save();
        res.status(201).json({ message: "Message saved!" });
    } catch (err) {
        console.error("Contact Save Error:", err);
        res.status(400).json({ error: err.message });
    }
});

app.get("/api/contacts", verifyAdmin, async (req, res) => {
    try {
        const messages = await Contact.find().sort({ date: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch("/api/parts/:id/reduce-stock", async (req, res) => {
    try {
        const { qty } = req.body;
        const part = await Part.findByIdAndUpdate(
            req.params.id,
            { $inc: { stock: -qty } },
            { new: true }
        );
        res.json(part);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/contacts/:id", verifyAdmin, async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.json({ message: "Message deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/services", verifyAdmin, async (req, res) => {
    try {
        const newService = new Service(req.body);
        const savedService = await newService.save();
        res.status(201).json(savedService);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get("/api/services", async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/services/:id", verifyAdmin, async (req, res) => {
    try {
        await Service.findByIdAndDelete(req.params.id);
        res.json({ message: "Service deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/services/:id", verifyAdmin, async (req, res) => {
    try {
        const updatedService = await Service.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        );
        res.json(updatedService);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post("/api/appointments", async (req, res) => {
    try {
        const newAppointment = new Appointment(req.body);
        await newAppointment.save();

        if (req.body.parts && req.body.parts.length > 0) {
            const updatePromises = req.body.parts.map(item => {
                return Part.findByIdAndUpdate(
                    item._id, 
                    { $inc: { stock: -(item.qty || 1) } } 
                );
            });

            await Promise.all(updatePromises);
        }

        res.status(201).json({ message: "Wait for appointment confirmation" });
    } catch (err) {
        console.error("Inventory Sync Error:", err);
        res.status(400).json({ error: err.message });
    }
});


app.get("/api/appointments", async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate('services', 'service_name price') 
            .populate('parts', 'part_name price')
            .sort({ created_at: -1 });
        res.json(appointments);
    } catch (err) {
        console.error("Fetch Error:", err); 
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/appointments/:id", verifyAdmin, async (req, res) => {
    try {
        const deleted = await Appointment.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Appointment not found" });
        res.json({ message: "Appointment cancelled successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({ 
            name, 
            email, 
            password_hash: hashedPassword 
        });
        
        await newUser.save();
        res.status(201).json({ message: "User created successfully!" });
    } catch (err) {
        res.status(400).json({ error: "Email already exists" });
    }
});


app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
        res.json({ 
            token, 
            user: { 
                name: user.name, 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin-login", async (req, res) => {
    try {
        const { adminId, password } = req.body;

        if (adminId === process.env.ADMIN_ID && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { id: "admin_id", role: "admin" }, 
                process.env.JWT_SECRET, 
                { expiresIn: '1d' }
            );
            
            return res.json({ 
                token, 
                user: { name: "System Admin", role: "admin" } 
            });
        }

        res.status(401).json({ error: "Invalid Admin ID or Password" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/parts", async (req, res) => {
    try {
        const parts = await Part.find();
        res.json(parts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/parts", verifyAdmin, async (req, res) => {
    try {
        const newPart = new Part(req.body);
        const savedPart = await newPart.save();
        res.status(201).json(savedPart);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put("/api/parts/:id", verifyAdmin, async (req, res) => {
    try {
        const updatedPart = await Part.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        );
        res.json(updatedPart);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete("/api/parts/:id", verifyAdmin, async (req, res) => {
    try {
        await Part.findByIdAndDelete(req.params.id);
        res.json({ message: "Part deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/testimonials", async (req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ date: -1 }).limit(6);
        res.json(testimonials);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/testimonials", async (req, res) => {
    try {
        const newTestimonial = new Testimonial(req.body);
        const savedTestimonial = await newTestimonial.save();
        res.status(201).json(savedTestimonial);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete("/api/testimonials/:id", verifyAdmin, async (req, res) => {
    try {
        await Testimonial.findByIdAndDelete(req.params.id);
        res.json({ message: "Review deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/users", verifyAdmin, async (req, res) => {
    try {
        const users = await User.find().select("-password_hash");
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
