const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const path = require("path");
const Bootcamp = require("../models/Bootcamp");
const geocoder = require("../utils/geocoder");

exports.getBootcamps = asyncHandler(async(req, res, next) => {
    res.status(200).json(res.advancedResults);
});

/**
 * @desc  Get single bootcamp
 * @route GET /api/v1/bootcamps/:id
 * @access public
 */
exports.getBootcamp = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    res.status(200).json({ success: true, data: bootcamp });
});

/**
 * @desc  Create new bootcamp
 * @route POST /api/v1/bootcamps
 * @access private
 */
exports.createBootcamp = asyncHandler(async(req, res, next) => {
    /* add user to body */
    req.body.user = req.user.id;

    /* check for published bootcamp */
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

    if (publishedBootcamp && req.user.role !== "admin") {
        return next(
            new ErrorResponse(
                `The user with ID ${req.user.id} already has published a bootcamp`,
                400
            )
        );
    }

    const bootcamp = await Bootcamp.create(req.body);

    res.status(201).json({
        success: true,
        data: bootcamp,
    });
});

/**
 * @desc  Update single bootcamp
 * @route PUT /api/v1/bootcamps/:id
 * @access private
 */
exports.updateBootcamp = asyncHandler(async(req, res, next) => {
    let bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    console.log(bootcamp.user.toString());
    console.log(req.user.id);
    console.log(req.user.role);
    console.log(
        bootcamp.user.toString() !== req.user.id && req.user.role !== "admin"
    );

    /* make sure user is bootcamp owner */
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
            new ErrorResponse(
                `User ${req.user.id} is not authorized to update this bootcamp`,
                401
            )
        );
    }

    bootcamp = await Bootcamp.findOneAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({ success: true, data: bootcamp });
});

/**
 * @desc  Delete single bootcamp
 * @route DELETE /api/v1/bootcamps/:id
 * @access private
 */
exports.delteBootcamp = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    /* make sure user is bootcamp owner */
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
            new ErrorResponse(
                `User ${req.user.id} is not authorized to delete this bootcamp`,
                401
            )
        );
    }

    bootcamp.remove();

    res.status(200).json({ success: true, data: [] });
});

/**
 * @desc  get bootcamps within the radius
 * @route GET /api/v1/bootcamps/radius/:zipcode/:distance
 * @access private
 */
exports.getBootcampsInRadius = asyncHandler(async(req, res, next) => {
    const { zipcode, distance } = req.params;

    /* get lat/log fro geocoder */
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    /* calc radius using radians */
    const radius = distance / 3963;

    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat], radius
                ],
            },
        },
    });

    res
        .status(200)
        .json({ success: true, count: bootcamps.length, data: bootcamps });
});

/**
 * @desc  upload photo for bootcamp
 * @route PUT /api/v1/bootcamps/:id/photo
 * @access private
 */
exports.boootcampPhotoUpload = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    if (!req.files) {
        return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const file = req.files.file;

    /* Make sure the image is a photos */
    if (!file.mimetype.startsWith("image")) {
        return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    /* check file size */
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
            new ErrorResponse(`Please upload an image less than 100kb`, 400)
        );
    }

    /* create custom filename */
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

    /* saving image file into db and local folder */
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async(err) => {
        if (err) {
            console.error(err);
            return next(new ErrorResponse(`Problem with file upload`, 500));
        }
        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
    });

    res.status(200).json({ success: true, data: file.name });
});