// @flow
import type { InnerEntityProperty } from '../internal/types';

// 定义所有的内部原始类型
export const innerPrimitiveTypes = [
  'integer',
  'float',
  'double',
  'number',
  'string',
  'boolean',
  'date'
];

/**
 * Description 判断是否为原始类型或者原始类型的数组
 * @param type
 * @return {boolean}
 */
export function isPrimitive(type) {
  if (Array.isArray(type)) {
    return innerPrimitiveTypes.includes(type[0]);
  } else {
    return innerPrimitiveTypes.includes(type);
  }
}

/**
 * Description 根据输入的实体类类型与内置的实体对象推测出实体属性
 * @param EntityClass
 * @param innerEntityObject
 * @returns {*}
 */
export function inferenceEntityProperties(
  EntityClass,
  innerEntityObject
): InnerEntityProperty {
  let entityName = EntityClass.name;

  // 构建内部实例以获取默认值
  let entityInstance = new EntityClass();

  // 对象包含的自有属性
  let propertyNames = Object.getOwnPropertyNames(entityInstance);

  // 获取内置对象中定义的 Properties
  // @Warning 这里本来是一层浅复制，导致了属性错乱，因此改成多层复制
  let properties = {};

  // 遍历所有已经设置过的用户属性
  if (innerEntityObject[entityName].properties) {
    let settledProperties = innerEntityObject[entityName].properties;

    for (let settledPropertyName of Object.keys(settledProperties)) {
      properties[settledPropertyName] = Object.assign(
        {},
        settledProperties[settledPropertyName]
      );
    }
  }

  // 遍历所有没有使用注解的属性
  for (let propertyName of propertyNames) {
    if (
      innerEntityObject[entityName] &&
      !(propertyName in innerEntityObject[entityName].properties)
    ) {
      // 这里进行类型推测

      properties[propertyName] = {
        // 描述即为属性名
        description: propertyName,
        // 推导类型
        type: inferenceType(entityInstance[propertyName]),
        // 设置默认值
        defaultValue: entityInstance[propertyName]
      };
    } else {
      // 判断是否有默认取值
      properties[propertyName].defaultValue !== undefined ||
        (properties[propertyName].defaultValue = entityInstance[propertyName]);
    }
  }

  return properties;
}

/**
 * Description 类型推测
 * @param obj
 * @returns {*}
 */
export function inferenceType(obj: any) {
  if (Array.isArray(obj)) {
    return 'array';
  } else {
    return typeof obj;
  }
}
