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

jest.setTimeout(60 * 1000 * 1000);

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
    { address: 'B2', value: '创建时间' },
    { address: 'C2', value: '文件名称' },
    { address: 'D2', value: '图片预览' },
    { address: 'E2', value: '打印材料' },
    { address: 'F2', value: '增值后处理' },
    { address: 'G2', value: '单件价格（元）' },
    { address: 'H2', value: '数量（件）' },
    { address: 'I2', value: '其他费用（元）' },
    { address: 'J2', value: '其他费用说明' },
    { address: 'K2', value: '付款方式' },
    { address: 'L2', value: '订单金额（元）' },
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

    const jsonObj: any = {
      creator: 'Unionfab',
      lastModifiedBy: 'Unionfab',
      sheets: [
        {
          name: '发货单',
          pageSetup: {
            verticalCentered: true,
            showGridLines: false,
            printArea: 'A1:J14',
          },
          view: { showGridLines: true },
          properties: {
            defaultColWidth: 12,
            defaultRowHeight: 20,
            defaultAlignment: {
              horizontal: 'right',
              wrapText: true,
              vertical: 'middle',
            },
          },
          rows: [
            { number: 1, height: 25 },
            { number: 2, height: 30 },
            { number: 3, height: 40 },
          ],
          columns: [
            { key: 'B', width: 20 },
            { key: 'C', width: 1 },
            { key: 'D', width: 8 },
            { key: 'E', width: 8 },
          ],
          cells: [
            {
              address: 'B2',
              value: {
                src:
                  'https://ufc-assets.oss-cn-shanghai.aliyuncs.com/%E5%AE%A3%E4%BC%A0%E7%89%A9%E6%96%99/union%20logo.png',
              },
              type: 11,
            },
            {
              address: 'D2',
              mergedCellAddress: 'E3',
              value: { qrcodeText: 'Test Qrcode' },
              type: 12,
            },
            {
              address: 'F1',
              mergedCellAddress: 'J1',
              value: 'Unionfab AM Technology（Shanghai）Co.,Ltd',
              style: {
                font: { size: 16, bold: true },
                alignment: {
                  horizontal: 'right',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              type: 3,
            },
            {
              address: 'F2',
              mergedCellAddress: 'J2',
              value: '优联三维打印科技发展（上海）有限公司',
              style: {
                font: { size: 16, bold: true },
                alignment: {
                  horizontal: 'right',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              type: 3,
            },
            {
              address: 'F3',
              mergedCellAddress: 'J3',
              value: '发货单',
              style: {
                font: { size: 18, bold: true },
                alignment: {
                  horizontal: 'right',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              type: 3,
            },
            {
              address: 'F4',
              mergedCellAddress: 'J4',
              value: '上海市松江区新格路 901 号 5 幢 3 楼',
              style: {
                font: { size: 14, bold: true },
                alignment: {
                  horizontal: 'right',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              type: 3,
            },
            {
              address: 'A:14',
              style: { border: { bottom: { style: 'thick' } } },
            },
            {
              address: 'B:14',
              style: { border: { bottom: { style: 'thick' } } },
            },
            {
              address: 'C:14',
              style: { border: { bottom: { style: 'thick' } } },
            },
            {
              address: 'D:14',
              style: { border: { bottom: { style: 'thick' } } },
            },
            {
              address: 'E:14',
              style: { border: { bottom: { style: 'thick' } } },
            },
            {
              address: 'F:14',
              style: { border: { bottom: { style: 'thick' } } },
            },
            {
              address: 'G:14',
              style: { border: { bottom: { style: 'thick' } } },
            },
            {
              address: 'H:14',
              style: { border: { bottom: { style: 'thick' } } },
            },
            {
              address: 'I:14',
              style: { border: { bottom: { style: 'thick' } } },
            },
            {
              address: 'J:14',
              style: { border: { bottom: { style: 'thick' } } },
            },
            {
              address: 'J:1',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:2',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:3',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:4',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:5',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:6',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:7',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:8',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:9',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:10',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:11',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:12',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:13',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:14',
              style: { border: { right: { style: 'thick' } } },
            },
            {
              address: 'J:14',
              style: {
                border: {
                  bottom: { style: 'thick' },
                  right: { style: 'thick' },
                },
              },
            },
          ],
        },
      ],
    };

    await generateByExcelJs(
      new WorkbookDO(jsonObj),
      path.resolve(__dirname, 'test.xlsx'),
    );
  });
});
