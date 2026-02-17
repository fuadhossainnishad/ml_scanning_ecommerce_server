import { Model, Schema, model } from 'mongoose';

interface IRefreshToken {
  userId: string;
  token: string;
  sessionId: string;
  expiresAt: Date;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User',
  },
  token: {
    type: String,
    required: [true, 'Token is required'],
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const RefreshToken:Model<IRefreshToken> = model<IRefreshToken>('RefreshToken', refreshTokenSchema);

export default RefreshToken;