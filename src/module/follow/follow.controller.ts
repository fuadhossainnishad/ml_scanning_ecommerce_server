import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import { idConverter } from "../../utility/idConverter";
import NotificationServices from "../notification/notification.service";
import Admin from "../admin/admin.model";
import { IFollow } from "./follow.interface";
import Follow from "./follow.model";


const createFollow: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.BAD_REQUEST, "Authenticated user is required", "");
  }

  const { _id: authorId, role: authorType } = req.user;
  const { id: targetUserId } = req.params;

  console.log("author id:", authorId);
  console.log("following id:", targetUserId);

  if (authorId.toString() === targetUserId.toString()) {
    throw new AppError(httpStatus.BAD_REQUEST, "You cannot follow yourself", "");
  }

  const convertedId = await idConverter(targetUserId);
  if (!convertedId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid target user ID", "");
  }

  const targetUser = await Admin.findOne({ _id: convertedId }, { role: 1 });
  if (!targetUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User to follow not found", "");
  }

  // Find follow document for the current user
  const existingFollowDoc = await Follow.findOne({ authorId, authorType });

  if (existingFollowDoc) {
    // Check if already following this user
    const existing = existingFollowDoc.following.find(
      (f) => f.id.toString() === convertedId.toString()
    );

    if (existing && !existingFollowDoc.isDeleted) {
      // Already following → Unfollow
      existingFollowDoc.isDeleted = true;
      existingFollowDoc.totalFollowing =
        (existingFollowDoc.totalFollowing ?? 1) - 1;
      await existingFollowDoc.save();

      return sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Successfully unfollowed user",
        data: { unfollowedUserId: targetUserId, isFollowing: false },
      });
    } else if (existing && existingFollowDoc.isDeleted) {
      // Re-follow previously unfollowed user
      existingFollowDoc.isDeleted = false;
      existingFollowDoc.totalFollowing =
        (existingFollowDoc.totalFollowing ?? 0) + 1;
      await existingFollowDoc.save();

      return sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Successfully followed user again",
        data: { followedUserId: targetUserId, isFollowing: true },
      });
    } else {
      // Follow a new user
      existingFollowDoc.following.push({
        id: convertedId,
        type: targetUser.role!,
      });
      existingFollowDoc.totalFollowing =
        (existingFollowDoc.totalFollowing ?? 0) + 1;
      existingFollowDoc.isDeleted = false;
      await existingFollowDoc.save();

      return sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Successfully followed user",
        data: existingFollowDoc,
      });
    }
  }

  // No follow record yet for this author — create a new one
  const newFollow: IFollow = {
    authorId,
    authorType,
    following: [
      {
        id: convertedId,
        type: targetUser.role!,
      },
    ],
    totalFollowing: 1,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await GenericService.insertResources<IFollow>(Follow, newFollow);

  return sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Successfully followed user",
    data: result,
  });
});


const createFollow2: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Authenticated user is required",
      ""
    );
  }
  const { _id, role } = req.user;
  const { id } = req.params;
  let result;

  if (_id.toString() === id.toString()) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot follow yourself",
      ""
    );
  }

  console.log("following id:", id)

  const findUser = await Admin.findOne({ _id: await idConverter(id) }, { role: 1 });

  if (!findUser) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User to follow not found",
      ""
    );
  }

  const data: IFollow = {
    authorId: _id,
    authorType: role,
    following: [
      {
        id: await idConverter(id),
        type: findUser.role!,
      }
    ],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }


  const existingFollow = await Follow.find({
    authorId: _id,
    authorType: role,
    isDeleted: false,

  })

  if (existingFollow.length > 0) {
    const targetFollowing = existingFollow[0].following.find(
      follow => follow.id.toString() === id.toString()
    );

    if (targetFollowing) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You are already following this user",
        ""
      );
    }

    await Follow.updateOne({
      authorId: _id,
      authorType: role
    },
      {
        $push: {
          following: {
            id: await idConverter(id),
            type: findUser.role!,
          }
        },
        $inc: { totalFollowing: 1 },
        updatedAt: new Date(),
      }
    );

    result = await GenericService.findAllResources<IFollow>(Follow, req.query, [])

  } else {
    result = await GenericService.insertResources<IFollow>(
      Follow,
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
    message: "successfully add to Follow",
    data: result,
  });
});

const getFollow: RequestHandler = catchAsync(async (req, res) => {
  const { FollowId } = req.body.data;
  console.log("FollowId: ", FollowId);

  if (!FollowId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Follow ID is required",
      ""
    );
  }
  const result = await GenericService.findResources<IFollow>(
    Follow,
    await idConverter(FollowId)
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve all Follow data",
    data: result,
  });
});

const getAllFollow: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Authenticated user is required",
      ""
    );
  }
  const { _id } = req.user;

  const query = { ...req.query, authorId: _id };
  const result = await GenericService.findAllResources<IFollow>(
    Follow,
    query,
    []
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve Follow data",
    data: result,
  });
});

const updateFollow: RequestHandler = catchAsync(async (req, res) => {
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

  const result = await GenericService.updateResources<IFollow>(
    Follow,
    await idConverter(id),
    req.body.data
  );

  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.Follow?._id.toString(),
  //     message: `An Follow updated`,
  //   },
  //   receiverId: [req.user?._id],
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully updated Follow ",
    data: result,
  });
});

const deleteFollow: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin not authenticated", "");
  }

  if (req.user?.role !== "Admin") {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Only admin can do update Follow",
      ""
    );
  }
  const { FollowId } = req.body.data;
  const result = await GenericService.deleteResources<IFollow>(
    Follow,
    await idConverter(FollowId)
  );

  await NotificationServices.sendNoification({
    ownerId: req.user?._id,
    key: "notification",
    data: {
      message: `An Follow deleted`,
    },
    receiverId: [req.user?._id],
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully deleted Follow",
    data: result,
  });
});


const FollowController = {
  createFollow,
  createFollow2,
  getFollow,
  getAllFollow,
  updateFollow,
  deleteFollow,
};

export default FollowController;