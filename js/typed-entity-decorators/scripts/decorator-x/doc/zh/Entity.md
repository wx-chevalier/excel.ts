

# 实体类注解

decorator-x 的核心 API 即是对于实体类的注解，该注解不会改变实体类的任何属性表现，只是会将注解限定的属性特性记录在内置的 innerEntityObject 单例中以供后用。属性注解 entityProperty 的方法说明如下：

```javascript
/**
 * Description 创建某个属性的描述
 * @param type 基础类型 self - 表示为自身
 * @param description 描述
 * @param required 是否为必要参数
 * @param defaultValue 默认值
 * @param pattern
 * @param primaryKey 是否为主键
 * @returns {Function}
 */
export function entityProperty({
  // 生成接口文档需要的参数
  type = "string",
  description = "",
  required = false,
  defaultValue = undefined,

  // 进行校验所需要的参数
  pattern = undefined,

  // 进行数据库连接需要的参数
  primaryKey = false
}) {}
```

简单的用户实体类注解如下，这里的数据类型 type 支持 Swagger 默认的字符格式的类型描述，也支持直接使用 JavaScript 类名或者 JavaScript 数组。

```javascript
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

export default class UserProperty {
  // 朋友列表
  @entityProperty({
    type: ["number"],
    description: "user friends, which is user ids",
    required: false
  })
  friends: [number];
}

```

Swagger 内置数据类型定义：

## 实例生成与校验

实体类定义完毕之后，我们首先可以使用 instantiate 函数为实体类生成实例；不同于直接使用 new 关键字创建，instantiate 能够根据指定属性的数据类型或者格式进行校验，同时能够迭代生成嵌套地子对象。

```javascript
/**
 * Description 从实体类中生成对象，并且进行数据校验；注意，这里会进行递归生成，即对实体类对象同样进行生成
 * @param EntityClass 实体类
 * @param data 数据对象
 * @param ignore 是否忽略校验
 * @param strict 是否忽略非预定义类属性
 * @throws 当校验失败，会抛出异常
 */
export function instantiate(
  EntityClass: Function,
  data: {
    [string]: any
  },
  { ignore = false, strict = true }: { ignore: boolean, strict: boolean } = {}
): Object {}
```

这里为了方便描述使用 Jest 测试用例说明不同的使用场景：

```javascript
describe("测试实体类实例化函数", () => {
  test("测试 User 类实例化校验", () => {
    expect(() => {
      instantiate(User, {
        name: "name"
      }).toThrowError(/validate fail!/);
    });

    let user = instantiate(User, {
      id: 0,
      name: "name",
      email: "a@q.com"
    });

    // 判断是否为 User 实例
    expect(user).toBeInstanceOf(User);
  });

  test("测试 ignore 参数可以允许忽略校验", () => {
    instantiate(
      User,
      {
        name: "name"
      },
      {
        ignore: true
      }
    );
  });

  test("测试 strict 参数可以控制是否忽略额外参数", () => {
    let user = instantiate(
      User,
      {
        name: "name",
        external: "external"
      },
      {
        ignore: true,
        strict: true
      }
    );

    expect(user).not.toHaveProperty("external", "external");

    user = instantiate(
      User,
      {
        name: "name",
        external: "external"
      },
      {
        ignore: true,
        strict: false
      }
    );

    expect(user).toHaveProperty("external", "external");
  });
});

describe("测试嵌套实例生成", () => {
  test("测试可以递归生成嵌套实体类", () => {
    let user = instantiate(User, {
      id: 0,
      property: {
        friends: [0]
      }
    });

    expect(user.property).toBeInstanceOf(UserProperty);
  });
});
```


## Sequelize 模型生成

[Sequelize](http://docs.sequelizejs.com/) 是 Node.js 应用中常用的 ORM 框架，decorator-x 提供了 generateSequelizeModel 函数以方便从实体类中利用现有的信息生成 Sequelize 对象模型；generateSequelizeModel 的第一个参数输入实体类，第二个参数输入需要覆写的模型属性，第三个参数设置额外属性，譬如是否需要将驼峰命名转化为下划线命名等等。

```javascript
const originUserSequelizeModel = generateSequelizeModel(
  User,
  {
    _id: {
      primaryKey: true
    }
  },
  {
    mappingCamelCaseToUnderScore: true
  }
);

const UserSequelizeModel = sequelize.define(
  "b_user",
  originUserSequelizeModel,
  {
    timestamps: false,
    underscored: true,
    freezeTableName: true
  }
);

UserSequelizeModel.findAll({
  attributes: { exclude: [] }
}).then(users => {
  console.log(users);
});
```

## 从 Flow 类型声明中自动生成注解

笔者习惯使用 Flow 作为 JavaScript 的静态类型检测工具，因此笔者添加了 flowToDecorator 函数以自动地从 Flow 声明的类文件中提取出类型信息；内部原理参考[现代 JavaScript 开发：语法基础与实践技巧](https://parg.co/b1c) 一书中的[ JavaScript 语法树与代码转化](https://parg.co/baS)章节。该函数的使用方式为：
```
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

```
这里对应的 TestEntity 为：
```
// @flow

import AnotherEntity from "./AnotherEntity";

class Entity {
  // Comment
  stringProperty: string = 0;

  classProperty: Entity = null;

  rawProperty;

  @entityProperty({
    type: "string",
    description: "this is property description",
    required: true
  })
  decoratedProperty;
}

```
转化后的实体类为：
```
// @flow

import { entityProperty } from 'decorator-x';

import AnotherEntity from './AnotherEntity';

class Entity {
  // Comment
  @entityProperty({
    type: 'string',
    required: false,
    description: 'Comment'
  })
  stringProperty: string = 0;

  @entityProperty({
    type: Entity,
    required: false
  })
  classProperty: Entity = null;

  @entityProperty({
    type: 'string',
    required: false
  })
  rawProperty;

  @entityProperty({
    type: 'string',
    description: 'this is property description',
    required: true
  })
  decoratedProperty;
}

```