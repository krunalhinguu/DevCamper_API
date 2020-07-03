const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Review = require("../models/Review");
const Bootcamp = require("../models/Bootcamp");
const advancedResults = require("../middleware/AdvancedResults");

/**
 * @desc  Get reviews
 * @route GET /api/v1/reviews
 * @route GET /api/v1/bootcamps/:bootcampId/reviews
 * @access public
 */
exports.getReviews = asyncHandler(async(req, res, next) => {
    if (req.params.bootcampId) {
        const reviews = await Review.find({ bootcamp: req.params.bootcampId });

        return res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews,
        });
    } else {
        res.status(200).json(res.advancedResults);
    }
});

/**
 * @desc  Get single reviews
 * @route GET /api/v1/reviews/:id
 * @access public
 */
exports.getReview = asyncHandler(async(req, res, next) => {
    const review = await Review.findById(req.params.id).populate({
        path: "bootcamp",
        select: "name description",
    });

    if (!review) {
        return next(
            new ErrorResponse(`No reviews found for id ${req.params.id}`, 404)
        );
    }
    res.status(200).json({ sucess: true, data: review });
});

/**
 * @desc  Create reviews
 * @route POST /api/v1/bootcamps/:BootcampId/reviews
 * @access private
 */
exports.addReview = asyncHandler(async(req, res, next) => {
    req.body.bootcamp = req.params.bootcampId;
    req.body.user = req.user.id;

    const bootcamp = await Bootcamp.findById(req.params.bootcampId);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`No Bootcamp with id ${req.params.bootcampId}`, 404)
        );
    }

    const review = await Review.create(req.body);

    res.status(201).json({ sucess: true, data: review });
});

/**
 * @desc  Update reviews
 * @route PUT /api/v1/reviews/:id
 * @access public
 */
exports.updateReview = asyncHandler(async(req, res, next) => {
    let review = await Review.findById(req.params.id);

    if (!review) {
        return next(
            new ErrorResponse(`No reviews found for id ${req.params.id}`, 404)
        );
    }

    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new ErrorResponse(`Not authorise to update the review`, 401));
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({ sucess: true, data: review });
});

/**
 * @desc  Delete reviews
 * @route Delete /api/v1/reviews/:id
 * @access public
 */
exports.deleteReview = asyncHandler(async(req, res, next) => {
    let review = await Review.findById(req.params.id);

    if (!review) {
        return next(
            new ErrorResponse(`No reviews found for id ${req.params.id}`, 404)
        );
    }

    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new ErrorResponse(`Not authorise to update the review`, 401));
    }

    review = await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({ sucess: true, data: {} });
});