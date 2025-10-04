import express from "express";
import auth from "../../middleware/auth";
import ProductController from "./product.controller";
import { upload } from "../../middleware/multer/multer";
import { fileHandle } from "../../middleware/fileHandle";

const router = express.Router();

router.post(
  '/',
  auth("Brand"),
  upload.fields([{ name: "productImages", maxCount: 10 }]),
  fileHandle("productImages"),
  ProductController.createProduct
)

router
  .route("/")
  .get(auth("Brand"),ProductController.getAllProduct)
  .delete(auth("Admin"), ProductController.createProduct);

router.patch("/:id", ProductController.createProduct);

const ProductRouter = router;
export default ProductRouter;
