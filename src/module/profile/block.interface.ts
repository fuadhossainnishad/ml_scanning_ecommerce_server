import { Types } from "mongoose";

export interface IBlockProfile {
    blockerId: Types.ObjectId;
    blockedId: Types.ObjectId;
    createdAt: Date;
}

