import httpStatus from "http-status";
import AppError from "../../app/error/AppError";
import { idConverter } from "../../utility/idConverter";
import Cart from "./cart.model";
import { Request } from "express";

const getCartService = async (req: Request) => {
  const _id = await idConverter(req.user._id)

  console.log("_id:", _id)

  const result = await Cart.aggregate([
    { $match: { userId: await idConverter(_id), isDeleted: false } },
    { $unwind: { path: "$products", preserveNullAndEmptyArrays: true } },

    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products.productId",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        "products.productInfo": "$productDetails.productName",
        "products.productPrice": "$productDetails.price",
        "products.productImage": { $arrayElemAt: ["$productDetails.productImages", 0] },
        "products.discountPrice": "$productDetails.discountPrice",
      },
    },
    {
      $group: {
        _id: "$_id",
        userId: { $first: "$userId" },
        isDeleted: { $first: "$isDeleted" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        products: { $push: "$products" },
        // shippingCharge: { $first: { $ifNull: ["$shippingCharge", 5] } },
      }
    },
    {
      $addFields: {
        subtotal: {
          $sum: {
            $map: {
              input: "$products",
              as: "p",
              in: {
                $multiply: [
                  { $ifNull: ["$$p.productPrice", "$$p.discountPrice"] },
                  "$$p.quantity"
                ]
              }
            }
          }
        }
      }
    },
    {
      $addFields: {
        total: {
          $sum: {
            $map: {
              input: "$products",
              as: "p",
              in: {
                $multiply: [
                  { $ifNull: ["$$p.discountPrice", "$$p.productPrice"] },
                  "$$p.quantity"
                ]
              }
            }
          }
        }
      }
    },
    {
      $addFields: {
        discount: { $subtract: ["$subtotal", "$total"] }
      }
    }

  ])

  // if (!result.length) {
  //   throw new AppError(httpStatus.NOT_FOUND, "No cart found for this user", "");
  // }

  return result[0]

}

const deleteFromCartService = async (req: Request) => {
  const { productId } = req.params;
  const { _id } = req.user;
  console.log("delete cart id:", _id)

  const objectId = await idConverter(productId);
  console.log("delete params id:", objectId)

  const cart = await Cart.findOneAndUpdate(
    { userId: _id, 'products._id': objectId, isDeleted: false },
    {
      $pull:
      {
        products:
          { _id: objectId }
      },
      $set: { updatedAt: new Date() }
    },
    { new: true },
  );
  if (!cart) {
    throw new AppError(httpStatus.NOT_FOUND, "No cart found for this user", "");
  }
  return { message: "Product removed from cart successfully" };
}



const CartServices = {
  getCartService,
  deleteFromCartService
};

export default CartServices;
