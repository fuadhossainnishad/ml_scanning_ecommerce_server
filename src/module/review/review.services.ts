import { idConverter } from "../../utility/idConverter";
import Review from "./review.model";

const getReviewService = async (productId: string) => {
  const result = await Review.aggregate([
    {
      $match: { productId: await idConverter(productId) }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $unwind: '$userInfo'
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
    }
  ])

  return result
}
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
