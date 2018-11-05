// @flow

import AnnouncementInterfaceEntity from "../entity/auth/AnnouncementInterfaceEntity";
import { apiResponse } from "../../src/swagger/decorator";
export default class AnnouncementControllerDoc {
  @apiResponse(200, "get users successfully", [AnnouncementInterfaceEntity])
  static async getAnnouncements(ctx, next): [AnnouncementInterfaceEntity] {}
}
