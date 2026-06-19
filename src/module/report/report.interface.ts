import { Types } from "mongoose";

export interface IReport {
  postId: Types.ObjectId
  userId: Types.ObjectId;
  report: string
  isDeleted: boolean;
  createdAt: Date
  updatedAt: Date
}

export type TReportUpdate = Partial<IReport> & {
  id: Types.ObjectId;
};
