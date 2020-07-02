const express = require("express");
const {
    getBootcamp,
    getBootcamps,
    createBootcamp,
    updateBootcamp,
    delteBootcamp,
    getBootcampsInRadius,
    boootcampPhotoUpload,
} = require("../controller/bootcamps");

const Bootcamp = require("../models/Bootcamp");
const advancedResults = require("../middleware/AdvancedResults");

/* include other resource routers */
const courseRouter = require("./courses");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

/* Re-route into other resource routers */
router.use("/:bootcampId/courses", courseRouter);

module.exports = router;

router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);

router
    .route("/")
    .get(advancedResults(Bootcamp, "courses"), getBootcamps)
    .post(protect, authorize("publisher", "admin"), createBootcamp);

router
    .route("/:id")
    .get(getBootcamp)
    .put(protect, authorize("publisher", "admin"), updateBootcamp)
    .delete(protect, authorize("publisher", "admin"), delteBootcamp);

router
    .route("/:id/photo")
    .put(protect, authorize("publisher", "admin"), boootcampPhotoUpload);

module.exports = router;