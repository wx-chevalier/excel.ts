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

import { TestData, testData } from './data';

export function genWorkbook(data: TestData) {
  const rows: Partial<WorksheetRowDO>[] = [
    { number: 1, height: 100 },
    { number: 2, height: 25 },
  ];
  // 添加所有的 Cell
  const cells: WorksheetCellDO[] = [
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
            text: `${data.customerName || '-'} \n`,
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
            text: `账单日期：${data.date} \n`,
          },
          {
            font: {
              size: 12,
            },
            text: `导出时间：${dayjs().format('YYYY/MM/DD HH:mm')} \n`,
          },
          {
            font: {
              size: 12,
              color: { argb: 'DC143C' },
              name: '宋体',
            },
            text: `账单总金额：￥${data.totalPrice || 0} \n`,
          },
        ],
      },
    }),
  ];

  // 添加题头
  const headers: { address: string; value: string }[] = [
    { address: 'A2', value: '订单编号' },
  ];

  headers.forEach(({ address, value }) => {
    cells.push(new WorksheetCellDO({ address, value }));
  });

  // 添加子项目
  const startIndexMap = new Map();

  (data.inquiryOrderStatements || []).map((d, i) => {
    if (i === 0) {
      startIndexMap.set(d.id, 3);
    } else {
      startIndexMap.set(
        d.id,
        data.inquiryOrderStatements[i - 1].printInfo.length +
          startIndexMap.get(data.inquiryOrderStatements[i - 1].id),
      );
    }
  });

  data.inquiryOrderStatements.forEach(inquiryOrderStatement => {
    const startIndex = startIndexMap.get(inquiryOrderStatement.id);
    const endIndex =
      startIndex + (inquiryOrderStatement.printInfo || []).length - 1;

    // 设置每一行高度
    for (let i = startIndex; i < endIndex + 1; i++) {
      rows.push({
        number: i,
        height: 80,
      });
    }

    const price = S.get(inquiryOrderStatement, i => i.price);
    const postage = S.get(price, p => p.postage);
    const surcharge = S.get(price, p => p.surcharge);
    const handleFee = S.get(price, p => p.handleFee);
    const packingFee = S.get(price, p => p.packingFee);
    const totalPriceWithTax = S.get(price, p => p.totalPriceWithTax);

    // 依次添加单元格
    cells.push(
      new WorksheetCellDO({
        address: `A${startIndex}`,
        mergedCellAddress: `A${endIndex}`,
        value: inquiryOrderStatement.code,
      }),
    );
    cells.push(
      new WorksheetCellDO({
        address: `B${startIndex}`,
        mergedCellAddress: `B${endIndex}`,
        value: dayjs(inquiryOrderStatement.createdAt).format(
          'YYYY 年 MM 月 DD 日',
        ),
      }),
    );
    cells.push(
      new WorksheetCellDO({
        address: `I${startIndex}`,
        mergedCellAddress: `I${endIndex}`,
        value: handleFee + packingFee + postage + surcharge,
      }),
    );
    cells.push(
      new WorksheetCellDO({
        address: `J${startIndex}`,
        mergedCellAddress: `J${endIndex}`,
        style: { alignment: { wrapText: true, vertical: 'middle' } },
        value: {
          richText: _.compact([
            postage > 0 && {
              text: `物流费：${postage} 元 \n`,
            },
            surcharge > 0 && {
              text: `附加费：${surcharge} 元 \n`,
            },
            handleFee > 0 && {
              text: `后处理费：${handleFee} 元 \n`,
            },
            packingFee > 0 && {
              text: `包装费：${packingFee} 元 \n`,
            },
          ]),
        },
      }),
    );
    cells.push(
      new WorksheetCellDO({
        address: `K${startIndex}`,
        mergedCellAddress: `K${endIndex}`,
        value: inquiryOrderStatement.payMethod,
      }),
    );
    cells.push(
      new WorksheetCellDO({
        address: `L${startIndex}`,
        mergedCellAddress: `L${endIndex}`,
        value: totalPriceWithTax,
      }),
    );

    // 插入文件数据
    (inquiryOrderStatement.printInfo || []).forEach((info, i) => {
      // 插入文件名称
      cells.push(
        new WorksheetCellDO({
          address: `C${startIndex + i}`,
          value: S.get(info, p => p.fileName),
        }),
      );

      // 插入打印材料
      cells.push(
        new WorksheetCellDO({
          address: `E${startIndex + i}`,
          value: S.get(info, p => p.materialName),
        }),
      );

      // 插入增值后处理
      cells.push(
        new WorksheetCellDO({
          address: `F${startIndex + i}`,
          value: S.get(info, p => p.handle.method),
        }),
      );

      // 单件价格
      cells.push(
        new WorksheetCellDO({
          address: `G${startIndex + i}`,
          value: S.get(info, p => p.price),
        }),
      );

      // 打印数量
      cells.push(
        new WorksheetCellDO({
          address: `H${startIndex + i}`,
          value: S.get(info, p => p.printCount),
        }),
      );
    });

    // 插入图片
    inquiryOrderStatement.printInfo
      .map(p => S.setOssResize(p.previewUrl.url, 100))
      .forEach((url, i) => {
        cells.push(
          new WorksheetCellDO({
            address: `D${startIndex + i}`,
            value: { src: url },
          }),
        );
      });
  });

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
      ...['G', 'H', 'I', 'J', 'K', 'L'].map(key => ({ key, width: 13 })),
    ],
    rows,
    cells,
  });

  const workbook = new WorkbookDO({
    creator: 'Unionfab',
    lastModifiedBy: 'Unionfab',
    sheets: [sheet],
  });

  return workbook;
}

describe('Test adapter', () => {
  it('对账单', async () => {
    const book = genWorkbook(testData);

    const jsonStr = JSON.stringify(book);

    await generateByExcelJs(
      new WorkbookDO(S.parseJson(jsonStr, {})),
      path.resolve(__dirname, 'test.xlsx'),
    );
  });
});
