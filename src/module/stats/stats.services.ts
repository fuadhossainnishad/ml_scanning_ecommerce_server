import { Model } from 'mongoose';
import AggregationQueryBuilder from '../../app/builder/Builder';
import { IBrand } from '../brand/brand.interface';
import Brand from '../brand/brand.model';
import axios from 'axios';
import FormData from 'form-data';
import AppError from '../../app/error/AppError';
import httpStatus from 'http-status';
import config from '../../app/config';
import Order from '../order/order.model';

export interface IPaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
}

export const calculatePagination = (query: Record<string, unknown>): { page: number; limit: number; skip: number } => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

export const buildMeta = (page: number, limit: number, total: number): IPaginationMeta => {
    const totalPage = Math.ceil(total / limit);
    return { page, limit, total, totalPage };
};


export interface IAggregationResponse<T> {
    meta: IPaginationMeta;
    data: T[];
}

const fetchAggregation = async <T>(Model: Model<T>, projects: string[], query: Record<string, unknown>): Promise<IAggregationResponse<T>> => {
    // const { page, limit, skip } = calculatePagination(query);

    // const projectFields: { [key: string]: number } = projects.reduce((acc, field) => {
    //     acc[field] = 1;
    //     return acc;
    // }, {} as { [key: string]: number });

    // const total = await Model.countDocuments();

    // Use AggregationQueryBuilder
    const builder = new AggregationQueryBuilder<IBrand>(Brand, query)
        .search(["brandName", "theme"])
        .filter()
        .sort()
        .fields();

    const meta = await builder.countTotal()
    const result = await builder.execute();

    return {
        meta: buildMeta(meta.page, meta.limit, meta.total),
        data: result as T[],
    };
};

const fetchAggregationTwo = async <T>(Model: Model<T>, projects: string[], query: Record<string, unknown>): Promise<IAggregationResponse<T>> => {
    const { page, limit, skip } = calculatePagination(query);

    const projectFields: { [key: string]: number } = projects.reduce((acc, field) => {
        acc[field] = 1;
        return acc;
    }, {} as { [key: string]: number });

    const total = await Model.countDocuments();

    const result = await Model.aggregate([
        { $project: projectFields },
        { $skip: skip },
        { $limit: limit }
    ]);

    return {
        meta: buildMeta(page, limit, total),
        data: result as T[],
    };
};

interface IEmbeddings {
    file: string[],
    product_id: string,
    category: string,
    top_k?: number
}

const scanningServices = async (scan: string[]) => {
    const fileResponse = await axios.get(scan[0], { responseType: "arraybuffer" });
    const fileBuffer: Buffer = Buffer.from(fileResponse.data);
    console.log("receive file")

    // Create form-data
    const formData = new FormData();
    formData.append("file", fileBuffer, {
        filename: "scan.jpg",
        contentType: "image/jpeg"
    });

    const url = new URL(config.scanning_url);


    console.log("🚀 Sending file to scanning service...");

    const response = await axios.post(
        url.toString(),
        formData,
        {
            headers: formData.getHeaders()
        }
    );
    console.log("file sent")

    if (response.status !== 200) {
        throw new AppError(httpStatus.NOT_ACCEPTABLE, "Scanning server not responed");
    }

    console.log("scan:", response.data)
    console.log("scan:", response.data.results)

    return response
}



const embeddingServices = async (payload: IEmbeddings) => {
    if (!payload.file || payload.file.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "No files provided for embedding");
    }

    const results = [];

    for (let i = 0; i < payload.file.length; i++) {
        const fileUrl = payload.file[i];

        const fileResponse = await axios.get(fileUrl, { responseType: "arraybuffer" });
        const fileBuffer: Buffer = Buffer.from(fileResponse.data);
        console.log(`Received file ${i + 1}/${payload.file.length}`);

        const formData = new FormData();
        formData.append("file", fileBuffer, {
            filename: `scan_${i + 1}.jpg`,
            contentType: "image/jpeg"
        });

        const url = new URL(config.embedding_url);
        if (payload.product_id) url.searchParams.append("product_id", payload.product_id);
        if (payload.category) url.searchParams.append("category", payload.category);
        // if (payload.top_k) url.searchParams.append("top_k", payload.top_k.toString());

        console.log(`🚀 Sending file ${i + 1} to scanning service...`);

        const response = await axios.post(url.toString(), formData, {
            headers: formData.getHeaders()
        });

        if (response.status !== 200) {
            throw new AppError(httpStatus.NOT_ACCEPTABLE, `Scanning server did not respond for file ${i + 1}`);
        }

        console.log(`File ${i + 1} uploaded. Response:`, response.data);

        results.push(response.data);
    }

    return {
        status: "success",
        product_id: payload.product_id,
        embeddings: results
    };
};


const brandOfTheWeekService = async () => {
    // Get start and end of this week (Monday → Sunday)
    const today = new Date();

    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - today.getDay() + 1);
    firstDay.setHours(0, 0, 0, 0);

    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    lastDay.setHours(23, 59, 59, 999);

    const result = await Order.aggregate([
        {
            $match: {
                orderStatus: "delivered",
                paymentStatus: "succeded",
                createdAt: {
                    $gte: firstDay,
                    $lte: lastDay,
                },
            },
        },

        // Join cart
        {
            $lookup: {
                from: "carts",
                localField: "cartId",
                foreignField: "_id",
                as: "cart",
            },
        },
        { $unwind: "$cart" },

        // Each product in the cart
        { $unwind: "$cart.products" },

        // Join product
        {
            $lookup: {
                from: "products",
                localField: "cart.products.productId",
                foreignField: "_id",
                as: "product",
            },
        },
        { $unwind: "$product" },

        // Group by brand
        {
            $group: {
                _id: "$product.brandId",
                totalSold: { $sum: "$cart.products.quantity" },
            },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 1 },

        // Join brand
        {
            $lookup: {
                from: "brands",
                localField: "_id",
                foreignField: "_id",
                as: "brand",
            },
        },
        { $unwind: "$brand" },

        // Final output format
        {
            $project: {
                _id: 0,
                brandId: "$brand._id",
                brandName: "$brand.brandName",
                brandLogo: "$brand.brandLogo",
                theme: "$brand.theme",
            },
        },
    ]);

    if (!result || result.length === 0) {
        return {}
    }

    return result[0];
};



const StatsServices = {
    fetchAggregation,
    fetchAggregationTwo,
    embeddingServices,
    scanningServices,
    brandOfTheWeekService
};

export default StatsServices;


// const fetchAggragation = async<T>(Model: Model<T>, projects: string[]) => {
//     const projectFields: { [key: string]: number } = projects.reduce((acc, field) => {
//         acc[field] = 1;
//         return acc;
//     }, {} as { [key: string]: number });

//     const result = await Model.aggregate([
//         {
//             $project: projectFields

//         }
//     ])

//     return { [Model.modelName.toLowerCase()]: result }
// }

// const StatsServices = {
//     fetchAggragation
// }
// export default StatsServices