export const INSTAGRAM_OAUTH_URL = 'https://api.instagram.com/oauth/access_token';
export const SERVER_URL = 'https://api.helioai.tech';
export const ACCESS_TOKEN_URL = 'https://graph.instagram.com/access_token';
export const INSTAGRAM_CONVERSATIONS_URL =
  'https://graph.instagram.com/v21.0/me/conversations?fields=participants';
export const INSTAGRAM_SEND_MESSAGE_URL = 'https://graph.instagram.com/v21.0/me/messages';
export const INSTAGRAM_COMMENT_REPLY_URL = 'https://graph.instagram.com/v19.0/';
export const ROLES = {
  CLIENT: 'client',
  RECIPIENT: 'recipient',
} as const;
export const VERIFY__TOKEN = 'helio123';
export const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
export const LONG_LIVED_TOKEN_EXPIRY_TTL = 61 * MILLISECONDS_IN_DAY;
