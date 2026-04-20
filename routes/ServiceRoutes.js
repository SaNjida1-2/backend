router.post("/add", async (req, res) => {
  const service = new Service(req.body);
  await service.save();
  res.json(service);
});

router.get("/", async (req, res) => {
  const services = await Service.find();
  res.json(services);
});