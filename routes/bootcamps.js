const express = require("express");
const {
    getBootcamp,
    getBootcamps,
    createBootcamp,
    updateBootcamp,
    delteBootcamp,
    getBootcampsInRadius,
} = require("../controller/bootcamps");

const router = express.Router();

router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);

router.route("/").get(getBootcamps).post(createBootcamp);

router.route("/:id").get(getBootcamp).put(updateBootcamp).delete(delteBootcamp);

module.exports = router;