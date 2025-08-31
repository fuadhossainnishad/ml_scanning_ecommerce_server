import mongoose from 'mongoose';
import { TErrorSources } from '../../interface/error.interface';

const handelCastError = (err: mongoose.Error.CastError) => {
  const errorSources: TErrorSources = [
    { path: err?.path, message: err?.message },
  ];

  const statusCode = 404;
  return {
    statusCode,
    message: ' InValidate id',
    errorSources,
  };
};

export default handelCastError;
