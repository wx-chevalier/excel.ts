// @flow

import { entityProperty } from "../../src/entity/decorator";
import UserProperty from "./UserProperty";
/**
 * Description 用户实体类
 */
export default class User {
  // 编号
  @entityProperty({
    type: "integer",
    description: "user id, auto-generated",
    required: true
  })
  id: string = 0;

  // 姓名
  @entityProperty({
    type: "string",
    description: "user name, 3~12 characters",
    required: false
  })
  name: string = "name";

  // 邮箱
  @entityProperty({
    type: "string",
    description: "user email",
    pattern: "email",
    required: false
  })
  email: string = "email";

  // 属性
  @entityProperty({
    type: UserProperty,
    description: "user property",
    required: false
  })
  property: UserProperty = new UserProperty();
}
