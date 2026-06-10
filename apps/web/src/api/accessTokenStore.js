let accessToken = null;

export const accessTokenStore = {
  get() {
    return accessToken;
  },

  set(token) {
    accessToken = token;
  },

  clear() {
    accessToken = null;
  },
};