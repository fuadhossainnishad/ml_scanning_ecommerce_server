import {
  TErrorSources,
  TGenericResponse,
} from '../../interface/error.interface';

const handelDuplicateError = (err: any): TGenericResponse => {
  const errorSources: TErrorSources = []
  // Extracted value or null if not found
  const duplicateField = Object.keys(err.keyValue || {})[0];
  const duplicateValue = err.keyValue?.[duplicateField]
  const formattedField =
    duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1).toLowerCase();
  errorSources.push({
    path: duplicateField,
    message: `${formattedField} '${duplicateValue}' already exist`
  })
  const statusCode = 409;
  return {
    statusCode,
    message: `${formattedField} already exist`,
    errorSources,
  };
};

// const handelDuplicateError = (err: any): TGenericResponse => {
//   const match = err.message.match(/"([^"]*)"/);

//   // Extracted value or null if not found
//   const extractedMessage = match ? match[1] : null;
//   const errorSources: TErrorSources = [{ path: '', message: extractedMessage }];

//   const statusCode = 404;
//   return {
//     statusCode,
//     message: ' InValidate id',
//     errorSources,
//   };
// };

export default handelDuplicateError;
