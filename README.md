
中文版本 | English Version

> [基于 swagger-decorator 的自动实体类构建与 Swagger 接口文档生成]()，对于不反感使用注解的项目中利用 swagger-decorator 添加合适的实体类或者接口类注解，从而实现支持嵌套地实体类校验与生成、Sequelize 等 ORM 模型生成、基于 Swagger 的接口文档生成等等功能。

# swagger-decorator: 一处注解，多处使用

swagger-decorator 的初衷是为了简化 JavaScript 应用开发，笔者在编写 JavaScript 应用（Web 前端 & Node.js）时发现我们经常需要重复地创建实体类、添加注释或者进行类型校验，swagger-decorator 希望能够让开发者一处注解、多处使用。需要强调的是，在笔者多年的 Java 应用开发中也感受到，过多过度的注解反而会大大削弱代码的可读性，因此笔者也建议应该在合适的时候舒心地使用 
swagger-decorator，而不是本末倒置，一味地追求注解覆盖率。swagger-decorator 已经可以用于实体类生成与校验、Sequelize ORM 实体类生成、面向 Koa 的路由注解与 Swagger 文档自动生成。我们可以使用 yarn 或者 npm 安装 swagger-decorator 依赖，需要注意的是，因为我们在开发中还会用到注解语法，因此还需要添加 babel-plugin-transform-decorators-legacy 插件以进行语法兼容转化。

```shell

# 使用 npm 安装依赖

$ npm install swagger-decorator -S

$

# 使用 yarn 安装依赖

$ yarn add swagger-decorator

$ yarn add babel-plugin-transform-decorators-legacy -D

# 导入需要的工具函数
import { 
    wrappingKoaRouter,
    entityProperty,
    ...
} from "swagger-decorator";
```


# 实体类注解

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

数据类型支持：

| Common Name | [`type`](http://swagger.io/specification/#dataTypeType) | [`format`](http://swagger.io/specification/#dataTypeFormat) | Comments                                 |
| ----------- | ---------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| integer     | `integer`                                | `int32`                                  | signed 32 bits                           |
| long        | `integer`                                | `int64`                                  | signed 64 bits                           |
| float       | `number`                                 | `float`                                  |                                          |
| double      | `number`                                 | `double`                                 |                                          |
| string      | `string`                                 |                                          |                                          |
| byte        | `string`                                 | `byte`                                   | base64 encoded characters                |
| binary      | `string`                                 | `binary`                                 | any sequence of octets                   |
| boolean     | `boolean`                                |                                          |                                          |
| date        | `string`                                 | `date`                                   | As defined by `full-date` - [RFC3339](http://xml2rfc.ietf.org/public/rfc/html/rfc3339.html#anchor14) |
| dateTime    | `string`                                 | `date-time`                              | As defined by `date-time` - [RFC3339](http://xml2rfc.ietf.org/public/rfc/html/rfc3339.html#anchor14) |
| password    | `string`                                 | `password`                               | Used to hint UIs the input needs to be obscured. |


## 实例生成与校验
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

## 实体类转化与生成工具

### 从 Flow 类型声明中自动生成注解


# 接口注解与 Swagger 文档生成

对于 Swagger 文档规范可以参考[ OpenAPI Specification ](http://swagger.io/specification/)，而对于 swagger-decorator 的实际使用可以参考本项目的[使用示例]()或者[ 基于 Koa2 的 Node.js 应用模板 ](https://parg.co/bvx)。


## 封装路由对象

```javascript
import { wrappingKoaRouter } from "swagger-decorator";

...

const Router = require("koa-router");

const router = new Router();

wrappingKoaRouter(router, "localhost:8080", "/api", {
  title: "Node Server Boilerplate",
  version: "0.0.1",
  description: "Koa2, koa-router,Webpack"
});

// define default route
router.get("/", async function(ctx, next) {
  ctx.body = { msg: "Node Server Boilerplate" };
});

// use scan to auto add method in class
router.scan(UserController);
```

## 定义接口类

```javascript
export default class UserController extends UserControllerDoc {
  @apiRequestMapping("get", "/users")
  @apiDescription("get all users list")
  static async getUsers(ctx, next): [User] {
    ctx.body = [new User()];
  }

  @apiRequestMapping("get", "/user/:id")
  @apiDescription("get user object by id, only access self or friends")
  static async getUserByID(ctx, next): User {
    ctx.body = new User();
  }

  @apiRequestMapping("post", "/user")
  @apiDescription("create new user")
  static async postUser(): number {
    ctx.body = {
      statusCode: 200
    };
  }
}
```

```javascript

export default class UserControllerDoc {
  @apiResponse(200, "get users successfully", [User])
  static async getUsers(ctx, next): [User] {}

  @pathParameter({
    name: "id",
    description: "user id",
    type: "integer",
    defaultValue: 1
  })
  @queryParameter({
    name: "tags",
    description: "user tags, for filtering users",
    required: false,
    type: "array",
    items: ["string"]
  })
  @apiResponse(200, "get user successfully", User)
  static async getUserByID(ctx, next): User {}

  @bodyParameter({
    name: "user",
    description: "the new user object, must include user name",
    required: true,
    schema: User
  })
  @apiResponse(200, "create new user successfully", {
    statusCode: 200
  })
  static async postUser(): number {}
}

```

## 应用运行

- run your application and open swagger docs (PS. swagger-decorator contains Swagger UI):
```text
/swagger
```
![](https://coding.net/u/hoteam/p/Cache/git/raw/master/2017/6/1/WX20170617-172651.png)
```text
/swagger/api.json
```
![](https://coding.net/u/hoteam/p/Cache/git/raw/master/2017/6/1/WX20170617-172707.png)



# About

## RoadMap

- 修复实体类自动生成中可能存在的错误
- 复合类型推导
- 接口数据自动校验
