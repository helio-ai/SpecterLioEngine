import mongoose, { ObjectId } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { BOT_TYPE } from '../../constants/chat.constant';
import { SUBSCRIPTION_PLAN } from '../../constants/subscription.constant';
import { DATABASE_COLLECTIONS_REF } from '../../constants/database.constant';
import { USER_ROLE } from '../../constants/user.constant';

const expression = { isActive: { $eq: true } };
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      index: {
        unique: true,
        partialFilterExpression: expression,
      },
      match: [
        /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/,
        'Please provide a valid email',
      ],
      trim: true,
      lowercase: true,
    },
    defaultWidgetId: {
      type: mongoose.Types.ObjectId,
      ref: DATABASE_COLLECTIONS_REF.WIDGET,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password should be at least 6 characters.'],
    },
    role: {
      type: String,
      enum: [USER_ROLE.ADMIN, USER_ROLE.USER],
      default: 'user',
    },
    name: {
      type: String,
      maxlength: [40, 'Name should be under 40 characters.'],
      trim: true,
    },
    type: {
      type: String,
      enum: BOT_TYPE,
    },
    domain: {
      type: String,
    },
    tags: {
      type: [String],
      default: ['General'],
    },
    totalConversationCount: {
      type: Number,
      default: 0,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    totalMessageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    gender: {
      type: String,
      enum: {
        values: ['Male', 'Female', 'Others'],
        message: 'Please choose from Male, Female, or Others',
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    subscriptionPlan: {
      type: String,
      enum: [
        SUBSCRIPTION_PLAN.FREE,
        SUBSCRIPTION_PLAN.BASIC,
        SUBSCRIPTION_PLAN.PRO,
        SUBSCRIPTION_PLAN.ENTERPRISE,
      ],
      default: SUBSCRIPTION_PLAN.BASIC,
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    apiCallsUsed: {
      type: Number,
      default: 0, // Tracks API call usage
    },
    periodStart: {
      type: Date, // Start of the usage period (e.g., month)
      default: Date.now,
    },
    periodEnd: {
      type: Date, // End of the usage period (e.g., month)
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    devApiAccessToken: {
      type: String,
      default: null,
      //   select: false, // keeping private
    },
    devApiTokenExpiry: {
      type: Date,
      default: null,
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isValidatedPassword = async function (userSendPassword: string) {
  return await bcrypt.compare(userSendPassword, this.password);
};

userSchema.methods.getJwtToken = function (): string {
  const tokenMap = { userId: this._id, role: this.role };
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET env var');
  // Set token expiry to 7 days (7 days * 24 hours * 60 minutes * 60 seconds)
  const expirySeconds = parseInt(process.env.JWT_EXPIRY!, 10) * 24 * 60 * 60; // 7 days in seconds
  return jwt.sign(tokenMap, secret, {
    expiresIn: expirySeconds,
  } as SignOptions);
};

userSchema.statics.verifyJwtToken = function (token: string): ObjectId | null {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT secret not found');
    }
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!); // Use your JWT secret here
    return decoded?.userId as ObjectId;
  } catch {
    return null;
  }
};

userSchema.methods.getForgotPasswordToken = function (): string {
  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  // Hash the token and set to forgotPasswordToken field
  this.forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  // Set expiry to 20 minutes from now
  this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model(DATABASE_COLLECTIONS_REF.USER, userSchema);
export default User;
