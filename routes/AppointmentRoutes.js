router.post("/", async (req, res) => {
  const appointment = new Appointment(req.body);
  await appointment.save();
  res.json(appointment);
});

router.get("/", async (req, res) => {
  const data = await Appointment.find();
  res.json(data);
});