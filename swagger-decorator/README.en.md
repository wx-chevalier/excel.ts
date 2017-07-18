


# swagger-decorator: Node.js 应用中一处注解，多处使用

> - [OpenAPI Specification](http://swagger.io/specification/)
> - [Koa2 Boilerplate](https://parg.co/bvx)

- use yarn or npm to install:
```shell
$ yarn add swagger-decorator

$ yarn add transform-decorators-legacy -D
```

- import `wrappingKoaRouter` and wrap the router created by koa-router:
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

- define Controller and use decorator to attach description for api:

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

- decorate the Entity:
```javascript
// @flow

import { entityProperty } from "swagger-decorator";


export default class User {
  
  @entityProperty({
    type: "integer",
    description: "user id, auto-generated",
    required: false
  })
  id: string = 0;

  @entityProperty({
    type: "string",
    description: "user name, 3~12 characters",
    required: true
  })
  name: string = "name";

  friends: [number] = [1];

  properties: {
    address: string
  } = {
    address: "address"
  };
}
```

- run your application and open swagger docs (PS. swagger-decorator contains Swagger UI):
```text
/swagger
```
![](https://coding.net/u/hoteam/p/Cache/git/raw/master/2017/6/1/WX20170617-172651.png)
```text
/swagger/api.json
```
![](https://coding.net/u/hoteam/p/Cache/git/raw/master/2017/6/1/WX20170617-172707.png)

