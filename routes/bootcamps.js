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

/* include other resource routers */
const courseRouter = require("./courses");
const router = express.Router();

/* Re-route into other resource routers */
router.use("/:bootcampId/courses", courseRouter);

module.exports = router;

router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);

router.route("/").get(getBootcamps).post(createBootcamp);

router.route("/:id").get(getBootcamp).put(updateBootcamp).delete(delteBootcamp);

router.route("/:id/photo").put(boootcampPhotoUpload);

module.exports = router;