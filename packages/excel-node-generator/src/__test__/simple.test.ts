import {
  WorkbookDO,
  WorksheetCellDO,
  WorksheetDO,
  WorksheetRowDO,
} from '@m-fe/excel-schema';
import * as S from '@m-fe/utils';
import dayjs from 'dayjs';
import _ from 'lodash';
import path from 'path';

import { ExcelGenerator } from '../exceljs';

jest.setTimeout(60 * 1000 * 1000);

describe('Test adapter', () => {
  it('对账单', async () => {
    const rows: Partial<WorksheetRowDO>[] = [
      { number: 1, height: 100 },
      { number: 2, height: 25 },
    ];

    // 添加所有的 Cell
    const cells: WorksheetCellDO[] = [
      new WorksheetCellDO({
        address: 'A1',
        value: {
          src:
            'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/e6/df3c8857c34a3035e22dfe3c182004/decompressed-1-UTR6800-JP-数量5-12-1软胶打印.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
          tl: { col: 1.5, row: 1.5 },
          width: 100,
          height: 500,
        },
      }),
      new WorksheetCellDO({
        address: 'A1',
        mergedCellAddress: 'H1',
        style: { alignment: { horizontal: 'left', wrapText: true } },
        value: {
          richText: [
            {
              font: {
                size: 16,
                name: '宋体',
              },
              text: `名字 \n`,
            },
            {
              text: '\n',
            },
            {
              text: '\n',
            },

            {
              font: {
                size: 12,
              },
              text: `导出时间：${dayjs().format('YYYY/MM/DD HH:mm')} \n`,
            },
          ],
        },
      }),
    ];

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
      columns: [
        {
          key: 'E',
          width: 20,
        },
      ],
      rows,
      cells,
    });

    const workbook = new WorkbookDO({
      creator: 'Unionfab',
      lastModifiedBy: 'Unionfab',
      sheets: [sheet],
    });

    const g = new ExcelGenerator(
      workbook,
      path.resolve(__dirname, 'test.xlsx'),
    );

    await g.generateByExcelJs();
  });
});
