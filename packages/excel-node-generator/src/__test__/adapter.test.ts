import { WorkbookDO, WorksheetCellDO, WorksheetDO } from '@m-fe/excel-schema';

import { TestData } from './data';

export function adapter(data: TestData) {
  const cells: WorksheetCellDO[] = [];

  // 添加所有的 Cell

  const sheet = new WorksheetDO({
    name: '对账单',
    properties: {
      defaultColWidth: 22,
      defaultRowHeight: 20,
      defaultAlignment: {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true,
      },
    },
  });

  const workbook = new WorkbookDO({
    creator: 'Unionfab',
    lastModifiedBy: 'Unionfab',
  });
}
