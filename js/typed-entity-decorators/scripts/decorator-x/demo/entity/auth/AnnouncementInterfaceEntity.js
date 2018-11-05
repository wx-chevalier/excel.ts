// @flow

import { entityProperty } from "../../../src/entity/decorator/decorator";

/**
 * Description 公告列表实体类
 */
export default class AnnouncementInterfaceEntity {
  // 数据
  @entityProperty({
    type: "JSON",
    description: "字段及数据",
    required: true
  })
  meta: Object = [];

  // 数据
  @entityProperty({
    type: "JSON",
    description: `数据示例：
      [
        {
          title: "（雨花区）雨花西路244号小区整治出新工程施工",
          uuid: "ab7ed1171491496b54f78ee8e5be3ce4",
          announce_date: "2017-07-06T16:00:00.000Z",
          properties: [
            "雨花西路244号小区整治出新工程",
            "施工",
            "AYH170230-01SG",
            "201.70",
            "2017-07-07"
          ]
        }
      ]
    `,
    required: false
  })
  data: Object = [];
}
