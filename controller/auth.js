const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

/**
 * @desc Register User
 * @route POST /api/v1/auth/register
 * @access Public
 */
exports.register = asyncHandler(async(req, res, next) => {
    const { name, email, password, role } = req.body;

    /* create user */
    const user = await User.create({
        name,
        email,
        password,
        role,
    });

    /* create token */
    const token = user.getSignedJwtToken();

    res.status(200).json({ success: true, token });
});

/**
 * @desc Login User
 * @route POST /api/v1/auth/login
 * @access Public
 */
exports.login = asyncHandler(async(req, res, next) => {
    const { email, password } = req.body;

    /* validate email & pass */
    if (!email || !password) {
        return next(new ErrorResponse("Please provide an email and password"), 400);
    }

    /* check for user */
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorResponse("Invalid Credentials"), 401);
    }

    /* check if pass matches */
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse("Invalid Credentials"), 401);
    }

    sendTokenResponse(user, 200, res);

    res.status(200).json({ success: true, token });
});

/**
 * @desc Get Current Logged In User
 * @route GET /api/v1/auth/me
 * @access private
 */
exports.getMe = asyncHandler(async(req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({ success: true, data: user });
});

/**
 * @desc Update user request
 * @route PUT /api/v1/auth/updatedetails
 * @access private
 */
exports.updateDetails = asyncHandler(async(req, res, next) => {
    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({ success: true, data: user });
});

/**
 * @desc Update password
 * @route PUT /api/v1/auth/updatepassword
 * @access private
 */
exports.updatePassword = asyncHandler(async(req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    /* check current password */
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return next(new ErrorResponse("Password Incorrect"), 401);
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
});

/* Get Token from model & create cookie */
const sendTokenResponse = (user, statusCode, res) => {
    /* create token */
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === "production") {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie("token", token, options)
        .json({ success: true, token });
};

/**
 * @desc Forgot password
 * @route POST /api/v1/auth/forgotpassword
 * @access public
 */
exports.forgotPassword = asyncHandler(async(req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorResponse("There is no user with this email"), 404);
    }

    /* get reset token */
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    /* create reset url */
    const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}}`;

    const message = `You are recieving this email because you or someone has requested the reset of a password. Please make a PUT request to : \n\n ${resetURL} `;

    try {
        await sendEmail({
            email: user.email,
            subject: "Password reset token",
            message,
        });

        res.status(200).json({ success: true, data: "Email sent" });
    } catch (err) {
        console.log(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });
        return next(new ErrorResponse("Email couldnt be send"), 500);
    }

    res.status(200).json({ success: true, data: user });
});

/**
 * @desc Reset Password
 * @route PUT /api/v1/auth/resetpassword/:resettoken
 * @access public
 */
exports.resetPassword = asyncHandler(async(req, res, next) => {
    /* get hash token */
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.resettoken)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ErrorResponse("Invalid Token"), 400);
    }

    /* set new password */
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendTokenResponse(user, 200, res);

    res.status(200).json({ success: true, data: user });
});