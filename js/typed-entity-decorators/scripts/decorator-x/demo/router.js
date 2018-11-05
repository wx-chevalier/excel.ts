// @flow

const koaBody = require('koa-body');
import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa';
import { graphqlSchema } from './graphql/graphql';
import UserController from './controller/UserController';
import { wrappingKoaRouter } from '../src/transform/router/koa-router';
import AnnouncementController from './controller/AnnouncementController';
const Router = require('koa-router');

const router = new Router();

// koaBody is needed just for POST.
router.post('/graphql', koaBody(), graphqlKoa({ schema: graphqlSchema }));
router.get('/graphql', graphqlKoa({ schema: graphqlSchema }));

router.post('/graphiql', graphiqlKoa({ endpointURL: '/graphql' }));
router.get('/graphiql', graphiqlKoa({ endpointURL: '/graphql' }));

// 定义默认的根路由
router.get('/', async function(ctx, next) {
  ctx.body = { msg: 'Node Server Boilerplate' };
});

// 封装原有的 koa-router 对象
wrappingKoaRouter(router, 'localhost:8080', '/api', {
  title: 'Node Server Boilerplate',
  version: '0.0.1',
  description: 'Koa2, koa-router,Webpack'
});

//定义用户处理路由
router.scan(UserController);
router.scan(AnnouncementController);

//默认导出路由配置
export default router;
