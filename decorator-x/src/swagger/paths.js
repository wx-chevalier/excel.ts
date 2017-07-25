// @flow
const pathToRegexp = require("path-to-regexp");
import { innerAPIObject } from "../internal/singleton";
import { swaggerJSON } from "./template/swagger.json";

// 标志是否编译完毕
let hasBuilt = false;

/**
 * Description 构建 Swagger JSON 文件
 */
export function buildSwaggerJSON() {
  if (hasBuilt) {
    return;
  }

  // 初始化请求路径
  swaggerJSON["paths"] = {};

  // 遍历所有的内部对象
  for (let key of Object.keys(innerAPIObject)) {
    let value = innerAPIObject[key];

    let parentKey = `${value.instance.target.__proto__.name}-${value.instance
      .key}`;

    // 判断 requestMapping 是否存在，不存在则表示为父类
    if (!value.requestMapping) {
      continue;
    }

    // 将 :parameter 替换为 {parameter}
    let requestPath = _convertParameterInPath(value.requestMapping.path);

    swaggerJSON["paths"][requestPath] = {};

    swaggerJSON["paths"][requestPath][value.requestMapping.method] = {};

    let apiDoc = swaggerJSON["paths"][requestPath][value.requestMapping.method];

    // 构建基本描述
    apiDoc.description = value.description.description;

    apiDoc.produces = value.description.produces;

    apiDoc.parameters = [];

    const merge = key => {
      return []
        .concat(
          innerAPIObject[parentKey] ? innerAPIObject[parentKey][key] || [] : []
        )
        .concat(value[key] || []);
    };

    // 构建路径参数
    // 这里需要整合父类的声明
    let pathParameter = merge("pathParameter");

    for (let param of pathParameter) {
      apiDoc.parameters.push({
        ...param,
        collectionFormat: "csv"
      });
    }

    // 构建查询参数
    let queryParameter = merge("queryParameter");

    for (let param of queryParameter) {
      apiDoc.parameters.push({
        ...param,
        items: {
          type:
            param.items && param.items.length > 0 ? param.items[0] : undefined
        },
        collectionFormat: "csv"
      });
    }

    // 构建请求体参数
    let bodyParameter = merge("bodyParameter");

    for (let param of bodyParameter) {
      apiDoc.parameters.push({
        ...param,
        schema: _convertSchema(param.schema)
      });
    }

    apiDoc.responses = {};

    // 判断是直接获取该类的响应值注解还是获取父类的响应值注解
    let responses = merge("responses");

    // 构建返回值
    for (let resp of responses) {
      apiDoc.responses[resp.statusCode] = {
        description: resp.description,
        schema: _convertSchema(resp.schema)
      };
    }
  }

  hasBuilt = true;
}

export function _convertSchema(schema: any) {
  let convertedSchema;

  if (Array.isArray(schema) && schema.length > 0) {
    convertedSchema = {
      type: "array",
      items: {
        $ref: `#/definitions/${schema[0].name}`
      }
    };
  }

  if (typeof schema === "function") {
    convertedSchema = {
      $ref: `#/definitions/${schema.name}`
    };
  }

  return convertedSchema;
}

/**
 * Description
 * @param path
 * @private
 */
export function _convertParameterInPath(path: String) {
  let segments = [];

  const re = pathToRegexp(path, segments);

  if (segments.length === 0) {
    return path;
  } else {
    let convertedPath = path;

    for (let segment of segments) {
      convertedPath = convertedPath.replace(
        new RegExp(`${segment.prefix}:${segment.name}`, "g"),
        `${segment.prefix}{${segment.name}}`
      );
    }

    return convertedPath;
  }
}
