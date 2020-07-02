const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");

/**
 * @desc Get all users
 * @route GET /api/v1/users
 * @access Private/Admin
 */
exports.getUsers = asyncHandler(async(req, res, next) => {
    res.status(200).json(res.advancedResults);
});

/**
 * @desc Get single users
 * @route GET /api/v1/users/:id
 * @access Private/Admin
 */
exports.getUser = asyncHandler(async(req, res, next) => {
    const user = await User.findById(req.params.id);

    res.status(200).json({ sucess: true, data: user });
});

/**
 * @desc Create users
 * @route POST /api/v1/users
 * @access Private/Admin
 */
exports.createUser = asyncHandler(async(req, res, next) => {
    const user = await User.create(req.body);

    res.status(201).json({ sucess: true, data: user });
});

/**
 * @desc Update users
 * @route PUT /api/v1/users/:id
 * @access Private/Admin
 */
exports.updateUser = asyncHandler(async(req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({ sucess: true, data: user });
});

/**
 * @desc Delete users
 * @route Delete /api/v1/users/:id
 * @access Private/Admin
 */
exports.deleteUser = asyncHandler(async(req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ sucess: true, data: {} });
});