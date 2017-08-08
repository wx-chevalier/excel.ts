
![](https://coding.net/u/hoteam/p/Cache/git/raw/master/2017/6/1/noun_28890_cc.png)
[![npm version](https://badge.fury.io/js/decorator-x.svg)](https://badge.fury.io/js/decorator-x)

中文版本 | [English Version](https://github.com/wxyyxc1992/Modern-JavaScript-Entity/blob/master/decorator-x/README.en.md)

> [基于 decorator-x 的自动实体类构建与 Swagger 接口文档生成](https://zhuanlan.zhihu.com/p/27941329)是笔者对于开源项目[ decorator-x ](https://github.com/wxyyxc1992/decorator-x)的描述，对于不反感使用注解的项目中利用 decorator-x 添加合适的实体类或者接口类注解，从而实现支持嵌套地实体类校验与生成、Sequelize 等 ORM 模型生成、基于 Swagger 的接口文档生成等等功能。如果有对 JavaScript 语法使用尚存不明的可以参考[ JavaScript 学习与实践资料索引](https://parg.co/bMI)或者[现代 JavaScript 开发：语法基础与实践技巧](https://parg.co/b1c)系列文章。

# decorator-x: 一处注解，多处使用

decorator-x 的初衷是为了简化 JavaScript 应用开发，笔者在编写 JavaScript 应用（Web 前端 & Node.js）时发现我们经常需要重复地创建实体类、添加注释或者进行类型校验，decorator-x 希望能够让开发者一处注解、多处使用。需要强调的是，在笔者多年的 Java 应用开发中也感受到，过多过度的注解反而会大大削弱代码的可读性，因此笔者也建议应该在合适的时候舒心地使用 
decorator-x，而不是本末倒置，一味地追求注解覆盖率。decorator-x 已经可以用于实体类生成与校验、Sequelize ORM 实体类生成、面向 Koa 的路由注解与 Swagger 文档自动生成。我们可以使用 yarn 或者 npm 安装 decorator-x 依赖，需要注意的是，因为我们在开发中还会用到注解语法，因此还需要添加 babel-plugin-transform-decorators-legacy 插件以进行语法兼容转化。

```shell

# 使用 npm 安装依赖

$ npm install decorator-x -S

$ npm install babel-plugin-transform-decorators-legacy -D

# 使用 yarn 安装依赖

$ yarn add decorator-x

$ yarn add babel-plugin-transform-decorators-legacy -D

# 导入需要的工具函数
import { 
    wrappingKoaRouter,
    entityProperty,
    ...
} from "decorator-x";
```


具体的使用方法与场景参考：

- [实体类注解：自动校验与对象扩展](./doc/zh/Entity.md)

- [使用 decorator-x 简化 Koa2 中 RESTful API 与 GraphQL 开发]()

# About

## RoadMap

- 引入 [swagger-to-slate](https://github.com/lavkumarv/swagger-to-slate) 以支持 Slate 文档
- 对于初始化生成函数 instantiate 添加 Null Propagation 支持
- 修复实体类自动生成中可能存在的错误
- 复合类型推导
- 接口数据自动校验
