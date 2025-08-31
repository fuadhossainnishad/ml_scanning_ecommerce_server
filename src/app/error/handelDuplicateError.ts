import {
  TErrorSources,
  TGenericResponse,
} from '../../interface/error.interface';

 
const handelDuplicateError = (err: any): TGenericResponse => {
  const match = err.message.match(/"([^"]*)"/);

  // Extracted value or null if not found
  const extractedMessage = match ? match[1] : null;
  const errorSources: TErrorSources = [{ path: '', message: extractedMessage }];

  const statusCode = 404;
  return {
    statusCode,
    message: ' InValidate id',
    errorSources,
  };
};

export default handelDuplicateError;
