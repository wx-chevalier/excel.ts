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

import * as BigWorkbook from './big.json';

jest.setTimeout(60 * 1000 * 1000);

describe('Test adapter', () => {
  it('Big', async () => {
    const data = new WorkbookDO(BigWorkbook as any);

    const generator = new ExcelGenerator(
      data,
      path.resolve(__dirname, 'test.xlsx'),
    );

    await generator.generateByExcelJs();
  });
});
