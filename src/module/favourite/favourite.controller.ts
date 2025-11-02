import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import { idConverter } from "../../utility/idConverter";
import NotificationServices from "../notification/notification.service";
import { IPost } from "../post/post.interface";
import Post from "../post/post.model";
import { IFavouritePost, IFavouriteProduct } from "./favourite.interface";
import FavouritePost from "./favourite.post.model";
import FavouriteProduct from "./favourite.product.model";
import AggregationQueryBuilder from "../../app/builder/Builder";
import { buildMeta } from "../stats/stats.services";

const createFavouritePost: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Authenticated owner is required",
      ""
    );
  }

  // if (req.user?.role !== "Brand" && req.user.role !== "User") {
  //   throw new AppError(
  //     httpStatus.BAD_REQUEST,
  //     "User/Brand is required",
  //     ""
  //   );
  // }

  const { _id, role } = req.user

  const data: IFavouritePost = {
    ownerId: _id,
    ownerType: role,
    postId: await idConverter(req.params.id),
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await GenericService.insertResources<IFavouritePost>(
    FavouritePost,
    data
  );

  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.Subsciption?._id.toString(),
  //     message: `New subsciption added`,
  //   },
  //   receiverId: [req.user?._id],
  // });



  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully added post as favourite",
    data: result,
  });
});

const createFavouriteProduct: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Authenticated owner is required",
      ""
    );
  }

  const { _id, role } = req.user
  const { id } = req.params

  if (!id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "ProductId is required",
      ""
    );
  }

  const productObjectId = await idConverter(id)
  let result

  const exist = await FavouriteProduct.findOne<IFavouriteProduct>({
    productId: productObjectId,
    ownerId: _id,
    ownerType: role,
  })

  if (exist) {
    if (!exist.isDeleted) {
      result = await FavouriteProduct.findOneAndUpdate(
        {
          productId: productObjectId,
          ownerId: _id,
          ownerType: role,
          isDeleted: false
        },
        {
          $set:
          {
            isDeleted: true,
            updatedAt: new Date()
          }
        },
        { new: true }
      );
      return sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Favourite product removed successfully",
        data: { isFavourite: false },
      });
    } else {
      result = await FavouriteProduct.findOneAndUpdate(
        {
          productId: productObjectId,
          ownerId: _id,
          ownerType: role,
          isDeleted: true
        },
        {
          $set:
          {
            isDeleted: false,
            updatedAt: new Date()
          }
        },
        { new: true }
      );
      return sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Favourite product added successfully",
        data: { isFavourite: true },
      });
    }
  } else {

    const data: IFavouriteProduct = {
      ownerId: _id,
      ownerType: role,
      productId: productObjectId,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    result = await GenericService.insertResources<IFavouriteProduct>(
      FavouriteProduct,
      data
    );

  }


  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.Subsciption?._id.toString(),
  //     message: `New subsciption added`,
  //   },
  //   receiverId: [req.user?._id],
  // });



  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully added product as favourite",
    data: result,
  });
});

const getFavourite: RequestHandler = catchAsync(async (req, res) => {
  const { PostId } = req.body.data;
  console.log("PostId: ", PostId);

  if (!PostId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Post ID is required",
      ""
    );
  }
  const result = await GenericService.findResources<IPost>(
    Post,
    await idConverter(PostId)
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve all Post data",
    data: result,
  });
});

const getAllFavouritePost: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User/Brand is required",
      ""
    );
  }
  const query = {
    ...req?.query,
    ownerId: req.user?._id.toString()
  }

  const result = await GenericService.findAllResources<IFavouritePost>(
    FavouritePost,
    query,
    []
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve favourite post data",
    data: result,
  });
});
const getAllFavouriteProduct: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User/Brand is required",
      ""
    );
  }
  const query = {
    ...req?.query,
    ownerId: req.user?._id,
    ownerType: req.user.role
  }

  const builder = new AggregationQueryBuilder(FavouriteProduct, query);

  builder.filter();
  builder.search([]);

  builder.addStages([
    { $unwind: "$productId" },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: {
        path: "$product",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        updatedAt: 0,
        isDeleted: 0,
        "product.stripe_product_id": 0,
        "product.stripe_price_id": 0,
        "product.__v": 0,
        "product.totalQuantity": 0,
        "product.saleTag": 0,
        // "product.category": 1,
        // "product.productImages": 1,
        // "product.colors": 1,
        // "product.inStock": 1,
      },
    },
  ]);

  builder.sort();
  builder.fields();

  const meta = await builder.countTotal();

  console.log("post query:", builder.getMatchObj());

  const data = await builder.execute();



  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve favourite product data",
    data: {
      meta: buildMeta(meta.page, meta.limit, meta.total), // Assuming buildMeta takes page, limit, total
      data,
    }
  });
});

const updateFavourite: RequestHandler = catchAsync(async (req, res) => {
  // if (!req.user) {
  //   throw new AppError(httpStatus.UNAUTHORIZED, "Admin not authenticated", "");
  // }
  const id = req?.params.id;

  // const id =
  //   typeof rawId === "string"
  //     ? rawId
  //     : Array.isArray(rawId) && typeof rawId[0] === "string"
  //       ? rawId[0]
  //       : undefined;

  const result = await GenericService.updateResources<IPost>(
    Post,
    await idConverter(id),
    req.body.data
  );

  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.Post?._id.toString(),
  //     message: `An Post updated`,
  //   },
  //   receiverId: [req.user?._id],
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully updated Post ",
    data: result,
  });
});

const deleteFavourite: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin not authenticated", "");
  }

  if (req.user?.role !== "Admin") {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Only admin can do update Post",
      ""
    );
  }
  const { PostId } = req.body.data;
  const result = await GenericService.deleteResources<IPost>(
    Post,
    await idConverter(PostId)
  );

  await NotificationServices.sendNoification({
    ownerId: req.user?._id,
    key: "notification",
    data: {
      message: `An Post deleted`,
    },
    receiverId: [req.user?._id],
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully deleted Post",
    data: result,
  });
});


const FavouriteController = {
  createFavouritePost,
  createFavouriteProduct,
  getFavourite,
  getAllFavouritePost,
  getAllFavouriteProduct,
  updateFavourite,
  deleteFavourite,
  // TrialPost,
  // PaidPost,
  // Webhook
};

export default FavouriteController;