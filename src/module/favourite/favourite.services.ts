import SavePost from "./favourite.post.model";

const getSavePostService = async (saverId: string) => {

    const savedPosts = await SavePost.aggregate([
        {
            $match: {
                saverId: saverId,
                isDeleted: false,
            },
        },
        {
            $unwind: "$postId",
        },
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
            $project: {
                _id: 0,
                saverId: 1,
                saverType: 1,
                postId: 1,
                postDetails: 1,
            },
        },
    ]);



}

const SavePostServices = {
    getSavePostService
}
export default SavePostServices;