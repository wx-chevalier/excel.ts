// @flow
import "./polyfill/setImmediate";

// 判断是否可以使用 Proxy
const hasProxy =
  typeof Proxy !== 'undefined' && Proxy.toString().match(/native code/);

import _observe from './proxy/observe';

export const observe = _observe;
