import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { ISettings } from "./settings.interface";

const SettingsSchema: Schema = new Schema<ISettings>(
  {
    type: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

MongooseHelper.findExistence(SettingsSchema);
MongooseHelper.applyToJSONTransform(SettingsSchema);

SettingsSchema.index({ type: "text", content: "text" });

const Settings: Model<ISettings> = model<ISettings>("Setting", SettingsSchema);

export default Settings;
