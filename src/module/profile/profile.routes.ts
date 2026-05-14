import express from "express";
import auth from "../../middleware/auth";
import ProfileController from "./profile.controller";
import auth2 from "../../middleware/auth2";

const router = express.Router();

router.route("/:id").get(auth2("User", "Brand"), ProfileController.getProfile2);

router.get("/", auth("User", "Brand", "Admin"), ProfileController.getProfile);

const ProfileRouter = router;
export default ProfileRouter;
