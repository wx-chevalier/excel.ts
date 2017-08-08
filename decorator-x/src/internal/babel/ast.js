// @flow

import { innerPrimitiveTypes } from '../../entity/type';
/**
 * Description 生成导入语句
 * @param specifiers
 * @param source
 * @returns {{type: string, specifiers: [*], importKind: string, source: {type: string, value: string, rawValue: string, raw: string}}}
 */
export function generateImportDeclaration(specifiers: string, source: string) {
  return {
    type: 'ImportDeclaration',
    specifiers: [
      {
        type: 'ImportDefaultSpecifier',
        local: {
          type: 'Identifier',
          name: specifiers
        }
      }
    ],
    importKind: 'value',
    source: {
      type: 'StringLiteral',
      value: source,
      rawValue: source,
      raw: `"${source}"`
    }
  };
}

/**
 * Description 生成以对象参数形式传入的装饰器
 * @param calleeName
 * @param objectParams
 * @param description
 * @returns {{type: string, expression: {type: string, callee: {type: string, name: string}, arguments: [*]}}}
 */
export function generateDecoratorWithObjectParams(
  calleeName: string,
  objectParams: string,
  description
) {
  let properties = [];

  // 如果存在注释，则添加
  if (description) {
    objectParams.description = description;
  }

  for (let key of Object.keys(objectParams)) {
    let value = objectParams[key];

    if (!innerPrimitiveTypes.includes(value) && key !== 'description') {
      value = {
        type: 'Identifier',
        name: value
      };
    } else {
      value = {
        type: 'StringLiteral',
        value
      };
    }

    properties.push({
      type: 'ObjectProperty',
      method: false,
      shorthand: false,
      computed: false,
      key: {
        type: 'Identifier',
        name: key
      },
      value
    });
  }

  return {
    type: 'Decorator',
    expression: {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: calleeName
      },
      arguments: [
        {
          type: 'ObjectExpression',
          properties
        }
      ]
    }
  };
}

/**
 * Description 从 ClassProperty 中抽取出 Flow 类型以及值信息
 * @param classProperty
 */
export function extractFlowTypeFromClassProperty(classProperty) {
  let value;

  // 首先获取默认值
  if (classProperty.value) {
    value = classProperty.value.value;
  }

  // 从 Flow 中获取类型
  let type = 'string';

  // 判断是否有类型声明
  if (classProperty.typeAnnotation) {
    let typeAnnotation = classProperty.typeAnnotation.typeAnnotation;

    if (typeAnnotation.type === 'NumberTypeAnnotation') {
      type = 'number';
    } else if (typeAnnotation.type === 'StringTypeAnnotation') {
      type = 'string';
    } else if (typeAnnotation.type === 'GenericTypeAnnotation') {
      type = typeAnnotation.id.name;
    } else {
      return 'string;';
    }
  }

  let comment;

  // 判断是否有注释
  if (classProperty.leadingComments) {
    comment = classProperty.leadingComments
      .reduce((value, obj) => {
        return `${value}\n${obj.value}`;
      }, '')
      .trim();
  }

  return {
    type,
    value,
    comment
  };
}
