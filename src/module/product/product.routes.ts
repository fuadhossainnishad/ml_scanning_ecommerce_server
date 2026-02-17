import express from "express";
import auth from "../../middleware/auth";
import ProductController from "./product.controller";
import { upload } from "../../middleware/multer/multer";
import { fileHandle } from "../../middleware/fileHandle";
import StatsController from "../stats/stats.controller";

const router = express.Router();

router
  .route("/")
  .post(
    auth("Brand"),
    upload.fields([{ name: "productImages", maxCount: 10 }]),
    fileHandle("productImages"),
    ProductController.createProduct
  )
  .get(
    auth("User", "Brand", "Admin"),
    ProductController.getAllProduct
  )
router.get(
  '/orders',
  auth('Brand'),
  StatsController.getBrandStats
);

router
  .route("/:id")
  .patch(
    auth("Brand"),
    upload.fields([{ name: "productImages", maxCount: 10 }]),
    fileHandle("productImages"),
    ProductController.updateProduct
  )
  .delete(
    auth("Brand"),
    ProductController.deleteProduct
  );

const ProductRouter = router;
export default ProductRouter;
