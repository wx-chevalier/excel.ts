// @flow

import { flowToDecorator } from "../../../../src/transform/entity/flow/flow";

let fileName =
  "/Users/apple/Workspace/Repo/swagger-decorator/test/transform/entity/flow/";

flowToDecorator(
  fileName + "TestEntity.js",
  fileName + "TestEntity.transformed.js"
).then(
  codeStr => {
    console.log(codeStr);
  },
  err => {
    console.error(err);
  }
);
