import { FilterQuery, PipelineStage, Model } from "mongoose";
import mongoose from "mongoose"; // Add this import for Types.ObjectId

interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
}

interface SortObject {
    [key: string]: 1 | -1;
}

class AggregationQueryBuilder<T> {
    private model: Model<T>;
    private query: Record<string, unknown>;
    private matchObj: Record<string, any> = { isDeleted: false };
    private sortObj: SortObject = { createdAt: -1 };
    private projectObj: Record<string, any> = { __v: 0 };
    private skip: number = 0;
    private limit: number = 10;
    private page: number = 1;
    private customStages: PipelineStage[] = [];
    private searchableFields?: string[];

    constructor(model: Model<T>, query: Record<string, unknown>) {
        this.model = model;
        this.query = query;
        this._setupPagination();
    }

    /**
     * Adds search functionality using $or with regex on searchable fields.
     * Merges into the match object.
     */
    search(searchableFields: string[]): this {
        this.searchableFields = searchableFields;
        const searchTerm = this.query.searchTerm as string;
        if (searchTerm) {
            const searchCondition = {
                $or: searchableFields.map((field) => ({
                    [field]: { $regex: searchTerm, $options: "i" },
                })),
            };
            this.matchObj = { $and: [this.matchObj, searchCondition] };
        }
        return this;
    }

    /**
     * Applies filtering by excluding pagination/sort/search fields and merging into match.
     * Handles basic ObjectId casting for common ID fields (extend as needed).
     */
    filter(idFields: string[] = ["uploaderId", "brandId", "_id"]): this {
        const queryObject = { ...this.query };
        const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];
        excludeFields.forEach((field) => delete queryObject[field]);

        // Cast ObjectId strings for specified fields
        idFields.forEach((field) => {
            if (queryObject[field] && typeof queryObject[field] === "string") {
                try {
                    queryObject[field] = new mongoose.Types.ObjectId(queryObject[field] as string);
                } catch (err) {
                    delete queryObject[field]; // Invalid ID, ignore
                }
            }
        });

        this.matchObj = { $and: [this.matchObj, queryObject as FilterQuery<T>] };
        return this;
    }

    /**
     * Applies sorting based on query.sort (e.g., "field1,-field2").
     */
    sort(): this {
        const sortStr = this.query.sort as string;
        if (sortStr) {
            this.sortObj = {};
            sortStr.split(",").forEach((part) => {
                const field = part.trim().startsWith("-") ? part.slice(1).trim() : part.trim();
                this.sortObj[field] = part.startsWith("-") ? -1 : 1;
            });
        }
        return this;
    }

    /**
     * Sets up pagination values (does not add stages yet).
     */
    private _setupPagination(): void {
        this.limit = Number(this.query.limit) || 10;
        this.page = Number(this.query.page) || 1;
        this.skip = (this.page - 1) * this.limit;
    }

    /**
     * Applies field projection (e.g., "field1,-field2").
     */
    fields(): this {
        if (this.query.fields) {
            const fieldStr = this.query.fields as string;
            fieldStr.split(",").forEach((f) => {
                const field = f.trim();
                if (field.startsWith("-")) {
                    this.projectObj[field.slice(1)] = 0;
                } else {
                    this.projectObj[field] = 1;
                }
            });
        }
        return this;
    }

    /**
     * Adds custom aggregation stages (e.g., $lookup, $addFields) to insert after $match.
     * Useful for complex pipelines like joins.
     */
    addStages(stages: PipelineStage[]): this {
        this.customStages.push(...stages);
        return this;
    }

    /**
     * Computes total count and pagination meta using a minimal pipeline ($match + $count).
     * Call this before executing the full aggregation.
     */
    async countTotal(): Promise<PaginationMeta> {
        const countPipeline: PipelineStage[] = [
            { $match: this.matchObj },
            { $count: "total" },
        ];

        const [result] = await this.model.aggregate(countPipeline);
        const total = result?.total || 0;
        const totalPage = Math.ceil(total / this.limit);

        return {
            page: this.page,
            limit: this.limit,
            total,
            totalPage,
        };
    }

    /**
     * Builds the full aggregation pipeline.
     */
    buildPipeline(): PipelineStage[] {
        return [
            { $match: this.matchObj },
            ...this.customStages,
            { $sort: this.sortObj },
            { $project: this.projectObj },
            { $skip: this.skip },
            { $limit: this.limit },
        ];
    }

    /**
     * Executes the aggregation and returns the results.
     */
    async execute(): Promise<T[]> {
        const pipeline = this.buildPipeline();
        return this.model.aggregate(pipeline);
    }

    /**
     * Gets current pagination values.
     */
    getPagination(): { page: number; limit: number; skip: number } {
        return { page: this.page, limit: this.limit, skip: this.skip };
    }

    /**
     * Gets the current match object (for debugging or manual use).
     */
    getMatchObj(): Record<string, any> {
        return this.matchObj;
    }
}

export default AggregationQueryBuilder;