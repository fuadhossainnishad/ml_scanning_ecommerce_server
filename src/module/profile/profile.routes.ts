import express from "express";
import auth from "../../middleware/auth";
import ProfileController from "./profile.controller";
import auth2 from "../../middleware/auth2";

const router = express.Router();


router.get("/", auth("User", "Brand", "Admin"), ProfileController.getProfile);
router.get("/blocklist", auth("User", "Brand"), ProfileController.getBlockProfile);

router.route("/block/:id")
    .post(
        auth2("User", "Brand"),
        ProfileController.blockProfile,
    )
    .delete(
        auth2("User", "Brand"),
        ProfileController.unblockProfile,
    );

router.route("/:id").get(auth2("User", "Brand"), ProfileController.getProfile2);

const ProfileRouter = router;
export default ProfileRouter;
