export enum EQueryStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum EQueryCategory {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  BILLING = 'billing',
  FEATURE = 'feature',
}

export enum EQueryPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export const DEFAULT_LOGO =
  'https://res.cloudinary.com/doha4fkyu/image/upload/v1736632381/helioai/helioailogo_lw7mqi.png';

export enum DATA_CATEGORY {
  LINK_DATA = 'Links Data',
  PRODUCT_DATA = 'Product Data',
  FAQ_DATA = 'FAQ Data',
  POLICY_DATA = 'Policy Data',
  SHIPPING_DATA = 'Shipping Data',
  RETURN_DATA = 'Return Data',
  CONTACT_DATA = 'Contact Data',
  ABOUT_DATA = 'About Data',
  BLOG_DATA = 'Blog Data',
  COLLECTION_DATA = 'Collection Data',
  PAGE_DATA = 'Page Data',
}

export enum QUIZ_QUESTION_TYPE {
  MULTIPLE_CHOICE = 'multipleChoice',
  TRUE_FALSE = 'trueFalse',
  SHORT_ANSWER = 'shortAnswer',
  TEXT = 'text',
}

export enum TRACK_TYPE {
  PRODUCT_VIEW_COUNT = 'product_view',
  CART_COUNT = 'cart',
  PRODUCT_PROMPT_COUNT = 'product_prompt',
}

export enum CHAT_TYPE {
  WHATSAPP = 'whatsapp',
  WIDGET = 'widget',
  INSTAGRAM = 'instagram',
}

export enum MESSENGER_TYPE {
  USER = 'user',
  AGENT = 'agent',
}

export enum CHAT_FLOW_TYPE {
  TRACK_MY_ORDER = 'TRACK_MY_ORDER',
  EDIT_MY_ORDER = 'EDIT_MY_ORDER',
  WHATSAPP = 'WHATSAPP',
}

export const GOOGLE_REDIRECT_URI = 'http://localhost:5173/email/google/callback';

export enum EMAIL_TEMPLATE_CATEGORY {
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
  TRANSACTIONAL = 'TRANSACTIONAL',
  OTHER = 'OTHER',
}

export enum EMAIL_LANGUAGE {
  ENGLISH = 'ENGLISH',
  SPANISH = 'SPANISH',
  FRENCH = 'FRENCH',
  GERMAN = 'GERMAN',
  ITALIAN = 'ITALIAN',
}

/////////////////////
// SESSION
/////////////////////

// Shopify Webhooks Events for tracking session
export enum SESSION_EVENT_TYPE {
  PAGE_VIEW = 'page_viewed',
  PRODUCT_VIEW = 'product_viewed',
  COLLECTION_VIEW = 'collection_viewed',
  SEARCH_SUBMITTED = 'search_submitted',
  PRODUCT_ADDED_TO_CART = 'product_added_to_cart',
  CHECKOUT_STARTED = 'checkout_started',
  PRODUCT_VARIANT_VIEWED = 'product_variant_viewed',
  CART_VIEWED = 'cart_viewed',
  PRODUCT_REMOVED_FROM_CART = 'product_removed_from_cart',

  // Shopify Webhooks Events for tracking session
  CART_CREATED = 'cart_created',
  CART_UPDATED = 'cart_updated',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_FULFILLED = 'order_fulfilled',
  ORDER_CREATED = 'order_created',
  SHIPPING_STATUS_UPDATED = 'shipping_status_updated',
  CART_ABANDONMENT = 'cart_abandonment',
}

export interface PageViewedData {
  page_url: string;
  page_title: string;
  referrer: string;
}

export interface ProductViewedData {
  product_id: string;
  product_handle: string;
  title: string;
  price: number;
  currency: string;
}

export interface CollectionViewedData {
  collection_id: string;
  title: string;
}

export interface SearchSubmittedData {
  search_query: string;
}

export interface ProductAddedToCartData {
  product_id: string;
  product_handle: string;
  variant_id: string;
  quantity: number;
  price: number;
  currency: string;
}

export interface ProductVariantViewedData {
  product_id: string;
  product_handle: string;
  variant_id: string;
  title: string;
  price: number;
  currency: string;
}

export interface CartViewedData {
  cart_id: string;
  total_price: number;
  currency: string;
  item_count: number;
}

export interface ProductRemovedFromCartData {
  product_id: string;
  product_handle: string;
  variant_id: string;
  quantity: number;
  price: number;
  currency: string;
}

export interface CheckoutStartedData {
  checkout_id: string;
  total_price: number;
  currency: string;
  item_count: number;
}

export interface OrderCreatedData {
  order_id: string;
  order_name: string;
  products: {
    productId: string;
    variantId: string;
    title: string;
    quantity: number;
    price: number;
    sku?: string;
    handle?: string;
  }[];
  discount_codes: {
    code: string;
    amount: string;
    type: string;
  }[];
  collections: {
    id: string;
    title: string;
    handle: string;
  }[];
  item_count: number;
  total_price: string;
  shipping_price?: string | null;
  order_tags?: string[];
  is_cod?: boolean;
  payment_status?: string;
  source_name?: string;
}

export interface OrderCancelledData {
  order_id: string;
  order_name: string;
}

export interface OrderFulfilledData {
  order_id: string;
  order_name: string;
}

export interface CartCreatedData {
  cartId: string;
  cartValue: number;
  itemCount: number;
  cartLink: string;
  skuIds: string[];
}

export interface CartUpdatedData {
  cartId: string;
  cartValue: number;
  itemCount: number;
  cartLink: string;
  skuIds: string[];
}

export interface CartAbandonedData {
  cartId: string;
  cartUrl: string;
  cartValue: CartValue;
  numberOfItems: number;
  skus: string[];
  lineItems: LineItem[];
}

export interface CartValue {
  amount: string;
  currencyCode: string;
}

export interface LineItem {
  id: string;
  title: string;
  quantity: number;
  sku: string;
}

export interface FulfillmentEventsCreatedData {
  orderId: string;
  shippingStatus: string;
  trackingCompany: string;
  variantIds: string[];
  variantNames: string[];
}

export interface CheckoutCreatedData {
  products: {
    id: string;
    title: string;
    variant_id: string;
    quantity: number;
    price: number;
    tags: string[];
    collections: {
      id: string;
      title: string;
      handle: string;
    }[];
  }[];
  discountCode: string[];
  collections: {
    id: string;
    title: string;
    handle: string;
  }[];
  item_count: number;
  total_price: string;
  shipping_price: string;
  product_tags: string[];
}
/////////////////////
// HELPDESK

export enum HELPDESK_PRIORITY {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NOT_IN_PRIORITY = 'not_in_priority',
}

export enum ROLE_OPTIONS {
  ADMIN = 'Admin',
  USER = 'User',
}
export const BLACKLIST_PROPS = new Set([
  'widgetId',
  'item_count',
  'cart_id',
  'checkout_id',
  'total_price',
  'shipping_price',
  'price',
  'quantity',
  'currency',
]);

export enum ASSIGNMENT_TYPE {
  UNASSIGNED = 'unassigned',
  ROUND_ROBIN = 'roundrobin',
}

export enum HELPDESK_STATUS {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum HELPDESK_SORT_ORDER {
  ASC = 'asc',
  DESC = 'desc',
}

export enum HELPDESK_SORT_BY {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
