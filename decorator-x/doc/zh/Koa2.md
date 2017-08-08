# 使用 decorator-x 简化 Koa2 中 RESTful API 与 GraphQL 开发

对于 Swagger 文档规范可以参考[ OpenAPI Specification ](http://swagger.io/specification/)，而对于 decorator-x 的实际使用可以参考本项目的[使用示例](https://parg.co/bac)或者[ 基于 Koa2 的 Node.js 应用模板 ](https://parg.co/bvx)。


## 封装路由对象

```javascript
import { wrappingKoaRouter } from "decorator-x";

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
在 UserController 中是负责具体的业务实现，为了避免过多的注解文档对于代码可读性的干扰，笔者建议是将除了路径与描述之外的信息放置到父类中声明；decorator-x 会自动从某个接口类的直接父类中提取出同名方法的描述文档。

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

## 运行应用

- run your application and open swagger docs (PS. decorator-x contains Swagger UI):
```text
/swagger
```
![](https://coding.net/u/hoteam/p/Cache/git/raw/master/2017/6/1/WX20170617-172651.png)
```text
/swagger/api.json
```
![](https://coding.net/u/hoteam/p/Cache/git/raw/master/2017/6/1/WX20170617-172707.png)

