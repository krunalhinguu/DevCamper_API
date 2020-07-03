const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");
const colors = require("colors");
const mongoSanatize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xssClean = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");

/* Load env vars */
dotenv.config({ path: "./config/config.env" });

/* Connect to DB */
connectDB();

/* Route files */
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
const users = require("./routes/users");
const reviews = require("./routes/reviews");
const app = express();

/* Body Parser */
app.use(express.json());

/* Cookie Parser */
app.use(cookieParser());

app.set("port", process.env.PORT || 3000);

/* Dev logging middleware  */
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

/* file uploading */
app.use(fileupload());

/* sanatize data */
app.use(mongoSanatize());

/* set security headers */
app.use(helmet());

/* prevent xss attacks */
app.use(xssClean());

app.use(cors());

/* rate limiting */
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
});

app.use(limiter);

/* prevent http parm pollution */
app.use(hpp());

/* set static folder */
app.use(express.static(path.join(__dirname, "public")));

/* Mount Router  */
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);

app.use(errorHandler);

const server = app.listen(app.get("port"), (server) => {
    console.info(
        `Server listen in ${process.env.NODE_ENV} mode on port ${app.get("port")}`
        .yellow.bold
    );
});

/* Handled/Unhandled promise rejections */
process.on("unhandledRejection", (err, promise) => {
    console.log(`Erorr: ${err}`.red);
    /* close server and exit process */
    server.close(() => process.exit(1));
});