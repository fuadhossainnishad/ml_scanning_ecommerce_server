import express from "express";
import auth from "../../middleware/auth";
import FavouriteController from "./favourite.controller";

const router = express.Router();

router
  .route("/post")
  .get(
    auth("User", "Brand"),
    FavouriteController.getAllFavouritePost
  );

router
  .route("/product")
  .get(
    auth("User", "Brand"),
    FavouriteController.getAllFavouriteProduct
  );

// router
//   .route("/post/:id")
//   .post(
//     auth("Brand", "User"),
//     FavouriteController.createFavouriteProduct
//   );

// .patch(
//   auth("Brand", "User"),
//   FavouriteController.createFavourite
// )
// .delete(
//   auth("Brand", "User"),
//   FavouriteController.createFavourite
// )

router
  .route("/product/:id")
  .post(
    auth("Brand", "User"),
    FavouriteController.createFavouriteProduct
  );

const FavouriteRouter = router;
export default FavouriteRouter;
