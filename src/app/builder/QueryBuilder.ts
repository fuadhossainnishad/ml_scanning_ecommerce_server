import { FilterQuery, Query } from "mongoose";

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const searchTerm = this?.query?.searchTerm;
    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map((field) => ({
          [field]: { $regex: searchTerm, $options: "i" },
        })),
      } as FilterQuery<T>);
    }
    return this;
  }

  filter() {
    const queryObject = { ...this.query };
    const excludeField = ["searchTerm", "sort", "limit", "page", "fields"];
    excludeField.forEach((field) => delete queryObject[field]);
    this.modelQuery = this.modelQuery.find(queryObject as FilterQuery<T>);
    return this;
  }

  sort() {
    const sort = (this?.query?.sort as string)?.split(",").join(" ");
    if (sort) {
      this.modelQuery = this.modelQuery.sort(sort);
    } else {
      this.modelQuery = this.modelQuery.sort("-createdAt");
    }
    return this;
  }

  pagination() {
    let limit = 10;
    let page = 1;
    let skip = 0;

    if (this?.query?.limit) {
      limit = Number(this.query?.limit);
    }
    if (this?.query?.page) {
      page = Number(this?.query?.page);
      skip = (page - 1) * limit;
    }

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  fields() {
    let fields = "-__v";
    if (this.query?.fields) {
      fields = (this.query?.fields as string).split(",").join(" ");
    }
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  async countTotal() {
    const totalQueries = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(totalQueries);
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
