import { BaseEntity, isValidArray } from '@m-fe/utils';

import { WorksheetDO } from './WorksheetDO';

export interface WorkbookProperties {
  /**
   * Set workbook dates to 1904 date system
   */
  date1904: boolean;
}

/** Excel 文件对象 */
export class WorkbookDO extends BaseEntity<WorkbookDO> {
  /** 基础属性 */
  creator: string;
  lastModifiedBy: string;
  lastPrinted: string;
  created: string;
  modified: string;
  company: string;
  manager: string;
  title: string;
  subject: string;
  keywords: string;
  category: string;
  description: string;
  language: string;
  revision: string;
  contentStatus: string;
  themes: string[];

  properties: WorkbookProperties;

  /** 内容属性 */
  sheets: WorksheetDO[] = [];

  constructor(data: Partial<WorkbookDO> = {}) {
    super(data);

    if (isValidArray(data.sheets)) {
      this.sheets = data.sheets.map(s => new WorksheetDO(s));
    }
  }
}
