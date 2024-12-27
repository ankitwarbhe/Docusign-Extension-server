import { Immutable } from '../utils/types';

const paths = {
  Base: '/api',
  Archive: {
    Base: '/',
    File: {
      Post: '/archive',
    },
  },
  Auth: {
    Base: '/oauth',
    Authorize: {
      Get: '/authorize',
    },
    Token: {
      Post: '/token',
    },
    UserInfo: {
      Get: '/userinfo',
    },
  },
};

export type TPaths = Immutable<typeof paths>;
export default paths as TPaths;
