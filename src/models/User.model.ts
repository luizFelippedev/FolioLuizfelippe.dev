import { comparePassword, hashPassword } from '@utils/helpers/hash.helper';
import { Schema, model, type HydratedDocument, type Model } from 'mongoose';


export type UserRole = 'admin' | 'editor' | 'guest';

export interface IUser {
  name: string;
  email: string;
  password: string;
  headline?: string;
  bio?: string;
  avatar?: {
    url: string;
    publicId?: string;
  };
  social?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    dribbble?: string;
    youtube?: string;
  };
  role: UserRole;
  isActive: boolean;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

export type UserModelType = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModelType, IUserMethods>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    password: {
      type: String,
      required: true
    },
    headline: String,
    bio: String,
    avatar: {
      url: String,
      publicId: String
    },
    social: {
      github: String,
      linkedin: String,
      twitter: String,
      dribbble: String,
      youtube: String
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'guest'],
      default: 'guest'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    passwordResetToken: {
      type: String
    },
    passwordResetExpiresAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpiresAt;
        return ret;
      }
    }
  }
);

userSchema.pre<UserDocument>('save', async function hashUserPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await hashPassword(this.password);
  next();
});

userSchema.methods.comparePassword = async function compareUserPassword(this: UserDocument, candidate: string) {
  return comparePassword(candidate, this.password);
};

const UserModel = model<IUser, UserModelType>('User', userSchema);

export default UserModel;
