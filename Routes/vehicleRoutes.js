const express = require("express");
const passport = require("passport");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");

router.use(passport.authenticate('jwt', { session: false }));

router.get("/", vehicleController.getAllVehicles);
router.post("/search", vehicleController.searchVehicles);
router.post("/", vehicleController.createVehicle);
router.put("/:id", vehicleController.updateVehicle);
router.delete("/:id", vehicleController.deleteVehicle);


module.exports = router;
