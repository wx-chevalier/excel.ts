// @flow

import {
  dispatch,
  dispatchTree,
  isObserveX,
  isRecrusive,
  objTree
} from '../shared/symbols';
import { enhance } from './enhance';

/**
 * Proxy Handler 通过 Proxy 设置某个对象的属性，若该属性值为对象则递归监控该对象
 * @type {Object}
 */
export const ProxyHandler = {
  set(target, property, value) {
    // 过滤并没有发生变化的属性
    if (target[property] !== value) {
      if (value === Object(value) && !value[isObserveX]) {
        target[property] = observe(value, {
          property,
          target,
          recursive: target[isRecrusive]
        });
      } else {
        target[property] = value;
      }

      // 触发监听事件，判断预设参数判断是否需要递归监听
      if (target[isRecrusive]) {
        target[dispatchTree](property, value);
      } else {
        target[dispatch](property, value);
      }
    }

    return true;
  }
};

/**
 * 构造函数
 * @param   {*} obj - anything can be an observe-x Proxy
 * @param property
 * @param target
 * @param recursive
 * @returns {Proxy}
 */
export default function observe(
  obj,
  { property = null, target = null, recursive = false } = {}
) {
  // 如果存在父属性与父对象，则设置
  if (property && target) {
    objTree.set(obj, {
      property,
      target
    });
  }

  return new Proxy(
    enhance(obj || {}, { property, target, recursive }),
    Object.create(ProxyHandler)
  );
}
