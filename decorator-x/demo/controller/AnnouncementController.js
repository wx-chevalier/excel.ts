// @flow

import AnnouncementControllerDoc from "./AnnouncementControllerDoc";
import {apiDescription, apiRequestMapping} from "../../src/swagger/decorator";
import AnnouncementInterfaceEntity from "../entity/auth/AnnouncementInterfaceEntity";

export default class AnnouncementController extends AnnouncementControllerDoc {
  @apiRequestMapping(
    "get",
    "/announcements/:column_code/:menu_code/:category_code"
  )
  @apiDescription("根据目录结构获取公告列表信息。")
  static async getAnnouncements(ctx, next): [AnnouncementInterfaceEntity] {}
}
