import httpStatus from "http-status";
import AppError from "../../app/error/AppError";
import { ISettings } from "./settings.interface";
import Settings from "./settings.model";
// import { uploadFileToBunny } from '../../utility/bunny_cdn';

const getSettingsFromDb = async () => {
  const dbRes = await Settings.find({ isDeleted: false });
  if (!dbRes || dbRes.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "Settings not found");
  }
  return { settings: dbRes };
};

const upsertSettingsIntoDb = async (payload: ISettings) => {
  const { type, content } = payload;
  const dbRes = await Settings.findOneAndUpdate(
    { type },
    { content },
    { upsert: true, new: true }
  );
  if (!dbRes) {
    throw new AppError(httpStatus.NOT_FOUND, `${type} settings not found`);
  }
  return { settings: dbRes };
};

const SettingsServices = {
  getSettingsFromDb,
  upsertSettingsIntoDb,
};

export default SettingsServices;
