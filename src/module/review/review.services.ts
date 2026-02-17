import { idConverter } from "../../utility/idConverter";
import { buildMeta, calculatePagination, IAggregationResponse } from "../stats/stats.services";
import User from "../user/user.model";
import Review from "./review.model";

const getReviewService = async <T>(productId: string, query: Record<string, unknown>): Promise<IAggregationResponse<T>> => {
  const { page, limit, skip } = calculatePagination(query);


  const productIdObject = await idConverter(productId);
  console.log("Converted ProductId: ", productIdObject);

  const review = await Review.findOne({ productId: productIdObject });
  console.log("Review productId in DB:", review);

  const user = await User.findOne({ _id: review?.userId });
  console.log("Review userId in DB:", user);

  const total = await Review.countDocuments();

  const result = await Review.aggregate([
    {
      $match: {
        productId: productIdObject,
        isDeleted: { $ne: true }
      },
    },
    {
      $lookup: {
        from: 'Admin',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $unwind: {
        path: '$userInfo',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        ratings: 1,
        attachment: 1,
        comments: 1,
        isDeleted: 1,
        updatedAt: 1,
        createdAt: 1,
        'userInfo.userName': 1,
        'userInfo.profile': 1
      }
    },
    {
      $limit: limit
    },
    { $skip: skip }
  ]);
  console.log("Review aggregation result:", result)
  return {
    meta: buildMeta(page, limit, total),
    data: result as T[],
  };;
};

// const updateReviewService = async (payload: TAdminUpdate) => {
//   const { adminId, ...updateData } = payload;
//   const adminIdObject = await idConverter(adminId);

//   if (!adminIdObject) {
//     throw new AppError(
//       httpStatus.NOT_FOUND,
//       "Admin id & vendor id is required"
//     );
//   }
//   const foundAdmin = await Admin.findById(adminIdObject);
//   if (!foundAdmin) {
//     throw new AppError(httpStatus.NOT_FOUND, "No Admin has found");
//   }
//   Object.assign(foundAdmin, updateData);
//   foundAdmin.save();
//   return { Admin: foundAdmin };
// };

const ReviewServices = {
  getReviewService,
  // updateReviewService
};

export default ReviewServices;
