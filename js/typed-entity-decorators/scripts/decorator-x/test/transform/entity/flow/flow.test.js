// @flow

import { flowToDecorator } from '../../../../src/transform/entity/flow/flow';
const path = require('path');

test('测试从 Flow 中提取出数据类型并且转化为 Swagger 接口类', () => {
  flowToDecorator(
    path.join(__dirname, './TestEntity.js'),
    path.join(__dirname, './TestEntity.transformed.js'),
  ).then(
    codeStr => {
      console.log(codeStr);
    },
    err => {
      console.error(err);
    }
  );
});
