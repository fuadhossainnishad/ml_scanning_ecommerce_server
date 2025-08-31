import mongoose from 'mongoose';

export const idConverter = async (
  id: string | mongoose.Types.ObjectId,
): Promise<mongoose.Types.ObjectId> => {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
};
