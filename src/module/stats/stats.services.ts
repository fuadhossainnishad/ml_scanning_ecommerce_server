import { Model } from 'mongoose';
import AggregationQueryBuilder from '../../app/builder/Builder';
import { IBrand } from '../brand/brand.interface';
import Brand from '../brand/brand.model';

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
const StatsServices = {
    fetchAggregation,
    fetchAggregationTwo
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