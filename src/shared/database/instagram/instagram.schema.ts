import mongoose from 'mongoose';
import { DATABASE_COLLECTIONS_REF } from '../../constants/database.constant';

const instagramBusinessAccountSchema = new mongoose.Schema(
  {
    widgetId: {
      type: mongoose.Types.ObjectId,
      required: true,
      unique: true,
      ref: DATABASE_COLLECTIONS_REF.WIDGET,
    },
    instagramClientId: { type: String, required: true },
    instagramAppSecret: { type: String, required: true },
    verifyToken: { type: String, required: true },
    accessToken: { type: String, required: false },
    accountId: { type: String, required: true },
    businessMediaId: { type: String, required: false },
    aiChatEnabled: { type: Boolean, default: false },
    tokenUpdatedAt: { type: Date, required: false },
    commentDefaultResponse: {
      type: String,
      required: false,
      default: 'Thanks for your message! For more information, check your DM.',
    },
    onlyProductCatalogueInDM: { type: Boolean, required: false, default: false },
  },
  { timestamps: true },
);

const instagramPostsSchema = new mongoose.Schema(
  {
    widgetId: { type: mongoose.Types.ObjectId, required: true },
    businessMediaId: { type: String, required: false },
    postId: { type: String, required: true, unique: true },
    autoRespondKeyWords: {
      type: [String],
      required: false,
      default: [
        'offer',
        'offers',
        'discount',
        'discounts',
        'info',
        'information',
        'buy',
        'shop',
        'purchase',
        'order',
        'buy now',
        'checkout',
        'deal',
        'deals',
        'sale',
        'sales',
        'promotion',
        'coupon',
        'voucher',
        'free',
        'save',
        'details',
        'price',
        'cost',
        'availability',
        'stock',
        'in stock',
        'out of stock',
        'shipping',
        'delivery',
        'help',
        'support',
        'contact',
        'whatsapp',
        'call',
        'gift',
        'gift card',
        'bonus',
        'combo',
      ],
    },
    postEnabled: { type: Boolean, default: false },
    productIds: [{ type: String, required: false, default: null }],
  },
  { timestamps: true },
);

const InstagramPosts = mongoose.model(
  DATABASE_COLLECTIONS_REF.INSTAGRAM_POSTS,
  instagramPostsSchema,
);
const InstagramBusinessAccount = mongoose.model(
  DATABASE_COLLECTIONS_REF.INSTAGRAM_BUSINESS_ACCOUNT,
  instagramBusinessAccountSchema,
);

export { InstagramBusinessAccount, InstagramPosts };
