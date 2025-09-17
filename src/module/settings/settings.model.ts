import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { ISettings, SettingType } from "./settings.interface";



const SettingsSchema: Schema = new Schema<ISettings>(
  {
    type: {
      type: String,
      enum: Object.values(SettingType),
      message: "Invalid type. Allowed types are 'terms_and_conditions' and 'privacy_policy'.",
      required: true,
      unique: true
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

SettingsSchema.index({ type: 1 }, { unique: true });

const Settings: Model<ISettings> = model<ISettings>("Setting", SettingsSchema);

export default Settings;
