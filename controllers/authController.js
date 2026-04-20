const adminLogin = async (req, res) => {
    const { adminId, password } = req.body;

    if (adminId === process.env.ADMIN_ID && password === process.env.ADMIN_PASSWORD) {
        // If they match, generate a token
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token, message: "Welcome Admin" });
    }

    return res.status(401).json({ error: "Invalid Admin Credentials" });
};
