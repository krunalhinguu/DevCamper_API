const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");
const colors = require("colors");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");

/* Load env vars */
dotenv.config({ path: "./config/config.env" });

/* Connect to DB */
connectDB();

/* Route files */
const bootcamps = require("./routes/bootcamps");
const app = express();

/* Body Parser */
app.use(express.json());

app.set("port", process.env.PORT || 3000);

/* Dev logging middleware  */
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

/* Mount Router  */
app.use("/api/v1/bootcamps", bootcamps);

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