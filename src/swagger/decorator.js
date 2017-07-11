// @flow
import { innerAPIObject } from "../internal/singleton";
import { buildDefinitions } from "./definitions";

/**
 * Description 设置请求路径
 * @param method
 * @param path
 * @returns {Function}
 */
export function apiRequestMapping(method: string, path: string) {
  return function(target, key, descriptor) {
    let apiKey = `${target.name}-${key}`;

    // 设置请求方法
    descriptor.value.method = method;
    // 设置请求路径
    descriptor.value.path = path;

    _initializeInnerAPIObject(target, key, descriptor);

    innerAPIObject[apiKey].requestMapping = {
      method,
      path
    };

    return descriptor;
  };
}

/**
 * Description 接口描述
 * @param description
 * @param produces
 * @returns {Function}
 */
export function apiDescription(
  description: string,
  produces: [string] = ["application/json"]
) {
  return function(target, key, descriptor) {
    let apiKey = `${target.name}-${key}`;

    _initializeInnerAPIObject(target, key, descriptor);

    innerAPIObject[apiKey].description = {
      description,
      produces
    };

    return descriptor;
  };
}

/**
 * 路径参数
 * @param name
 * @param description
 * @param type
 * @param defaultValue
 * @returns {Function}
 */
export function pathParameter({
  name,
  description,
  type,
  defaultValue
}: {
  name: string,
  description: string,
  type: string,
  defaultValue: any
}) {
  return function(target, key, descriptor) {
    let apiKey = `${target.name}-${key}`;

    _initializeInnerAPIObject(target, key, descriptor);

    innerAPIObject[apiKey].pathParameter ||
      (innerAPIObject[apiKey].pathParameter = []);

    innerAPIObject[apiKey].pathParameter.splice(0, 0, {
      name,
      description,
      type,
      in: "path",
      required: true,
      default: defaultValue
    });

    return descriptor;
  };
}

/**
 * Description 查询参数相关注释
 * @param name
 * @param description
 * @param required
 * @param type
 * @param items
 * @param defaultValue
 * @returns {Function}
 */
export function queryParameter({
  name,
  description,
  required,
  type,
  items,
  defaultValue
}: {
  name: string,
  description: string,
  required: boolean,
  type: any,
  items: any
}) {
  return function(target, key, descriptor) {
    let apiKey = `${target.name}-${key}`;

    _initializeInnerAPIObject(target, key, descriptor);

    innerAPIObject[apiKey].queryParameter ||
      (innerAPIObject[apiKey].queryParameter = []);

    innerAPIObject[apiKey].queryParameter.splice(0, 0, {
      name,
      description,
      required,
      type,
      items,
      in: "query",
      default: defaultValue
    });

    return descriptor;
  };
}

/**
 * Description
 * @param name
 * @param description
 * @param required
 * @param schema
 * @returns {Function}
 */
export function bodyParameter({
  name,
  description,
  required,
  schema
}: {
  name: string,
  description: string,
  required: boolean,
  schema: any
}) {
  return function(target, key, descriptor) {
    let apiKey = `${target.name}-${key}`;

    _initializeInnerAPIObject(target, key, descriptor);

    innerAPIObject[apiKey].bodyParameter ||
      (innerAPIObject[apiKey].bodyParameter = []);

    innerAPIObject[apiKey].bodyParameter.splice(0, 0, {
      name,
      description,
      required,
      schema,
      in: "body"
    });

    // 根据传入的 Schema 构建定义
    buildDefinitions(schema);

    return descriptor;
  };
}

/**
 * Description 设置请求响应
 * @param statusCode
 * @param description
 * @param schema
 * @returns {Function}
 */
export function apiResponse(
  statusCode: number,
  description: string,
  schema: any
) {
  return function(target, key, descriptor) {
    let apiKey = `${target.name}-${key}`;

    _initializeInnerAPIObject(target, key, descriptor);

    innerAPIObject[apiKey].responses || (innerAPIObject[apiKey].responses = []);

    innerAPIObject[apiKey].responses.splice(0, 0, {
      statusCode,
      description,
      schema
    });

    // 根据传入的 Schema 构建定义
    buildDefinitions(schema);

    return descriptor;
  };
}

/**
 * Description 初始化内部存放 API 信息的对象
 * @param target
 * @param key
 * @param descriptor
 * @private
 */
function _initializeInnerAPIObject(target, key, descriptor) {
  let apiKey = `${target.name}-${key}`;

  if (!innerAPIObject[apiKey]) {
    innerAPIObject[apiKey] = {};
    innerAPIObject[apiKey].instance = {
      target,
      key,
      descriptor
    };
  }
}
