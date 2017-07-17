// @flow

import {
  objTree,
  dispatch,
  dispatchTree,
  isObserveX,
  timer,
  listeners,
  isArray,
  changes,
  isRecrusive
} from '../shared/symbols';

import { defineProp } from '../shared/utils';
import { getAPIs } from '../shared/api';
import { ProxyHandler } from './observe';

const API = getAPIs(listeners);

/**
 * 封装 observe-x 对象，添加部分隐藏属性，并且暴露公共接口
 * @param   {*} obj - anything
 * @param property
 * @param target
 * @param recursive
 * @returns {*} the object received enhanced with some extra properties
 */
export function enhance(
  obj,
  { property = null, target = null, recursive = false } = {}
) {
  // 为对象添加部分内置属性
  Object.assign(obj, {
    [changes]: new Map(),
    [timer]: null,
    [isObserveX]: true,
    [isRecrusive]: recursive,
    [dispatch](property, value, oldValue = undefined) {
      if (listeners.has(obj)) {
        // 去除原变化
        clearImmediate(obj[timer]);

        // 将变动添加到该对象的属性中
        obj[changes].set(property, {
          value,
          oldValue
        });

        // 这里使用了 setImmediate 是为了保证在每次 EventLoop 结束的时候执行回调
        obj[timer] = setImmediate(function() {
          listeners.get(obj).forEach(function(fn) {
            fn(obj[changes]);
          });

          // 清空暂存的变化对象
          obj[changes].clear();
        });
      }
    },
    /**
     * Description 在需要递归触发的时候，判断某个对象是否包含父对象，如果包含则触发
     * @param property
     * @param value
     * @param oldValue
     */
    [dispatchTree](property, value, oldValue = undefined) {
      obj[dispatch](property, value, oldValue);

      let parent = objTree.get(obj);

      // 如果存在父属性，则递归通知
      while (parent) {
        parent.target[dispatchTree](parent.property, value);

        parent = objTree.get(parent);
      }
    }
  });

  // 将暴露出去的公共接口绑定到原始对象
  Object.keys(API).forEach(function(key) {
    defineProp(obj, key, API[key].bind(obj));
  });

  // 重新映射值与方法，这里对于数组进行了额外处理
  if (Array.isArray(obj)) {
    obj[isArray] = true;
    // 重新映射数组初始值
    obj.forEach(function(item, i) {
      obj[i] = null; // 强制重置

      // 这里为了避免数组中存在对象值，因此依次对于数组中的对象进行设置操作
      // 数组可以看做属性为下标的对象
      ProxyHandler.set(obj, i, item);
    });
  }

  return obj;
}
