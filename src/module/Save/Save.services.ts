import { Request } from "express";
import SavePost from "./Save.model";
import AggregationQueryBuilder from "../../app/builder/Builder";
import { buildMeta } from "../stats/stats.services";

const getSavePostService = async (req: Request) => {

    const userIdStr = req.user?._id;
    const userRole = req.user?.role || null;

    const query = {
        ...req.query,
        saverId: userIdStr,
        saverType: userRole
    }

    const builder = new AggregationQueryBuilder(SavePost, query);

    builder.filter();
    builder.search([]);

    builder.addStages([
        {
            $lookup: {
                from: "posts",
                localField: "postId",
                foreignField: "_id",
                as: "postDetails",
            },
        },
        {
            $unwind: "$postDetails",
        },
        {
            $lookup: {
                from: 'Admin',
                localField: "postDetails.uploaderId",
                foreignField: "_id",
                pipeline: [{ $match: { isDeleted: false } }],
                as: "uploaderDetails"
            }
        },
        {
            $unwind: "$uploaderDetails",
        },
        {
            $addFields: {
                profile: {
                    $cond: {
                        if: { $eq: ["postDetails.uploaderType", "Brand"] },
                        then: "$uploaderDetails.brandLogo",
                        else: "$uploaderDetails.profile"
                    }
                },
                uploaderType: "$postDetails.uploaderType",
                uploaderId: "$postDetails.uploaderId",
                firstName: "$uploaderDetails.firstName",
                lastName: "$uploaderDetails.lastName",
                userName: "$uploaderDetails.userName",
            }
        },
        {
            $project: {
                _id: 0,
                // saverId: 1,
                // saverType: 1,
                // postId: 1,
                uploaderDetails: 0,
            },
        },

    ])

    builder.sort();
    builder.fields();

    const meta = await builder.countTotal();

    console.log("post query:", builder.getMatchObj());

    const data = await builder.execute();

    return {
        meta: buildMeta(meta.page, meta.limit, meta.total),
        data,
    };
}




const SavePostServices = {
    getSavePostService
}
export default SavePostServices;