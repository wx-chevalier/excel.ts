// @flow

import { flowToDecorator } from '../../../../src/transform/entity/flow/flow';

test('测试从 Flow 中提取出数据类型并且转化为 Swagger 接口类', () => {
  flowToDecorator('./TestEntity.js', './TestEntity.transformed.js').then(
    codeStr => {
      console.log(codeStr);
    },
    err => {
      console.error(err);
    }
  );
});
