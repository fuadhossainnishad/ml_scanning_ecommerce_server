// user/user.routes.ts
import express from "express";
import UserController from "./user.controller";
import { upload } from "../../middleware/multer/multer";
import { fileHandle } from "../../middleware/fileHandle";
import auth from "../../middleware/auth";

const router = express.Router();

// FCM Token Management - Put these FIRST to avoid route conflicts
router.post('/fcm/register', auth('User', 'Brand'), UserController.registerFCMToken);
router.post('/fcm/remove', auth('User', 'Brand'), UserController.removeFCMToken);

// User CRUD routes
router
  .route("/")
  .get(
    auth("User"),
    UserController.getUser
  )
  .patch(
    auth("User"),
    upload.fields([
      { name: "profile", maxCount: 1 },
      { name: "coverPhoto", maxCount: 1 }
    ]),
    fileHandle("profile"),
    fileHandle("coverPhoto"),
    UserController.updateUser
  );

router
  .route("/:id")
  .get(
    UserController.getUser
  )
  .delete(
    auth("Admin"),
    UserController.deleteUser
  )
  .patch(
    auth("Admin", "User"),
    upload.fields([
      { name: "profile", maxCount: 1 },
      { name: "coverPhoto", maxCount: 1 }
    ]),
    fileHandle("profile"),
    fileHandle("coverPhoto"),
    UserController.updateUser
  );

const UserRouter = router;
export default UserRouter;