const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const path = require("path");
const Bootcamp = require("../models/Bootcamp");
const geocoder = require("../utils/geocoder");

exports.getBootcamps = asyncHandler(async(req, res, next) => {
    /* copy req.query */
    const reqQuery = {...req.query };
    /* Fields to exclude */
    const removeFields = ["select", "sort", "page", "limit"];

    removeFields.forEach((field) => {
        delete reqQuery[field];
    });

    let queryStr = JSON.stringify(reqQuery);

    /* create operators $gt,$lt etc.. */
    queryStr = queryStr.replace(
        /\b(gt|gte|lt|lte|in)\b/g,
        (match) => `$${match}`
    );

    let query = Bootcamp.find(JSON.parse(queryStr)).populate("courses");

    /* select fields */
    if (req.query.select) {
        const fields = req.query.select.split(",").join(" ");
        query = query.select(fields);
    }
    /* sort fields */

    if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
    } else {
        query = query.sort("-createdAt");
    }

    /* pagination */
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Bootcamp.countDocuments();

    query = query.skip(startIndex).limit(limit);

    /* executing query */
    const bootcamps = await query;

    /* pagination result */
    const pagination = {};

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit,
        };
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit,
        };
    }

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        pagination,
        data: bootcamps,
    });
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
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }
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