// @flow

const fs = require("fs");
const { promisify } = require("util");
const readFileAsync = promisify(fs.readFile); // (A)

const babel = require("babel-core");

import {
  extractFlowTypeFromClassProperty,
  generateDecoratorWithObjectParams,
  generateImportDeclaration
} from "../../../internal/babel/ast";

export function flowToDecoratorPlugin(babel) {
  const { types: t } = babel;

  return {
    name: "flow-to-decorator-ast-transform", // not required
    visitor: {
      Program(path) {
        // 添加头部导入库
        path.node.body.splice(
          0,
          0,
          generateImportDeclaration("{ entityProperty }", "swagger-decorator")
        );
      },

      ClassProperty(path, state) {
        // 判断当前是否已经存在注解，如果不存在则动态创建
        if (!path.node.decorators) {
          let typeAndValue = extractFlowTypeFromClassProperty(path.node);

          path.node.decorators = [
            generateDecoratorWithObjectParams(
              "entityProperty",
              {
                type: typeAndValue.type,
                required: typeAndValue.value === "undefined"
              },
              typeAndValue.comment
            )
          ];
        }
      }
    }
  };
}

/**
 * Description 执行 Babel 转换过程
 * @param fileName
 * @param destFileName
 * @returns {Promise.<void>}
 */
export async function flowToDecorator(
  fileName: string,
  destFileName: string = undefined
) {
  let codeStr = (await readFileAsync(fileName)).toString();

  // use our plugin to transform the source
  const out = babel.transform(codeStr, {
    plugins: [
      "syntax-flow",
      "syntax-class-properties",
      "syntax-decorators",
      flowToDecoratorPlugin
    ]
  });

  if (destFileName) {
    fs.writeFileSync(destFileName, out.code);
  }

  return out.code;
}
