import { Model, Types } from "mongoose";
import QueryBuilder from "../app/builder/QueryBuilder";
import AppError from "../app/error/AppError";
import httpStatus from "http-status";

const insertResources = async <T>(Model: Model<T>, payload: T) => {
  const insertResource = await Model.create<T>(payload);
  if (!insertResource) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `New ${Model.modelName.toLowerCase()} data not inserted`
    );
  }
  return { [Model.modelName.toLowerCase()]: insertResource };
};

const findResources = async <T>(Model: Model<T>, QueryId: Types.ObjectId) => {
  if (!QueryId) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `Id required to find ${Model.modelName} related data`
    );
  }
  const resource = await Model.findById(QueryId);
  if (!resource) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `${QueryId.toString()} in ${Model.modelName} not found`
    );
  }
  return { [Model.modelName.toLowerCase()]: resource };
};

const findAllResources = async <T>(
  Model: Model<T>,
  Query: Record<string, unknown>,
  searchField: string[]
) => {
  console.log("Query:", Query);

  const baseQuery = Model.find();
  const queryBuilder = new QueryBuilder(baseQuery, Query)
    .search(searchField)
    .filter()
    .sort()
    .pagination()
    .fields();
  const resources = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  return { meta, [Model.modelName.toLowerCase()]: resources };
};

const updateResources = async <T>(
  Model: Model<T>,
  updateId: Types.ObjectId,
  payload: Partial<T>
) => {
  if (!updateId) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `${Model.modelName} id is required to update`
    );
  }
  const updateResource = await Model.findByIdAndUpdate(updateId, payload, {
    new: true,
    runValidators: true,
  });
  if (!updateResource) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `Id:${updateId} of ${Model.modelName} not updated`
    );
  }

  return { [Model.modelName.toLowerCase()]: updateResource };
};

const deleteResources = async <T, K extends keyof T | undefined = undefined>(
  Model: Model<T>,
  deleteId: Types.ObjectId,
  ownerId?: Types.ObjectId,
  owner?: K
) => {
  const resource = await Model.findById(deleteId);
  if (!resource) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `Id:${deleteId} of ${Model.modelName} not found`
    );
  }

  if (owner && ownerId) {
    if (owner in resource && resource[owner] instanceof Types.ObjectId) {
      console.log("ownerId:", ownerId, "resource[owner]:", resource[owner]);

      if (ownerId.toString() !== resource[owner].toString()) {
        throw new AppError(
          httpStatus.NOT_ACCEPTABLE,
          "Owner does not own this resource"
        );
      }
    } else {
      throw new AppError(
        httpStatus.NOT_FOUND,
        `${String(owner)} field not found in ${Model.modelName}`
      );
    }
  }

  const result = await Model.deleteOne({ _id: deleteId });
  if (!result.deletedCount) {
    throw new AppError(
      httpStatus.NOT_IMPLEMENTED,
      `Id:${deleteId} of ${Model.modelName} deletion failed`
    );
  }
  return {
    message: `Id:${deleteId} of ${Model.modelName} has been deleted successfully`,
  };
};

const GenericService = {
  insertResources,
  findResources,
  findAllResources,
  updateResources,
  deleteResources,
};

export default GenericService;
