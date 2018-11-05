# 数据类型映射表

| 通用数据类型   | Swagger 映射类型 | JavaScript 映射类型 | GraphQL 映射类型 | 数据格式        | 描述                                       |
| -------- | ------------ | --------------- | ------------ | ----------- | ---------------------------------------- |
| integer  | `integer`    | Number          |              | `int32`     | signed 32 bits                           |
| long     | `integer`    | Number          |              | `int64`     | signed 64 bits                           |
| float    | `number`     | Number          |              | `float`     |                                          |
| double   | `number`     | Number          |              | `double`    |                                          |
| string   | `string`     | String          |              |             |                                          |
| byte     | `string`     | String          |              | `byte`      | base64 encoded characters                |
| binary   | `string`     | String          |              | `binary`    | any sequence of octets                   |
| boolean  | `boolean`    | Boolean         |              |             |                                          |
| date     | `string`     | Date            |              | `date`      | As defined by `full-date` - [RFC3339](http://xml2rfc.ietf.org/public/rfc/html/rfc3339.html#anchor14) |
| dateTime | `string`     | Date            |              | `date-time` | As defined by `date-time` - [RFC3339](http://xml2rfc.ietf.org/public/rfc/html/rfc3339.html#anchor14) |
| password | `string`     | String          |              | `password`  | Used to hint UIs the input needs to be obscured. |

