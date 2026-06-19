import express from "express";
import auth from "../../middleware/auth";
import ProfileController from "./profile.controller";
import auth2 from "../../middleware/auth2";

const router = express.Router();

router.route("/:id").get(auth2("User", "Brand"), ProfileController.getProfile2);

router.get("/", auth("User", "Brand", "Admin"), ProfileController.getProfile);

router.route("/block/:id")
    .post(
        auth2("User", "Brand"),
        ProfileController.blockProfile,
    )
    .delete(
        auth2("User", "Brand"),
        ProfileController.unblockProfile,
    );


const ProfileRouter = router;
export default ProfileRouter;
