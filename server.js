const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

/* Load env vars */
dotenv.config({ path: "./config/config.env" });

const app = express();
app.set("port", process.env.PORT || 3000);

app.get("/", (req, res, next) => {
    res.send("<h1>Hello world<h1>");
});

app.listen(app.get("port"), (server) => {
    console.info(
        `Server listen in ${process.env.NODE_ENV} mode on port ${app.get("port")}`
    );
});