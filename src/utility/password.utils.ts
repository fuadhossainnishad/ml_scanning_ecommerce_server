import bcrypt from 'bcrypt';

const hashPassword = async (
  password: string,
  round: number,
): Promise<string> => {
  return bcrypt.hash(password, round);
};

const comparePassword = async (
  rawPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(rawPassword, hashedPassword);
};

const PasswordUtils = {
  hashPassword,
  comparePassword,
};
export default PasswordUtils;
