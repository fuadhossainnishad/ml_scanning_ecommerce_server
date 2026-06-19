import { model, Schema } from "mongoose";
import { IBlockProfile } from "./block.interface";

const BlockSchema = new Schema<IBlockProfile>(
    {
        blockerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        blockedId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

BlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

const BlockProfile = model<IBlockProfile>("BlockProfile", BlockSchema);
export default BlockProfile