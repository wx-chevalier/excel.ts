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

import { generateByExcelJs } from '../exceljs';

import * as BigWorkbook from './big.json';

jest.setTimeout(60 * 1000 * 1000);

describe('Test adapter', () => {
  it('Big', async () => {
    const data = new WorkbookDO(BigWorkbook as any);

    await generateByExcelJs(data, path.resolve(__dirname, 'test.xlsx'));
  });
});
