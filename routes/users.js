const express = require("express");
const User = require("../models/User");
const {
    createUser,
    deleteUser,
    getUser,
    getUsers,
    updateUser,
} = require("../controller/users");

const router = express.Router({ mergeParams: true });

const advancedResults = require("../middleware/AdvancedResults");
const { authorize, protect } = require("../middleware/auth");

router.use(protect);
router.use(authorize("admin"));

router.route("/").get(advancedResults(User), getUsers).post(createUser);
router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;