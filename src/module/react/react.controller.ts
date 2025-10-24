import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import { idConverter } from "../../utility/idConverter";
import NotificationServices from "../notification/notification.service";
import React from "./react.model";
import { IReact } from "./react.interface";

const createReact: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Authenticated user is required",
      ""
    );
  }
  const { _id, role } = req.user
  const { id } = req.params

  if (!id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "PostId is required",
      ""
    );
  }
  const postObjectId = await idConverter(id)
  let result

  const exist = await React.findOne<IReact>({
    postId: postObjectId,
    reactorId: _id,
    reactorType: role,
  })

  if (exist) {
    if (!exist.isDeleted) {
      result = await React.findOneAndUpdate(
        { postId: postObjectId, reactorId: _id, reactorType: role, isDeleted: false },
        { $set: { isDeleted: true, updatedAt: new Date() } },
        { new: true }
      );
      return sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Reaction removed successfully",
        data: { isReacted: false },
      });
    }
    else {
      result = await React.findOneAndUpdate(
        { postId: postObjectId, reactorId: _id, reactorType: role, isDeleted: true },
        { $set: { isDeleted: false, updatedAt: new Date() } },
        { new: true }
      );
      return sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Reaction added successfully",
        data: { isReacted: true },
      });
    }
  } else {
    const data: IReact = {
      postId: postObjectId,
      reactorId: _id,
      reactorType: role,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    result = await React.findOneAndUpdate(
      { postId: postObjectId, reactorId: _id, reactorType: role },
      { $set: { ...data, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true }
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
    message: "successfully added new React",
    data: result,
  });
});

const getReact: RequestHandler = catchAsync(async (req, res) => {
  const { ReactId } = req.body.data;
  console.log("ReactId: ", ReactId);

  if (!ReactId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "React ID is required",
      ""
    );
  }
  const result = await GenericService.findResources<IReact>(
    React,
    await idConverter(ReactId)
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve all React data",
    data: result,
  });
});

const getAllReact: RequestHandler = catchAsync(async (req, res) => {
  const result = await GenericService.findAllResources<IReact>(
    React,
    req.query,
    []
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve React data",
    data: result,
  });
});

const updateReact: RequestHandler = catchAsync(async (req, res) => {
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

  const result = await GenericService.updateResources<IReact>(
    React,
    await idConverter(id),
    req.body.data
  );

  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.React?._id.toString(),
  //     message: `An React updated`,
  //   },
  //   receiverId: [req.user?._id],
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully updated React ",
    data: result,
  });
});

const deleteReact: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin not authenticated", "");
  }

  if (req.user?.role !== "Admin") {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Only admin can do update React",
      ""
    );
  }
  const { ReactId } = req.body.data;
  const result = await GenericService.deleteResources<IReact>(
    React,
    await idConverter(ReactId)
  );

  await NotificationServices.sendNoification({
    ownerId: req.user?._id,
    key: "notification",
    data: {
      message: `An React deleted`,
    },
    receiverId: [req.user?._id],
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully deleted React",
    data: result,
  });
});


const ReactController = {
  createReact,
  getReact,
  getAllReact,
  updateReact,
  deleteReact,
};

export default ReactController;