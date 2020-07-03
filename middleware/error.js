const ErrorResponse = require("../utils/errorResponse");
const colors = require("colors");

const erroHandler = (err, req, res, next) => {
    console.log(err);

    let error = {...err };

    error.message = err.message;

    /* Mongoose bad ObjectId */
    if (err.name === "CastError") {
        const message = `Resource not found`;
        error = new ErrorResponse(message, 404);
    }

    /* Mongoose duplicate key */
    if (err.code === 11000) {
        const message = `Duplicate field value entered ${err.keyValue.name}`;
        error = new ErrorResponse(message, 400);
    }

    /* Mongoose validation error */
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map((error) => error.message);
        error = new ErrorResponse(message, 400);
    }

    console.log(err.name.green);

    res
        .status(error.statusCode || 500)
        .json({ success: false, error: error.message || "Server Error" });
};

module.exports = erroHandler;