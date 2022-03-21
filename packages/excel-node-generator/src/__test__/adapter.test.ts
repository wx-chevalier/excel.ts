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
            { key: 'E', width: 20 },
            { key: 'G', width: 13 },
            { key: 'H', width: 13 },
            { key: 'I', width: 13 },
            { key: 'J', width: 13 },
            { key: 'K', width: 13 },
            { key: 'L', width: 13 },
          ],
          rows: [
            { number: 1, height: 100 },
            { number: 2, height: 25 },
            { number: 3, height: 80 },
            { number: 4, height: 80 },
            { number: 5, height: 80 },
            { number: 6, height: 80 },
            { number: 7, height: 80 },
            { number: 8, height: 80 },
            { number: 9, height: 80 },
            { number: 10, height: 80 },
            { number: 11, height: 80 },
            { number: 12, height: 80 },
            { number: 13, height: 80 },
            { number: 14, height: 80 },
            { number: 15, height: 80 },
            { number: 16, height: 80 },
            { number: 17, height: 80 },
            { number: 18, height: 80 },
            { number: 19, height: 80 },
            { number: 20, height: 80 },
            { number: 21, height: 80 },
            { number: 22, height: 80 },
            { number: 23, height: 80 },
            { number: 24, height: 80 },
            { number: 25, height: 80 },
            { number: 26, height: 80 },
            { number: 27, height: 80 },
            { number: 28, height: 80 },
            { number: 29, height: 80 },
            { number: 30, height: 80 },
            { number: 31, height: 80 },
            { number: 32, height: 80 },
            { number: 33, height: 80 },
            { number: 34, height: 80 },
            { number: 35, height: 80 },
            { number: 36, height: 80 },
            { number: 37, height: 80 },
            { number: 38, height: 80 },
            { number: 39, height: 80 },
            { number: 40, height: 80 },
            { number: 41, height: 80 },
            { number: 42, height: 80 },
            { number: 43, height: 80 },
            { number: 44, height: 80 },
            { number: 45, height: 80 },
            { number: 46, height: 80 },
            { number: 47, height: 80 },
            { number: 48, height: 80 },
            { number: 49, height: 80 },
            { number: 50, height: 80 },
            { number: 51, height: 80 },
            { number: 52, height: 80 },
            { number: 53, height: 80 },
            { number: 54, height: 80 },
            { number: 55, height: 80 },
            { number: 56, height: 80 },
            { number: 57, height: 80 },
            { number: 58, height: 80 },
            { number: 59, height: 80 },
            { number: 60, height: 80 },
            { number: 61, height: 80 },
            { number: 62, height: 80 },
            { number: 63, height: 80 },
            { number: 64, height: 80 },
            { number: 65, height: 80 },
            { number: 66, height: 80 },
            { number: 67, height: 80 },
            { number: 68, height: 80 },
            { number: 69, height: 80 },
            { number: 70, height: 80 },
            { number: 71, height: 80 },
            { number: 72, height: 80 },
            { number: 73, height: 80 },
            { number: 74, height: 80 },
            { number: 75, height: 80 },
            { number: 76, height: 80 },
            { number: 77, height: 80 },
            { number: 78, height: 80 },
            { number: 79, height: 80 },
            { number: 80, height: 80 },
            { number: 81, height: 80 },
            { number: 82, height: 80 },
            { number: 83, height: 80 },
            { number: 84, height: 80 },
            { number: 85, height: 80 },
            { number: 86, height: 80 },
            { number: 87, height: 80 },
            { number: 88, height: 80 },
            { number: 89, height: 80 },
            { number: 90, height: 80 },
            { number: 91, height: 80 },
            { number: 92, height: 80 },
            { number: 93, height: 80 },
            { number: 94, height: 80 },
            { number: 95, height: 80 },
            { number: 96, height: 80 },
            { number: 97, height: 80 },
            { number: 98, height: 80 },
            { number: 99, height: 80 },
            { number: 100, height: 80 },
            { number: 101, height: 80 },
            { number: 102, height: 80 },
            { number: 103, height: 80 },
            { number: 104, height: 80 },
            { number: 105, height: 80 },
            { number: 106, height: 80 },
            { number: 107, height: 80 },
            { number: 108, height: 80 },
            { number: 109, height: 80 },
            { number: 110, height: 80 },
            { number: 111, height: 80 },
            { number: 112, height: 80 },
            { number: 113, height: 80 },
            { number: 114, height: 80 },
            { number: 115, height: 80 },
            { number: 116, height: 80 },
            { number: 117, height: 80 },
            { number: 118, height: 80 },
            { number: 119, height: 80 },
            { number: 120, height: 80 },
            { number: 121, height: 80 },
            { number: 122, height: 80 },
            { number: 123, height: 80 },
            { number: 124, height: 80 },
            { number: 125, height: 80 },
            { number: 126, height: 80 },
            { number: 127, height: 80 },
            { number: 128, height: 80 },
            { number: 129, height: 80 },
            { number: 130, height: 80 },
            { number: 131, height: 80 },
          ],
          cells: [
            {
              address: 'A1',
              mergedCellAddress: 'H1',
              style: { alignment: { horizontal: 'left', wrapText: true } },
              value: {
                richText: [
                  { font: { size: 16, name: '宋体' }, text: '捷配 \\n' },
                  { text: '\\n' },
                  { text: '\\n' },
                  {
                    font: { size: 12 },
                    text: '账单日期：2020-12-01~2020-12-11 \\n',
                  },
                  {
                    font: { size: 12 },
                    text: '导出时间：2020/12/11 11:28 \\n',
                  },
                  {
                    font: { size: 12, color: { argb: 'DC143C' }, name: '宋体' },
                    text: '账单总金额：￥ 5811 \\n',
                  },
                ],
              },
              type: 8,
            },
            { address: 'A2', value: '订单编号', type: 3 },
            { address: 'B2', value: '创建时间', type: 3 },
            { address: 'C2', value: '文件名称', type: 3 },
            { address: 'D2', value: '图片预览', type: 3 },
            { address: 'E2', value: '打印材料', type: 3 },
            { address: 'F2', value: '增值后处理', type: 3 },
            { address: 'G2', value: '单件价格（元）', type: 3 },
            { address: 'H2', value: '数量（件）', type: 3 },
            { address: 'I2', value: '其他费用（元）', type: 3 },
            { address: 'J2', value: '其他费用说明', type: 3 },
            { address: 'K2', value: '付款方式', type: 3 },
            { address: 'L2', value: '订单金额（元）', type: 3 },
            {
              address: 'A3',
              mergedCellAddress: 'A3',
              value: 'XJ20201130-441258-0',
              type: 3,
            },
            {
              address: 'B3',
              mergedCellAddress: 'B3',
              value: '2020 年 11 月 30 日',
              type: 3,
            },
            { address: 'I3', mergedCellAddress: 'I3', value: 0, type: 2 },
            {
              address: 'J3',
              mergedCellAddress: 'J3',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K3',
              mergedCellAddress: 'K3',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L3', mergedCellAddress: 'L3', value: 6, type: 2 },
            { address: 'C3', value: '4941317.STP', type: 3 },
            { address: 'E3', value: 'UTR3100-JP', type: 3 },
            { address: 'F3', value: '原色', type: 3 },
            { address: 'G3', value: 3, type: 2 },
            { address: 'H3', value: 2, type: 2 },
            {
              address: 'D3',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/a793a32efdae48aae8c14e34a05236eb/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJhNzkzYTMyZWZkYWU0OGFhZThjMTRlMzRhMDUyMzZlYiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.8DW9aqC4o6xm8In2DKjMgauP9rBEqRXNfdgKNq1B4_M8oxR8Q9qpg6zVPJ7akcJi18aCsKiV8S4ZSLa4uE-nXg&name=fixed-16067509950944941317.STP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A4',
              mergedCellAddress: 'A5',
              value: 'XJ20201130-444654-1',
              type: 3,
            },
            {
              address: 'B4',
              mergedCellAddress: 'B5',
              value: '2020 年 11 月 30 日',
              type: 3,
            },
            { address: 'I4', mergedCellAddress: 'I5', value: 0, type: 2 },
            {
              address: 'J4',
              mergedCellAddress: 'J5',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K4',
              mergedCellAddress: 'K5',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L4', mergedCellAddress: 'L5', value: 243, type: 2 },
            { address: 'C4', value: 'Radius mirror-1130.stp', type: 3 },
            { address: 'E4', value: 'DSM-Taurus-JP', type: 3 },
            { address: 'F4', value: '原色', type: 3 },
            { address: 'G4', value: 122, type: 2 },
            { address: 'H4', value: 1, type: 2 },
            { address: 'C5', value: 'Plane mirror-1130.stp', type: 3 },
            { address: 'E5', value: 'DSM-Taurus-JP', type: 3 },
            { address: 'F5', value: '原色', type: 3 },
            { address: 'G5', value: 121, type: 2 },
            { address: 'H5', value: 1, type: 2 },
            {
              address: 'D4',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/2c406eaf67e71e5bae1717fe6a5327d1/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIyYzQwNmVhZjY3ZTcxZTViYWUxNzE3ZmU2YTUzMjdkMSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.O-gfiSZhfXrXGVRADwKaCpKX-uOFR2Ip03W46VIuagUHu-bNPLy257Gb7VeHCJ0JRtbwcqL9tQ86pAa-oljK3g&name=fixed-1606748057913Radius mirror-1130.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D5',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/3cdd3efc2cbc2e5464554b8b8ce63175/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIzY2RkM2VmYzJjYmMyZTU0NjQ1NTRiOGI4Y2U2MzE3NSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.PwSMKirrKMWK9EHHmyLjUNNzwxdC-xM-pG47m_eRZnR_m9wFrl_Fpisf5UaqvI72nNEi8ssHRvov1F6OI3qn0w&name=fixed-1606748049243Plane mirror-1130.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A6',
              mergedCellAddress: 'A9',
              value: 'XJ20201130-638252-7',
              type: 3,
            },
            {
              address: 'B6',
              mergedCellAddress: 'B9',
              value: '2020 年 11 月 30 日',
              type: 3,
            },
            { address: 'I6', mergedCellAddress: 'I9', value: 0, type: 2 },
            {
              address: 'J6',
              mergedCellAddress: 'J9',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K6',
              mergedCellAddress: 'K9',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L6', mergedCellAddress: 'L9', value: 69, type: 2 },
            { address: 'C6', value: '2020-11-29-02.stp', type: 3 },
            { address: 'E6', value: 'UTR3100-JP', type: 3 },
            { address: 'F6', value: '原色', type: 3 },
            { address: 'G6', value: 8, type: 2 },
            { address: 'H6', value: 2, type: 2 },
            { address: 'C7', value: '2020-11-29-01.stp', type: 3 },
            { address: 'E7', value: 'UTR3100-JP', type: 3 },
            { address: 'F7', value: '原色', type: 3 },
            { address: 'G7', value: 10, type: 2 },
            { address: 'H7', value: 2, type: 2 },
            { address: 'C8', value: '2P.stp', type: 3 },
            { address: 'E8', value: 'UTR3100-JP', type: 3 },
            { address: 'F8', value: '原色', type: 3 },
            { address: 'G8', value: 13, type: 2 },
            { address: 'H8', value: 1, type: 2 },
            { address: 'C9', value: '4P.stp', type: 3 },
            { address: 'E9', value: 'UTR3100-JP', type: 3 },
            { address: 'F9', value: '原色', type: 3 },
            { address: 'G9', value: 20, type: 2 },
            { address: 'H9', value: 1, type: 2 },
            {
              address: 'D6',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/fec910a1d8daa4eafdd5b079ca762b70/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJmZWM5MTBhMWQ4ZGFhNGVhZmRkNWIwNzljYTc2MmI3MCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.YBPVyrmbSKfXKZ9t1xhVSpXnRi-pvdBEk_30E8BNuDDNjNe1VY7dyBIutgBxrydooR5pSpUlTL2FS7QIK02viA&name=fixed-16067074250142020-11-29-02.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D7',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/57582aac760aec1519b55a390c7da1f8/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI1NzU4MmFhYzc2MGFlYzE1MTliNTVhMzkwYzdkYTFmOCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.JeOSg1SXgpFHwlJ-eVDJTIFjEt-_k6l3RYRubQKz3vvoDwVKfOYz3bZxlUH-HPjsmkeBNz82cfuwcn9hpYJw-A&name=fixed-16067074181532020-11-29-01.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D8',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/29e08c4eb286abcf638ed1bb0d8c05fb/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIyOWUwOGM0ZWIyODZhYmNmNjM4ZWQxYmIwZDhjMDVmYiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.SPHBbkSR-qd5SeTLuhGdnjmT7BXSdYOE-TJIdHYaIfEZDtb6ox51my0ne1RrhJmnJokomT_V8jifnctgNbpl2w&name=fixed-16067073626992P.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D9',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/5112f65abd0de1bdbea727df074a88c5/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI1MTEyZjY1YWJkMGRlMWJkYmVhNzI3ZGYwNzRhODhjNSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.9InxvVp_s16KPQaRT5u1crAZCHtPnbKKFDnclS6gqmQcKBlolz3yIAjdbSggOP43KY4t_zvFFoX00xmDtXvAIw&name=fixed-16067074061054P.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A10',
              mergedCellAddress: 'A13',
              value: 'XJ20201130-723262-7',
              type: 3,
            },
            {
              address: 'B10',
              mergedCellAddress: 'B13',
              value: '2020 年 11 月 30 日',
              type: 3,
            },
            { address: 'I10', mergedCellAddress: 'I13', value: 0, type: 2 },
            {
              address: 'J10',
              mergedCellAddress: 'J13',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K10',
              mergedCellAddress: 'K13',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L10', mergedCellAddress: 'L13', value: 85, type: 2 },
            { address: 'C10', value: 'IES-1231.stp', type: 3 },
            { address: 'E10', value: 'UTR3100-JP', type: 3 },
            { address: 'F10', value: '原色', type: 3 },
            { address: 'G10', value: 5, type: 2 },
            { address: 'H10', value: 1, type: 2 },
            { address: 'C11', value: 'IES-1101.stp', type: 3 },
            { address: 'E11', value: 'DSM 128-JP', type: 3 },
            { address: 'F11', value: '原色', type: 3 },
            { address: 'G11', value: 49, type: 2 },
            { address: 'H11', value: 1, type: 2 },
            { address: 'C12', value: 'IES-1102.stp', type: 3 },
            { address: 'E12', value: 'DSM 128-JP', type: 3 },
            { address: 'F12', value: '原色', type: 3 },
            { address: 'G12', value: 28, type: 2 },
            { address: 'H12', value: 1, type: 2 },
            { address: 'C13', value: 'IES-1221.stp', type: 3 },
            { address: 'E13', value: 'UTR3100-JP', type: 3 },
            { address: 'F13', value: '原色', type: 3 },
            { address: 'G13', value: 3, type: 2 },
            { address: 'H13', value: 1, type: 2 },
            {
              address: 'D10',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/87a06c7a351e35df67e31a64c2090109/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI4N2EwNmM3YTM1MWUzNWRmNjdlMzFhNjRjMjA5MDEwOSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30._d3q4Hrez8OI98rqUC3YZEtq5EzqrRnc9yQFOoPJGcbytsIrz33IpU5Cac0oKthIPkNBauOF9kKQKfzmoZVzIg&name=fixed-1606724464937IES-1231.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D11',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/cff96ed2847dde3ddbf1c2afd1fd6235/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJjZmY5NmVkMjg0N2RkZTNkZGJmMWMyYWZkMWZkNjIzNSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.BFRixFWX78qh9eQRMvKhlOSoK2XRH1gfjfon-K0QxDfkxEyUna-OfT_mJfzjm8k5pxMh721GFYASz0glUUhAYQ&name=fixed-1606724457174IES-1101.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D12',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/832882505801aa04dc57ce22702a4aa2/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI4MzI4ODI1MDU4MDFhYTA0ZGM1N2NlMjI3MDJhNGFhMiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.oQCm5_-MiMi2eJlLSMyStNwpcVYUuLXlpKAS5NuAyNS9CG7nwmc6ZlNHRcvM2OCxNFos25vkXl7cHHXWeOOqyQ&name=fixed-1606724468718IES-1102.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D13',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/42a39633e7b524afbd1d48c3babd0b5b/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI0MmEzOTYzM2U3YjUyNGFmYmQxZDQ4YzNiYWJkMGI1YiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.bzHiYWxL_MfSlikVcjBu1FPSjLdgc-2c-2CVGZbXd6MgJiUIrOfYV7_AtPuHyMGLbmlGl-_eq1Z_YdchufMcQw&name=fixed-1606724460938IES-1221.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A14',
              mergedCellAddress: 'A14',
              value: 'XJ20201130-911321-1',
              type: 3,
            },
            {
              address: 'B14',
              mergedCellAddress: 'B14',
              value: '2020 年 11 月 30 日',
              type: 3,
            },
            { address: 'I14', mergedCellAddress: 'I14', value: 0, type: 2 },
            {
              address: 'J14',
              mergedCellAddress: 'J14',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K14',
              mergedCellAddress: 'K14',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L14', mergedCellAddress: 'L14', value: 30, type: 2 },
            { address: 'C14', value: '上海接收器外壳修改 4.STEP', type: 3 },
            { address: 'E14', value: 'UTR3100-JP', type: 3 },
            { address: 'F14', value: '原色', type: 3 },
            { address: 'G14', value: 30, type: 2 },
            { address: 'H14', value: 1, type: 2 },
            {
              address: 'D14',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/622cb7ac9889c83049c9e4f36b2da74f/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI2MjJjYjdhYzk4ODljODMwNDljOWU0ZjM2YjJkYTc0ZiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.Dtogl5x694xTQTn_90u_5arAwRerjZLap1ROi4HiykKnYL1uceduCaRr2CFg5eNIZK7blRuol_7cNwUT_wwtIA&name=fixed-1606732904630上海接收器外壳修改4.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A15',
              mergedCellAddress: 'A15',
              value: 'XJ20201201-155218-4',
              type: 3,
            },
            {
              address: 'B15',
              mergedCellAddress: 'B15',
              value: '2020 年 12 月 01 日',
              type: 3,
            },
            { address: 'I15', mergedCellAddress: 'I15', value: 0, type: 2 },
            {
              address: 'J15',
              mergedCellAddress: 'J15',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K15',
              mergedCellAddress: 'K15',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L15', mergedCellAddress: 'L15', value: 20, type: 2 },
            { address: 'C15', value: '中框 12-1.step', type: 3 },
            { address: 'E15', value: 'UTR9000E-JP', type: 3 },
            { address: 'F15', value: '原色', type: 3 },
            { address: 'G15', value: 20, type: 2 },
            { address: 'H15', value: 1, type: 2 },
            {
              address: 'D15',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/ab80537737876ddb6eb43cefc6bd1382/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJhYjgwNTM3NzM3ODc2ZGRiNmViNDNjZWZjNmJkMTM4MiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.j05BxuEf7CswR0re6Iw96eCXjE8RxiIkJ4BTOShohci9LBvaLb7mWPoBR8Rcn5br8iS1UGksYib5H_DPVIfRLg&name=fixed-1606828281802中框12-1.step.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A16',
              mergedCellAddress: 'A18',
              value: 'XJ20201201-168138-X',
              type: 3,
            },
            {
              address: 'B16',
              mergedCellAddress: 'B18',
              value: '2020 年 12 月 01 日',
              type: 3,
            },
            { address: 'I16', mergedCellAddress: 'I18', value: 0, type: 2 },
            {
              address: 'J16',
              mergedCellAddress: 'J18',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K16',
              mergedCellAddress: 'K18',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L16', mergedCellAddress: 'L18', value: 375, type: 2 },
            {
              address: 'C16',
              value: '1-UTR6800-JP-数量 5-12-1 软胶打印.stl',
              type: 3,
            },
            { address: 'E16', value: 'UTR6800-JP', type: 3 },
            { address: 'F16', value: '', type: 3 },
            { address: 'G16', value: 25, type: 2 },
            { address: 'H16', value: 5, type: 2 },
            {
              address: 'C17',
              value: '1-UTR6800-JP-数量 5-12-1 软胶打印**1.stl',
              type: 3,
            },
            { address: 'E17', value: 'UTR6800-JP', type: 3 },
            { address: 'F17', value: '', type: 3 },
            { address: 'G17', value: 25, type: 2 },
            { address: 'H17', value: 5, type: 2 },
            {
              address: 'C18',
              value: '1-UTR6800-JP-数量 5-12-1 软胶打印**2.stl',
              type: 3,
            },
            { address: 'E18', value: 'UTR6800-JP', type: 3 },
            { address: 'F18', value: '', type: 3 },
            { address: 'G18', value: 25, type: 2 },
            { address: 'H18', value: 5, type: 2 },
            {
              address: 'D16',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/e6/df3c8857c34a3035e22dfe3c182004/decompressed-1-UTR6800-JP-数量5-12-1软胶打印.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D17',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/aa/fc71be0857ecad7f51f22d19ef3399/decompressed-1-UTR6800-JP-数量5-12-1软胶打印__1.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D18',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/8a/0633f90eada81fa9e6cc3def268604/decompressed-1-UTR6800-JP-数量5-12-1软胶打印__2.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'A19',
              mergedCellAddress: 'A21',
              value: 'XJ20201201-172668-7',
              type: 3,
            },
            {
              address: 'B19',
              mergedCellAddress: 'B21',
              value: '2020 年 12 月 01 日',
              type: 3,
            },
            { address: 'I19', mergedCellAddress: 'I21', value: 0, type: 2 },
            {
              address: 'J19',
              mergedCellAddress: 'J21',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K19',
              mergedCellAddress: 'K21',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L19', mergedCellAddress: 'L21', value: 122, type: 2 },
            { address: 'C19', value: 'd1605-20201201.stp', type: 3 },
            { address: 'E19', value: 'UTR Therm 1-JP', type: 3 },
            { address: 'F19', value: '原色', type: 3 },
            { address: 'G19', value: 12.5, type: 2 },
            { address: 'H19', value: 2, type: 2 },
            { address: 'C20', value: 'ug-35-r6n4c1z4t1-20201201.stp', type: 3 },
            { address: 'E20', value: 'UTR Therm 1-JP', type: 3 },
            { address: 'F20', value: '原色', type: 3 },
            { address: 'G20', value: 36, type: 2 },
            { address: 'H20', value: 2, type: 2 },
            { address: 'C21', value: 'new-lgrc-l22r3-20201201.stp', type: 3 },
            { address: 'E21', value: 'UTR Therm 1-JP', type: 3 },
            { address: 'F21', value: '原色', type: 3 },
            { address: 'G21', value: 12.5, type: 2 },
            { address: 'H21', value: 2, type: 2 },
            {
              address: 'D19',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/414c69d72bd204256e5bea6062e3fa67/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI0MTRjNjlkNzJiZDIwNDI1NmU1YmVhNjA2MmUzZmE2NyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.pY3yYyCWyke957VOYT-5KgHw2Lzlw_tjRbolB-8zijmPa0W-pNEdX5XfDbAAXoxrntfmMipHoNaEMUWDrXzXFQ&name=fixed-1606814898294d1605-20201201.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D20',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/c883c6546408b5bef0f68c0bb6c78198/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJjODgzYzY1NDY0MDhiNWJlZjBmNjhjMGJiNmM3ODE5OCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.tJ70vcwxajQKbus2l4tsXbAIMrTtMLPEM6aWh6yqqNBQ-lF6V9BBmKdu5pb-O5wskKslFYIbUgaXBnpCXiaozw&name=fixed-1606814894966ug-35-r6n4c1z4t1-20201201.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D21',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/94e91836262eed932a0e5d7605a5bb91/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI5NGU5MTgzNjI2MmVlZDkzMmEwZTVkNzYwNWE1YmI5MSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.Si7EM6tHe-Q-_-ncRe3769VweObeLVN0NYibRmj8adTN1-h47JmcJwHTuZr9Rxt0SrKWUu98N0TLX5A94WykTg&name=fixed-1606814886881new-lgrc-l22r3-20201201.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A22',
              mergedCellAddress: 'A23',
              value: 'XJ20201201-211596-3',
              type: 3,
            },
            {
              address: 'B22',
              mergedCellAddress: 'B23',
              value: '2020 年 12 月 01 日',
              type: 3,
            },
            { address: 'I22', mergedCellAddress: 'I23', value: 0, type: 2 },
            {
              address: 'J22',
              mergedCellAddress: 'J23',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K22',
              mergedCellAddress: 'K23',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L22', mergedCellAddress: 'L23', value: 59, type: 2 },
            { address: 'C22', value: '抽空皮卡.stl', type: 3 },
            { address: 'E22', value: 'UTR9000E-JP', type: 3 },
            { address: 'F22', value: '', type: 3 },
            { address: 'G22', value: 27, type: 2 },
            { address: 'H22', value: 1, type: 2 },
            { address: 'C23', value: '抽空皮卡.stl', type: 3 },
            { address: 'E23', value: 'UTR3000-JP', type: 3 },
            { address: 'F23', value: '', type: 3 },
            { address: 'G23', value: 32, type: 2 },
            { address: 'H23', value: 1, type: 2 },
            { address: 'D22', value: {} },
            { address: 'D23', value: {} },
            {
              address: 'A24',
              mergedCellAddress: 'A25',
              value: 'XJ20201201-359989-X',
              type: 3,
            },
            {
              address: 'B24',
              mergedCellAddress: 'B25',
              value: '2020 年 12 月 01 日',
              type: 3,
            },
            { address: 'I24', mergedCellAddress: 'I25', value: 200, type: 2 },
            {
              address: 'J24',
              mergedCellAddress: 'J25',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [{ text: '后处理费：200 元 \\n' }] },
              type: 8,
            },
            {
              address: 'K24',
              mergedCellAddress: 'K25',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L24', mergedCellAddress: 'L25', value: 266, type: 2 },
            { address: 'C24', value: '外壳.STEP', type: 3 },
            { address: 'E24', value: 'DSM 128-JP', type: 3 },
            { address: 'F24', value: '喷漆', type: 3 },
            { address: 'G24', value: 38, type: 2 },
            { address: 'H24', value: 1, type: 2 },
            { address: 'C25', value: '外壳.STEP', type: 3 },
            { address: 'E25', value: 'UTR3100-JP', type: 3 },
            { address: 'F25', value: '喷漆', type: 3 },
            { address: 'G25', value: 28, type: 2 },
            { address: 'H25', value: 1, type: 2 },
            {
              address: 'D24',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/7a37a747f2f15ce3b7615eb90e913e16/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI3YTM3YTc0N2YyZjE1Y2UzYjc2MTVlYjkwZTkxM2UxNiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.mWlY497ORZVR9BtsHjtKv_Ygja7du-wCZxqY3kr5k_vfShr-WDWtFD8zcqWu-H5XmHesjKuZ0cutOn-eTYhJjg&name=fixed-1606786347938外壳.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D25',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/7a37a747f2f15ce3b7615eb90e913e16/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI3YTM3YTc0N2YyZjE1Y2UzYjc2MTVlYjkwZTkxM2UxNiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.mWlY497ORZVR9BtsHjtKv_Ygja7du-wCZxqY3kr5k_vfShr-WDWtFD8zcqWu-H5XmHesjKuZ0cutOn-eTYhJjg&name=fixed-1606786347938外壳.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A26',
              mergedCellAddress: 'A30',
              value: 'XJ20201201-789169-0',
              type: 3,
            },
            {
              address: 'B26',
              mergedCellAddress: 'B30',
              value: '2020 年 12 月 01 日',
              type: 3,
            },
            { address: 'I26', mergedCellAddress: 'I30', value: 0, type: 2 },
            {
              address: 'J26',
              mergedCellAddress: 'J30',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K26',
              mergedCellAddress: 'K30',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L26', mergedCellAddress: 'L30', value: 52, type: 2 },
            { address: 'C26', value: '火柴盒盖 V1.STL', type: 3 },
            { address: 'E26', value: 'UTR3100-JP', type: 3 },
            { address: 'F26', value: '原色', type: 3 },
            { address: 'G26', value: 3, type: 2 },
            { address: 'H26', value: 1, type: 2 },
            { address: 'C27', value: '1206 磁钢压环 V1.STL', type: 3 },
            { address: 'E27', value: 'UTR3100-JP', type: 3 },
            { address: 'F27', value: '原色', type: 3 },
            { address: 'G27', value: 3, type: 2 },
            { address: 'H27', value: 1, type: 2 },
            { address: 'C28', value: '火柴帽 V2.STL', type: 3 },
            { address: 'E28', value: 'UTR3100-JP', type: 3 },
            { address: 'F28', value: '原色', type: 3 },
            { address: 'G28', value: 3, type: 2 },
            { address: 'H28', value: 1, type: 2 },
            { address: 'C29', value: '火柴盒 V1.STL', type: 3 },
            { address: 'E29', value: 'UTR3100-JP', type: 3 },
            { address: 'F29', value: '原色', type: 3 },
            { address: 'G29', value: 40, type: 2 },
            { address: 'H29', value: 1, type: 2 },
            { address: 'C30', value: '火柴帽 V2.STL', type: 3 },
            { address: 'E30', value: 'UTR9000E-JP', type: 3 },
            { address: 'F30', value: '原色', type: 3 },
            { address: 'G30', value: 3, type: 2 },
            { address: 'H30', value: 1, type: 2 },
            {
              address: 'D26',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/6d771ee9bba317f34a5aac20bfedca4f/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI2ZDc3MWVlOWJiYTMxN2YzNGE1YWFjMjBiZmVkY2E0ZiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.VN-_xV850pXKcVHL9e4U6GFu0vGDM17rHB0gZwylLUpOlPcemL6dUO0Wwj39cvWKMZjYe51zm27MLVHNy0E2mA&name=fixed-1606804689112火柴盒盖V1.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D27',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/ba9da88500d91c6b49d8dda5dfa096f9/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJiYTlkYTg4NTAwZDkxYzZiNDlkOGRkYTVkZmEwOTZmOSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.6moypgeYDXNB3VgimOT6oV4X11r-yceX9AWKjQDElRmji_KN0MAChUeCYsOPm6dAm3BcIQISQQA3281oNQxKlw&name=fixed-16068046860221206磁钢压环V1.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D28',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/0b69da0c0ebec912fd2a52791fcb5f93/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIwYjY5ZGEwYzBlYmVjOTEyZmQyYTUyNzkxZmNiNWY5MyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.FCsGtAKtl8wER757XT1nBMDMGUmGt6M1hJrjHDn1k2hxzj_KesipgdfL8u8iB-3yK073ZIONG3H4uZYgyPpF2Q&name=fixed-1606804697134火柴帽V2.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D29',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/9d7d10ce38ba64b236f452287b9a483d/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI5ZDdkMTBjZTM4YmE2NGIyMzZmNDUyMjg3YjlhNDgzZCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.3C6kVBsUR4-NR8bfuZ2FBEKFc7dcf0wC3aSWtguvTrB4hr764S1rjifudhTIdMadnFgPgrxnVhjSi7oWTDNv8w&name=fixed-1606804693110火柴盒V1.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D30',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/0b69da0c0ebec912fd2a52791fcb5f93/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIwYjY5ZGEwYzBlYmVjOTEyZmQyYTUyNzkxZmNiNWY5MyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.FCsGtAKtl8wER757XT1nBMDMGUmGt6M1hJrjHDn1k2hxzj_KesipgdfL8u8iB-3yK073ZIONG3H4uZYgyPpF2Q&name=fixed-1606804697134火柴帽V2.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A31',
              mergedCellAddress: 'A31',
              value: 'XJ20201201-915378-5',
              type: 3,
            },
            {
              address: 'B31',
              mergedCellAddress: 'B31',
              value: '2020 年 12 月 01 日',
              type: 3,
            },
            { address: 'I31', mergedCellAddress: 'I31', value: 0, type: 2 },
            {
              address: 'J31',
              mergedCellAddress: 'J31',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K31',
              mergedCellAddress: 'K31',
              value: '免费',
              type: 3,
            },
            { address: 'L31', mergedCellAddress: 'L31', value: 0, type: 2 },
            {
              address: 'C31',
              value: '2-UTR3100-JP-数量 1-一体机喷头-锥.STEP',
              type: 3,
            },
            { address: 'E31', value: '【白料】UTR3100', type: 3 },
            { address: 'F31', value: '', type: 3 },
            { address: 'G31', value: 0, type: 2 },
            { address: 'H31', value: 1, type: 2 },
            {
              address: 'D31',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/90/ee381b4b0a0f34b406f4827e457e91/decompressed-2-UTR3100-JP-数量1-一体机喷头-锥.STEP.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'A32',
              mergedCellAddress: 'A33',
              value: 'XJ20201202-484842-1',
              type: 3,
            },
            {
              address: 'B32',
              mergedCellAddress: 'B33',
              value: '2020 年 12 月 02 日',
              type: 3,
            },
            { address: 'I32', mergedCellAddress: 'I33', value: 0, type: 2 },
            {
              address: 'J32',
              mergedCellAddress: 'J33',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K32',
              mergedCellAddress: 'K33',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L32', mergedCellAddress: 'L33', value: 72, type: 2 },
            { address: 'C32', value: 'JDFHnode*shell2.STEP', type: 3 },
            { address: 'E32', value: 'UTR9000E-JP', type: 3 },
            { address: 'F32', value: '原色', type: 3 },
            { address: 'G32', value: 8, type: 2 },
            { address: 'H32', value: 4, type: 2 },
            { address: 'C33', value: 'JDFHnode_shell1.STEP', type: 3 },
            { address: 'E33', value: 'UTR9000E-JP', type: 3 },
            { address: 'F33', value: '原色', type: 3 },
            { address: 'G33', value: 10, type: 2 },
            { address: 'H33', value: 4, type: 2 },
            {
              address: 'D32',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/08c2f35f6a0d4d4f7fbaa74e6e982d49/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIwOGMyZjM1ZjZhMGQ0ZDRmN2ZiYWE3NGU2ZTk4MmQ0OSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.ZqCegoL6kaN_nWMKPetL5dDLY_XZE0_fiSDYvI6DyLNied8f10opHdU1bpDJQuIBVX0ppJ8toSpryjOagJRAHQ&name=fixed-1606892020230JDFHnode_shell2.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D33',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/d6b5ea0bdaa1a24c0ed7c2d1a900b25d/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkNmI1ZWEwYmRhYTFhMjRjMGVkN2MyZDFhOTAwYjI1ZCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.5p*-pkGRZ5lk2mVSiAfhFYltTNzqRkKp7STt3lxcl1DpcJZeuSSE9KtEItVaxBe27ksWKuEMFB6mXu-N3E-Vtw&name=fixed-1606892016294JDFHnode*shell1.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A34',
              mergedCellAddress: 'A34',
              value: 'XJ20201202-693262-X',
              type: 3,
            },
            {
              address: 'B34',
              mergedCellAddress: 'B34',
              value: '2020 年 12 月 02 日',
              type: 3,
            },
            { address: 'I34', mergedCellAddress: 'I34', value: 0, type: 2 },
            {
              address: 'J34',
              mergedCellAddress: 'J34',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K34',
              mergedCellAddress: 'K34',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L34', mergedCellAddress: 'L34', value: 46, type: 2 },
            { address: 'C34', value: '黑色旋钮.stp', type: 3 },
            { address: 'E34', value: 'UTR3000-JP', type: 3 },
            { address: 'F34', value: '原色', type: 3 },
            { address: 'G34', value: 4.6, type: 2 },
            { address: 'H34', value: 10, type: 2 },
            {
              address: 'D34',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/e0661af96d9b61b3cc5187820a5b4406/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJlMDY2MWFmOTZkOWI2MWIzY2M1MTg3ODIwYTViNDQwNiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.In5O34njw6YT1AWoSyCk4KRd9w-SIg8ue-0Rz8lSQiLiS-L1eddnrvMsMqym0rwWGQ-JreThN0k5rDp7Fu7nZQ&name=fixed-1606889371552黑色旋钮.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A35',
              mergedCellAddress: 'A36',
              value: 'XJ20201202-767827-7',
              type: 3,
            },
            {
              address: 'B35',
              mergedCellAddress: 'B36',
              value: '2020 年 12 月 02 日',
              type: 3,
            },
            { address: 'I35', mergedCellAddress: 'I36', value: 0, type: 2 },
            {
              address: 'J35',
              mergedCellAddress: 'J36',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K35',
              mergedCellAddress: 'K36',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L35', mergedCellAddress: 'L36', value: 30, type: 2 },
            {
              address: 'C35',
              value: '1-UTR3100-JP-数量 5-WX20201201**_model2**model2-None.stl',
              type: 3,
            },
            { address: 'E35', value: 'UTR3100-JP', type: 3 },
            { address: 'F35', value: '', type: 3 },
            { address: 'G35', value: 3, type: 2 },
            { address: 'H35', value: 5, type: 2 },
            {
              address: 'C36',
              value:
                '1-UTR3100-JP-数量 5-WX20201201**_model2_MANIFOLD_SOLID_BREP #178539.stl',
              type: 3,
            },
            { address: 'E36', value: 'UTR3100-JP', type: 3 },
            { address: 'F36', value: '', type: 3 },
            { address: 'G36', value: 3, type: 2 },
            { address: 'H36', value: 5, type: 2 },
            {
              address: 'D35',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/2b/da18f2f76717ae2b6441d51fc2ed31/decompressed-1-UTR3100-JP-数量5-WX20201201***model2**model2-None.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw*100',
              },
              type: 11,
            },
            {
              address: 'D36',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/40/30c06487e0699ec5e6776b2b2f2999/decompressed-1-UTR3100-JP-数量5-WX20201201***model2*MANIFOLD_SOLID_BREP ?x-oss-process=image%2Fresize%2Cw*100#178539.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A37',
              mergedCellAddress: 'A42',
              value: 'XJ20201202-898472-7',
              type: 3,
            },
            {
              address: 'B37',
              mergedCellAddress: 'B42',
              value: '2020 年 12 月 02 日',
              type: 3,
            },
            { address: 'I37', mergedCellAddress: 'I42', value: 0, type: 2 },
            {
              address: 'J37',
              mergedCellAddress: 'J42',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K37',
              mergedCellAddress: 'K42',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L37', mergedCellAddress: 'L42', value: 65, type: 2 },
            {
              address: 'C37',
              value: '20201118153835850574642692h698n1.STL',
              type: 3,
            },
            { address: 'E37', value: 'UTR3100-JP', type: 3 },
            { address: 'F37', value: '原色', type: 3 },
            { address: 'G37', value: 15, type: 2 },
            { address: 'H37', value: 1, type: 2 },
            {
              address: 'C38',
              value: '20201118153831833818158836iamkte.STL',
              type: 3,
            },
            { address: 'E38', value: 'UTR3100-JP', type: 3 },
            { address: 'F38', value: '原色', type: 3 },
            { address: 'G38', value: 1, type: 2 },
            { address: 'H38', value: 5, type: 2 },
            {
              address: 'C39',
              value: '20201118153847408103466215t8zpcx.STL',
              type: 3,
            },
            { address: 'E39', value: 'UTR3100-JP', type: 3 },
            { address: 'F39', value: '原色', type: 3 },
            { address: 'G39', value: 3, type: 2 },
            { address: 'H39', value: 4, type: 2 },
            {
              address: 'C40',
              value: '2020111815382408059134226tkxzlq1.STL',
              type: 3,
            },
            { address: 'E40', value: 'UTR3100-JP', type: 3 },
            { address: 'F40', value: '原色', type: 3 },
            { address: 'G40', value: 2, type: 2 },
            { address: 'H40', value: 5, type: 2 },
            {
              address: 'C41',
              value: '2020111815381666917384564ienmigz.STL',
              type: 3,
            },
            { address: 'E41', value: 'UTR3100-JP', type: 3 },
            { address: 'F41', value: '原色', type: 3 },
            { address: 'G41', value: 4, type: 2 },
            { address: 'H41', value: 3, type: 2 },
            {
              address: 'C42',
              value: '2020111815384372865173211bpz861c.STL',
              type: 3,
            },
            { address: 'E42', value: 'UTR3100-JP', type: 3 },
            { address: 'F42', value: '原色', type: 3 },
            { address: 'G42', value: 11, type: 2 },
            { address: 'H42', value: 1, type: 2 },
            {
              address: 'D37',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/a7f4ada173468cfc4544d61784efd1b7/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJhN2Y0YWRhMTczNDY4Y2ZjNDU0NGQ2MTc4NGVmZDFiNyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.grIHVZSNvhmMl0xYi-x-PBj0-CfF32YBEsFo9UbSiB3BKjZ7ifDIGqkUFCk5Zn6jzr2KiL7wDBOJKVI7ZTUQTg&name=fixed-160688529081020201118153835850574642692h698n1.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D38',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/5f3dd2894fddf8726bc85b5b9137e8bb/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI1ZjNkZDI4OTRmZGRmODcyNmJjODViNWI5MTM3ZThiYiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.3zO267PeH_QYmEYxgQ01AjChNF2bipDLzAE3DUT9QUx5SESahUgHXyvmem9jgRwtUGOGK_1XojRdqy3a2ZwozQ&name=fixed-160688527679820201118153831833818158836iamkte.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D39',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/229367c76c2d4d8a176ba2335c4db67c/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIyMjkzNjdjNzZjMmQ0ZDhhMTc2YmEyMzM1YzRkYjY3YyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.hhyCw53sjHiIrwf6Uud_FCXw_wOsn48qePdy_rYEnVuvy8tc6Hr9sPzQn1SAyw--LH3E78QVYp-yaXiCiyuxbQ&name=fixed-160688528380220201118153847408103466215t8zpcx.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D40',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/24b39fc5b40b6ecaaa9f6a652a8ee5d7/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIyNGIzOWZjNWI0MGI2ZWNhYWE5ZjZhNjUyYThlZTVkNyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.REuAKVAGY2fyRBjEJua3FJ9ZwYdo_pgnq5JSKPk4RhTH4xQ7nayP7eZI6o9mjNo0Hethv4a5Zza7bBXFQm0m-w&name=fixed-16068852878582020111815382408059134226tkxzlq1.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D41',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/95a5486057659b831ac48ff5cff570e0/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI5NWE1NDg2MDU3NjU5YjgzMWFjNDhmZjVjZmY1NzBlMCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.K-VF_bPv-6waMWxkov4pIXhoDINXDhissRkM7RxzqJvJrwaonFoN1HpL8mkFd8Hp9p1Rwl1LsVB1IFTqAqzGrQ&name=fixed-16068852807982020111815381666917384564ienmigz.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D42',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/ac36ed39fb8951953c2ef7b3e8b27a8c/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJhYzM2ZWQzOWZiODk1MTk1M2MyZWY3YjNlOGIyN2E4YyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.q_elMy-J8pOOHEvQW7t9ZLjAm9-_jh6c4xNTrSzWTSi6c8ll5WJr94FUgltoy6licwoQxEVDX2y1LrFo6lwjuw&name=fixed-16068852948702020111815384372865173211bpz861c.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A43',
              mergedCellAddress: 'A43',
              value: 'XJ20201203-173839-7',
              type: 3,
            },
            {
              address: 'B43',
              mergedCellAddress: 'B43',
              value: '2020 年 12 月 03 日',
              type: 3,
            },
            { address: 'I43', mergedCellAddress: 'I43', value: 0, type: 2 },
            {
              address: 'J43',
              mergedCellAddress: 'J43',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K43',
              mergedCellAddress: 'K43',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L43', mergedCellAddress: 'L43', value: 30, type: 2 },
            { address: 'C43', value: 'CKA10-63 翻盖.stp', type: 3 },
            { address: 'E43', value: 'UTR8100-半透明-JP', type: 3 },
            { address: 'F43', value: '原色', type: 3 },
            { address: 'G43', value: 3, type: 2 },
            { address: 'H43', value: 10, type: 2 },
            {
              address: 'D43',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/37b72c7dd255f028209f3d9bdda6da53/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIzN2I3MmM3ZGQyNTVmMDI4MjA5ZjNkOWJkZGE2ZGE1MyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.YeXWDEgX5LPoNgKf9bha-vcsy4pCMA1PEOO_ng3A_jQQ_BeWmt6M_UGxCehDMEB02bLgO-hfu_xrNDzsitAOtQ&name=fixed-1606965990002CKA10-63翻盖.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A44',
              mergedCellAddress: 'A45',
              value: 'XJ20201203-265631-0',
              type: 3,
            },
            {
              address: 'B44',
              mergedCellAddress: 'B45',
              value: '2020 年 12 月 03 日',
              type: 3,
            },
            { address: 'I44', mergedCellAddress: 'I45', value: 0, type: 2 },
            {
              address: 'J44',
              mergedCellAddress: 'J45',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K44',
              mergedCellAddress: 'K45',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L44', mergedCellAddress: 'L45', value: 20, type: 2 },
            {
              address: 'C44',
              value:
                '1-UTR3100-JP-数量 2-宝马头控制盒**Admi05C07DD55ee8_Admi05C07DD55ee8-None.stl',
              type: 3,
            },
            { address: 'E44', value: 'UTR3100-JP', type: 3 },
            { address: 'F44', value: '', type: 3 },
            { address: 'G44', value: 5, type: 2 },
            { address: 'H44', value: 2, type: 2 },
            {
              address: 'C45',
              value:
                '1-UTR3100-JP-数量 2-宝马头控制盒**Admi05C07DD55ee8_Admi05C07DD55ee8-None_1.stl',
              type: 3,
            },
            { address: 'E45', value: 'UTR3100-JP', type: 3 },
            { address: 'F45', value: '', type: 3 },
            { address: 'G45', value: 5, type: 2 },
            { address: 'H45', value: 2, type: 2 },
            {
              address: 'D44',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/7e/d3be4b13473007ee1d470b1820fbac/decompressed-1-UTR3100-JP-数量2-宝马头控制盒__Admi05C07DD55ee8_Admi05C07DD55ee8-None.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D45',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/2b/6f2d5ecdbaafee2b24c23c98f5b505/decompressed-1-UTR3100-JP-数量2-宝马头控制盒__Admi05C07DD55ee8_Admi05C07DD55ee8-None_1.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'A46',
              mergedCellAddress: 'A47',
              value: 'XJ20201203-393942-2',
              type: 3,
            },
            {
              address: 'B46',
              mergedCellAddress: 'B47',
              value: '2020 年 12 月 03 日',
              type: 3,
            },
            { address: 'I46', mergedCellAddress: 'I47', value: 0, type: 2 },
            {
              address: 'J46',
              mergedCellAddress: 'J47',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K46',
              mergedCellAddress: 'K47',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L46', mergedCellAddress: 'L47', value: 52, type: 2 },
            { address: 'C46', value: '4GDTU-工装-1.stl', type: 3 },
            { address: 'E46', value: 'UTR9000E-JP', type: 3 },
            { address: 'F46', value: '原色', type: 3 },
            { address: 'G46', value: 37, type: 2 },
            { address: 'H46', value: 1, type: 2 },
            { address: 'C47', value: '4GDTU-工装-2.stl', type: 3 },
            { address: 'E47', value: 'UTR9000E-JP', type: 3 },
            { address: 'F47', value: '原色', type: 3 },
            { address: 'G47', value: 3, type: 2 },
            { address: 'H47', value: 5, type: 2 },
            {
              address: 'D46',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/9a8e1bac6e304671662a9a24a13d991e/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI5YThlMWJhYzZlMzA0NjcxNjYyYTlhMjRhMTNkOTkxZSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.cu6ivpqbI6EQ99EWwpp0d_Vd9_i4bdwCpxRT2xsQ5Dc-SaoKx*-5e3HmqeHeQCa4OkafolqexMB07DXq0nRGpg&name=fixed-16069849715024GDTU-工装-1.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D47',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/ade297ff2fe32d9c1ed051de6f4bb286/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJhZGUyOTdmZjJmZTMyZDljMWVkMDUxZGU2ZjRiYjI4NiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.mCJm1ms9knmtIfVdVA4rrhfmfOfXB_7tczB-CTCHMdlNfftiQymheRsyspkwsuz-D97k_iYvbSOECzG9x5w0Ng&name=fixed-16069849755104GDTU-工装-2.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A48',
              mergedCellAddress: 'A51',
              value: 'XJ20201203-449667-6',
              type: 3,
            },
            {
              address: 'B48',
              mergedCellAddress: 'B51',
              value: '2020 年 12 月 03 日',
              type: 3,
            },
            { address: 'I48', mergedCellAddress: 'I51', value: 0, type: 2 },
            {
              address: 'J48',
              mergedCellAddress: 'J51',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K48',
              mergedCellAddress: 'K51',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L48', mergedCellAddress: 'L51', value: 36, type: 2 },
            {
              address: 'C48',
              value: '1-UTR3100-JP-数量 3-0901*box_v6**BOX1.stl',
              type: 3,
            },
            { address: 'E48', value: 'UTR3100-JP', type: 3 },
            { address: 'F48', value: '', type: 3 },
            { address: 'G48', value: 3, type: 2 },
            { address: 'H48', value: 3, type: 2 },
            {
              address: 'C49',
              value: '1-UTR3100-JP-数量 3-0901_box_v6**BOX2.stl',
              type: 3,
            },
            { address: 'E49', value: 'UTR3100-JP', type: 3 },
            { address: 'F49', value: '', type: 3 },
            { address: 'G49', value: 3, type: 2 },
            { address: 'H49', value: 3, type: 2 },
            {
              address: 'C50',
              value:
                '2-UTR3100-JP-数量 3-0901_box_v7-修改卡扣样式**AdmiACAAe695_AdmiACAAe695-None.stl',
              type: 3,
            },
            { address: 'E50', value: 'UTR3100-JP', type: 3 },
            { address: 'F50', value: '', type: 3 },
            { address: 'G50', value: 3, type: 2 },
            { address: 'H50', value: 3, type: 2 },
            {
              address: 'C51',
              value:
                '2-UTR3100-JP-数量 3-0901_box_v7-修改卡扣样式**AdmiACAAe695_AdmiACAAe695-None_1.stl',
              type: 3,
            },
            { address: 'E51', value: 'UTR3100-JP', type: 3 },
            { address: 'F51', value: '', type: 3 },
            { address: 'G51', value: 3, type: 2 },
            { address: 'H51', value: 3, type: 2 },
            {
              address: 'D48',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/95/a7fcba133d4ff2b7a3d4cdc21788d2/decompressed-1-UTR3100-JP-数量3-0901_box_v6__BOX1.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D49',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/6b/507f4567279642f3cca66eca388b07/decompressed-1-UTR3100-JP-数量3-0901_box_v6__BOX2.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D50',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/5d/b5b9cee6db35310d52681ffa81db12/decompressed-2-UTR3100-JP-数量3-0901_box_v7-修改卡扣样式__AdmiACAAe695_AdmiACAAe695-None.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D51',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/f0/08dcb4e5beb4bfcad4cabc6776813f/decompressed-2-UTR3100-JP-数量3-0901_box_v7-修改卡扣样式__AdmiACAAe695_AdmiACAAe695-None_1.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'A52',
              mergedCellAddress: 'A52',
              value: 'XJ20201203-475528-4',
              type: 3,
            },
            {
              address: 'B52',
              mergedCellAddress: 'B52',
              value: '2020 年 12 月 03 日',
              type: 3,
            },
            { address: 'I52', mergedCellAddress: 'I52', value: 0, type: 2 },
            {
              address: 'J52',
              mergedCellAddress: 'J52',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K52',
              mergedCellAddress: 'K52',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L52', mergedCellAddress: 'L52', value: 160, type: 2 },
            { address: 'C52', value: '52652120_04.step', type: 3 },
            { address: 'E52', value: 'UTR3100-JP', type: 3 },
            { address: 'F52', value: '原色', type: 3 },
            { address: 'G52', value: 4, type: 2 },
            { address: 'H52', value: 40, type: 2 },
            {
              address: 'D52',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/1f43fb6cd79e74c5cb4ce835035da7e0/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIxZjQzZmI2Y2Q3OWU3NGM1Y2I0Y2U4MzUwMzVkYTdlMCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.bnc5_Ezet7CKYYF4ZyOdZVw0m0AkL34bbkwMAXWa03F3FFfNLvqdBzBChcIZUMXxVpqeVXRnb9YFwnYRU3rd1Q&name=fixed-160698376650252652120_04.step.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A53',
              mergedCellAddress: 'A53',
              value: 'XJ20201203-755713-9',
              type: 3,
            },
            {
              address: 'B53',
              mergedCellAddress: 'B53',
              value: '2020 年 12 月 03 日',
              type: 3,
            },
            { address: 'I53', mergedCellAddress: 'I53', value: 0, type: 2 },
            {
              address: 'J53',
              mergedCellAddress: 'J53',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K53',
              mergedCellAddress: 'K53',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L53', mergedCellAddress: 'L53', value: 24, type: 2 },
            { address: 'C53', value: '亚克力中框.step', type: 3 },
            { address: 'E53', value: 'UTR3100-JP', type: 3 },
            { address: 'F53', value: '原色', type: 3 },
            { address: 'G53', value: 12, type: 2 },
            { address: 'H53', value: 2, type: 2 },
            {
              address: 'D53',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/359626031ddff788ce22b703eef8b110/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIzNTk2MjYwMzFkZGZmNzg4Y2UyMmI3MDNlZWY4YjExMCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.VxdLHWCv4_ymdHLwFaowI4aVPy0aZG8ELBqtGbTm1G2lhCoR7wW62vjFQFKVptUZjWQLxS7Y0DexkUe-dnpZbw&name=fixed-1607007953942亚克力中框.step.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A54',
              mergedCellAddress: 'A54',
              value: 'XJ20201203-789776-9',
              type: 3,
            },
            {
              address: 'B54',
              mergedCellAddress: 'B54',
              value: '2020 年 12 月 03 日',
              type: 3,
            },
            { address: 'I54', mergedCellAddress: 'I54', value: 0, type: 2 },
            {
              address: 'J54',
              mergedCellAddress: 'J54',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K54',
              mergedCellAddress: 'K54',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L54', mergedCellAddress: 'L54', value: 20, type: 2 },
            { address: 'C54', value: '雾化导管 1.STEP', type: 3 },
            { address: 'E54', value: 'UTR3100-JP', type: 3 },
            { address: 'F54', value: '原色', type: 3 },
            { address: 'G54', value: 20, type: 2 },
            { address: 'H54', value: 1, type: 2 },
            {
              address: 'D54',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/ec3100dd53429916d87e864b464b5022/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJlYzMxMDBkZDUzNDI5OTE2ZDg3ZTg2NGI0NjRiNTAyMiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.vGmrt0KfNbyWYdZB_zdCMQP9Pdb3rfgAbjDHqUU42uFBQ-pcyWMt73cq1GKV8DaHstp-2xffbC_g4BiSKWvVkg&name=fixed-1606981319330雾化导管1.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A55',
              mergedCellAddress: 'A55',
              value: 'XJ20201203-878799-0',
              type: 3,
            },
            {
              address: 'B55',
              mergedCellAddress: 'B55',
              value: '2020 年 12 月 03 日',
              type: 3,
            },
            { address: 'I55', mergedCellAddress: 'I55', value: 0, type: 2 },
            {
              address: 'J55',
              mergedCellAddress: 'J55',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K55',
              mergedCellAddress: 'K55',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L55', mergedCellAddress: 'L55', value: 30, type: 2 },
            { address: 'C55', value: 'zhijia-hanjie.stp', type: 3 },
            { address: 'E55', value: 'UTR3100-JP', type: 3 },
            { address: 'F55', value: '原色', type: 3 },
            { address: 'G55', value: 30, type: 2 },
            { address: 'H55', value: 1, type: 2 },
            {
              address: 'D55',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/6b93bca5b1575bb9b6f310c884df761c/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI2YjkzYmNhNWIxNTc1YmI5YjZmMzEwYzg4NGRmNzYxYyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.7mWybxvtJgGmarQTCNjhR8EbnBWB9mz4TtiWYJ13XP6Ldg8a8bFwiruZDy24DtBrVem1lyb05ShkmDalVdlz9g&name=fixed-1607006730034zhijia-hanjie.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A56',
              mergedCellAddress: 'A62',
              value: 'XJ20201203-918538-0',
              type: 3,
            },
            {
              address: 'B56',
              mergedCellAddress: 'B62',
              value: '2020 年 12 月 03 日',
              type: 3,
            },
            { address: 'I56', mergedCellAddress: 'I62', value: 0, type: 2 },
            {
              address: 'J56',
              mergedCellAddress: 'J62',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K56',
              mergedCellAddress: 'K62',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L56', mergedCellAddress: 'L62', value: 139, type: 2 },
            { address: 'C56', value: 'BACK-COVER_19.stp', type: 3 },
            { address: 'E56', value: 'UTR3100-JP', type: 3 },
            { address: 'F56', value: '原色', type: 3 },
            { address: 'G56', value: 6, type: 2 },
            { address: 'H56', value: 3, type: 2 },
            { address: 'C57', value: 'BOTTOM-COVER-OUTER-2_9.stp', type: 3 },
            { address: 'E57', value: 'UTR3100-JP', type: 3 },
            { address: 'F57', value: '原色', type: 3 },
            { address: 'G57', value: 16, type: 2 },
            { address: 'H57', value: 1, type: 2 },
            { address: 'C58', value: 'HOUSING-INNER_34_112.stp', type: 3 },
            { address: 'E58', value: 'UTR3100-JP', type: 3 },
            { address: 'F58', value: '原色', type: 3 },
            { address: 'G58', value: 5, type: 2 },
            { address: 'H58', value: 3, type: 2 },
            { address: 'C59', value: 'HOLDER_32_22.stp', type: 3 },
            { address: 'E59', value: 'UTR3100-JP', type: 3 },
            { address: 'F59', value: '原色', type: 3 },
            { address: 'G59', value: 3, type: 2 },
            { address: 'H59', value: 5, type: 2 },
            { address: 'C60', value: 'FIX-PAD-TOP_22-1.stp', type: 3 },
            { address: 'E60', value: 'UTR8100-透明-JP\\t', type: 3 },
            { address: 'F60', value: '原色', type: 3 },
            { address: 'G60', value: 8, type: 2 },
            { address: 'H60', value: 4, type: 2 },
            { address: 'C61', value: 'TOP-COVER-OUTER-2_14.stp', type: 3 },
            { address: 'E61', value: 'UTR3100-JP', type: 3 },
            { address: 'F61', value: '原色', type: 3 },
            { address: 'G61', value: 28, type: 2 },
            { address: 'H61', value: 1, type: 2 },
            { address: 'C62', value: 'SL-HOUDER_7_28.stp', type: 3 },
            { address: 'E62', value: 'UTR3100-JP', type: 3 },
            { address: 'F62', value: '原色', type: 3 },
            { address: 'G62', value: 3, type: 2 },
            { address: 'H62', value: 5, type: 2 },
            {
              address: 'D56',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/e9d687efdae247b9b39e86d883852365/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJlOWQ2ODdlZmRhZTI0N2I5YjM5ZTg2ZDg4Mzg1MjM2NSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.q0Pg9w1o8gfhPCA6FJ1C1fxjttoG_19TQMWJg5ICM-LX31axCGHsBUh3s_FtzIp8k7aU-ZgewsBoc8SYMr2B_g&name=fixed-1606965810278BACK-COVER_19.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D57',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/b4966a6e4204fd8e2dc3843fd81103bd/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJiNDk2NmE2ZTQyMDRmZDhlMmRjMzg0M2ZkODExMDNiZCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.mukqqHLob6sYKoNmccpFeaCIvIzMjDZ-VmqXejGMI-HOZ8MZK1TqZbh1wcGAzi3Y5AfxIrYfF3xZAwJ0Ekwg-g&name=fixed-1606965821350BOTTOM-COVER-OUTER-2_9.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D58',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/693f213676d4d9413db3d4cc06028411/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI2OTNmMjEzNjc2ZDRkOTQxM2RiM2Q0Y2MwNjAyODQxMSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.U9v0W6lIWw_HsD4DjiV3pf_9z-Yc-RH8n5ExZNSsLcirsrclO34ek5qLcRhSw00Ur6GbYyRFoV3AT4RMHB843A&name=fixed-1606965855386HOUSING-INNER_34_112.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D59',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/cce73b1c7b0024685489473a79e2394f/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJjY2U3M2IxYzdiMDAyNDY4NTQ4OTQ3M2E3OWUyMzk0ZiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.rR0QuU5__88rVcyw2syBxhLiIoQ_1UGDK_nLfx5jg88uvyv-Gm9urULfuBr-Wx6R3tyjopcfAKYPLG1B5p_ehQ&name=fixed-1606965844170HOLDER_32_22.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D60',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/3d9212bc566e8704cd789cfdb96dfedc/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIzZDkyMTJiYzU2NmU4NzA0Y2Q3ODljZmRiOTZkZmVkYyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.n4bI6H7hSSo4qXPyhM8Lr5KZYkSKSrvDrA8J5E9fg631xfNzmslk7uTrmuVw3RXbqWvR5fkoVllVrq3-XuAJaA&name=fixed-1606965832358FIX-PAD-TOP_22-1.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D61',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/d32d19759b66d159effa9e89f950a134/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkMzJkMTk3NTliNjZkMTU5ZWZmYTllODlmOTUwYTEzNCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.wCDP1W76Bpc9XFIVkjNYrLcEBNndMZOTI4KQt0DseF_gnKqXhMCjkHfvAPeSOwp7cxJ4Pzg2gyvQZgAYbJFHHA&name=fixed-1606965880374TOP-COVER-OUTER-2_14.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D62',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/0a41e4b2ce231d51a457e84dc4ce64ce/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIwYTQxZTRiMmNlMjMxZDUxYTQ1N2U4NGRjNGNlNjRjZSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.cuf9xiwf9Qy0LEI_wcnDuzOzDD2FJxDVLaN4MQZ59jbeSB1sUTzo7E2J2G5fEQopyozKZx0PNL2nEIGcvRiA8Q&name=fixed-1606965866070SL-HOUDER_7_28.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A63',
              mergedCellAddress: 'A66',
              value: 'XJ20201204-125775-5',
              type: 3,
            },
            {
              address: 'B63',
              mergedCellAddress: 'B66',
              value: '2020 年 12 月 04 日',
              type: 3,
            },
            { address: 'I63', mergedCellAddress: 'I66', value: 0, type: 2 },
            {
              address: 'J63',
              mergedCellAddress: 'J66',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K63',
              mergedCellAddress: 'K66',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L63', mergedCellAddress: 'L66', value: 315, type: 2 },
            { address: 'C63', value: 'BUTTON.STEP', type: 3 },
            { address: 'E63', value: 'UTR8100-半透明-JP', type: 3 },
            { address: 'F63', value: '原色', type: 3 },
            { address: 'G63', value: 3, type: 2 },
            { address: 'H63', value: 5, type: 2 },
            { address: 'C64', value: 'LOWER-CAP_NEW.STEP', type: 3 },
            { address: 'E64', value: 'DSM-Taurus-JP', type: 3 },
            { address: 'F64', value: '原色', type: 3 },
            { address: 'G64', value: 3, type: 2 },
            { address: 'H64', value: 5, type: 2 },
            { address: 'C65', value: 'LOWER_OD5.0.STEP', type: 3 },
            { address: 'E65', value: 'DSM-Taurus-JP', type: 3 },
            { address: 'F65', value: '原色', type: 3 },
            { address: 'G65', value: 35, type: 2 },
            { address: 'H65', value: 5, type: 2 },
            { address: 'C66', value: 'UPPER.STEP', type: 3 },
            { address: 'E66', value: 'DSM-Taurus-JP', type: 3 },
            { address: 'F66', value: '原色', type: 3 },
            { address: 'G66', value: 22, type: 2 },
            { address: 'H66', value: 5, type: 2 },
            {
              address: 'D63',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/8d2050b73a474e3b131c67273fc25ccc/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI4ZDIwNTBiNzNhNDc0ZTNiMTMxYzY3MjczZmMyNWNjYyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.IpkXp08rb9vxCOGzebSJXIsGVv4KiKGH476uj4YRXqm-kdvxJXpoZFTxqlrrF09VIST1Nry92BSTB-X346-ZpQ&name=fixed-1607049370830BUTTON.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D64',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/ae6c72887782de11480e55e4a5496abb/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJhZTZjNzI4ODc3ODJkZTExNDgwZTU1ZTRhNTQ5NmFiYiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.wVFMJwTwVjYGJWFMrmLTRH1yhV53tohY3-WaMcePCbE2oZZd9kHflr2RbqyGROkA5CX1-9_0FDTiicc0zgv1VA&name=fixed-1607049307518LOWER-CAP_NEW.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D65',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/e213af0f8b15e129d0b8f2276b7638fc/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJlMjEzYWYwZjhiMTVlMTI5ZDBiOGYyMjc2Yjc2MzhmYyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.avQ36SF8LNoqJJQNoK3M50xDwsYabgSruVOppyMbb5axYx0B0K6tRAG7ywBcvnKOu69xDQHBwRVIp71O8k8DbA&name=fixed-1607049260126LOWER_OD5.0.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D66',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/f09be2330a8f4d230fab49d01e95721b/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJmMDliZTIzMzBhOGY0ZDIzMGZhYjQ5ZDAxZTk1NzIxYiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.DONG7042QqdYbtxX4Kkxg0tNmATXd6PLyPikudUbUWavd5XDeChqFbx3T6qaZWhRbhGoYPfmXRfF3ELUK8o_9A&name=fixed-1607049200980UPPER.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A67',
              mergedCellAddress: 'A67',
              value: 'XJ20201204-542522-8',
              type: 3,
            },
            {
              address: 'B67',
              mergedCellAddress: 'B67',
              value: '2020 年 12 月 04 日',
              type: 3,
            },
            { address: 'I67', mergedCellAddress: 'I67', value: 0, type: 2 },
            {
              address: 'J67',
              mergedCellAddress: 'J67',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K67',
              mergedCellAddress: 'K67',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L67', mergedCellAddress: 'L67', value: 20, type: 2 },
            { address: 'C67', value: 'swenkongqihouke.stp', type: 3 },
            { address: 'E67', value: 'UTR3100-JP', type: 3 },
            { address: 'F67', value: '原色', type: 3 },
            { address: 'G67', value: 20, type: 2 },
            { address: 'H67', value: 1, type: 2 },
            {
              address: 'D67',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/ae9f16065869bab7a97b83fcd50915bd/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJhZTlmMTYwNjU4NjliYWI3YTk3YjgzZmNkNTA5MTViZCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.-k7ycYMYNBUVhe8vNF103n4f9nNMjM-kXS1UjVyEsdOtNWWGslJsP2UeCXSJpWhwXHLutTd1vYecmfFlb_PLCw&name=fixed-1607072093262swenkongqihouke.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A68',
              mergedCellAddress: 'A69',
              value: 'XJ20201205-295968-7',
              type: 3,
            },
            {
              address: 'B68',
              mergedCellAddress: 'B69',
              value: '2020 年 12 月 05 日',
              type: 3,
            },
            { address: 'I68', mergedCellAddress: 'I69', value: 0, type: 2 },
            {
              address: 'J68',
              mergedCellAddress: 'J69',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K68',
              mergedCellAddress: 'K69',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L68', mergedCellAddress: 'L69', value: 40, type: 2 },
            { address: 'C68', value: 'IES-1101.stp', type: 3 },
            { address: 'E68', value: 'UTR3100-JP', type: 3 },
            { address: 'F68', value: '原色', type: 3 },
            { address: 'G68', value: 36, type: 2 },
            { address: 'H68', value: 1, type: 2 },
            { address: 'C69', value: 'form.stp', type: 3 },
            { address: 'E69', value: 'UTR9000E-JP', type: 3 },
            { address: 'F69', value: '原色', type: 3 },
            { address: 'G69', value: 4, type: 2 },
            { address: 'H69', value: 1, type: 2 },
            {
              address: 'D68',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/d53dfaed8698e438637ad6ca572a84c0/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkNTNkZmFlZDg2OThlNDM4NjM3YWQ2Y2E1NzJhODRjMCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.x4uSFr0VhTrpozodWbVCIm0H4QmVis8u8cPfW-Rp0Aun12C-oJp9O_csQ8oLXt0n05GDyuQUu7flFmQFIF9w6A&name=fixed-1607137596009IES-1101.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D69',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/16367aa2f8b54a3d255b274e72994f78/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIxNjM2N2FhMmY4YjU0YTNkMjU1YjI3NGU3Mjk5NGY3OCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.Ol0Y7-3x6aDzp_Db2D9b1zhJUVn21wpo5UucNt0DVmgK_1Fl99wyqt3mMUnmHm-OCWMiG2Z3etbDQvkGvI99Dw&name=fixed-1607137605842form.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A70',
              mergedCellAddress: 'A71',
              value: 'XJ20201205-456331-0',
              type: 3,
            },
            {
              address: 'B70',
              mergedCellAddress: 'B71',
              value: '2020 年 12 月 05 日',
              type: 3,
            },
            { address: 'I70', mergedCellAddress: 'I71', value: 0, type: 2 },
            {
              address: 'J70',
              mergedCellAddress: 'J71',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K70',
              mergedCellAddress: 'K71',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L70', mergedCellAddress: 'L71', value: 350, type: 2 },
            { address: 'C70', value: 'cewendi.stp', type: 3 },
            { address: 'E70', value: 'UTR3100-JP', type: 3 },
            { address: 'F70', value: '原色', type: 3 },
            { address: 'G70', value: 4, type: 2 },
            { address: 'H70', value: 50, type: 2 },
            { address: 'C71', value: 'cewengai.stp', type: 3 },
            { address: 'E71', value: 'UTR3100-JP', type: 3 },
            { address: 'F71', value: '原色', type: 3 },
            { address: 'G71', value: 3, type: 2 },
            { address: 'H71', value: 50, type: 2 },
            {
              address: 'D70',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/85eed2fb2a35b1f43aed766ffd67273d/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI4NWVlZDJmYjJhMzViMWY0M2FlZDc2NmZmZDY3MjczZCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.o3xjQnU8-89zvIGz96ce0pyYqM_88Q-GRSDL2FJlb5u_maBbFkQhRkREQxET8IdLfZQL7jmrq9xaokyJTHAjyg&name=fixed-1607177466382cewendi.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D71',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/474260c46513f38608ae4e4958c9ede2/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI0NzQyNjBjNDY1MTNmMzg2MDhhZTRlNDk1OGM5ZWRlMiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.u6A3I_Fhum-QWiV1DHd2go46hUtVBJ2kYGg71Yw1G9MDF3ZHtIvA9mriW4lQQfEQ9DOnXimV4-iF1h6krVUxMQ&name=fixed-1607177477398cewengai.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A72',
              mergedCellAddress: 'A75',
              value: 'XJ20201206-527222-5',
              type: 3,
            },
            {
              address: 'B72',
              mergedCellAddress: 'B75',
              value: '2020 年 12 月 06 日',
              type: 3,
            },
            { address: 'I72', mergedCellAddress: 'I75', value: 0, type: 2 },
            {
              address: 'J72',
              mergedCellAddress: 'J75',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K72',
              mergedCellAddress: 'K75',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L72', mergedCellAddress: 'L75', value: 20, type: 2 },
            { address: 'C72', value: 'shell_1_of*针灸.stl', type: 3 },
            { address: 'E72', value: 'UTR3100-JP', type: 3 },
            { address: 'F72', value: '', type: 3 },
            { address: 'G72', value: 10, type: 2 },
            { address: 'H72', value: 1, type: 2 },
            { address: 'C73', value: 'shell*2_of*针灸.stl', type: 3 },
            { address: 'E73', value: 'UTR3100-JP', type: 3 },
            { address: 'F73', value: '', type: 3 },
            { address: 'G73', value: 4, type: 2 },
            { address: 'H73', value: 1, type: 2 },
            { address: 'C74', value: 'shell*3_of*针灸.stl', type: 3 },
            { address: 'E74', value: 'UTR3100-JP', type: 3 },
            { address: 'F74', value: '', type: 3 },
            { address: 'G74', value: 3, type: 2 },
            { address: 'H74', value: 1, type: 2 },
            { address: 'C75', value: 'shell*4_of*针灸.stl', type: 3 },
            { address: 'E75', value: 'UTR3100-JP', type: 3 },
            { address: 'F75', value: '', type: 3 },
            { address: 'G75', value: 3, type: 2 },
            { address: 'H75', value: 1, type: 2 },
            {
              address: 'D72',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/7a/0805eb0b5c1bb752bf33461da0d142/decompressed-shell_1_of*针灸.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw*100',
              },
              type: 11,
            },
            {
              address: 'D73',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/0c/f9968b2bff0b35217ccaffebfa6801/decompressed-shell_2_of*针灸.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw*100',
              },
              type: 11,
            },
            {
              address: 'D74',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/49/783917cf94e2bea37d52a879d179a1/decompressed-shell_3_of*针灸.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw*100',
              },
              type: 11,
            },
            {
              address: 'D75',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/0f/6835d4c1edfa84a53ba80961b15512/decompressed-shell_4_of*针灸.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw*100',
              },
              type: 11,
            },
            {
              address: 'A76',
              mergedCellAddress: 'A76',
              value: 'XJ20201206-932189-9',
              type: 3,
            },
            {
              address: 'B76',
              mergedCellAddress: 'B76',
              value: '2020 年 12 月 06 日',
              type: 3,
            },
            { address: 'I76', mergedCellAddress: 'I76', value: 0, type: 2 },
            {
              address: 'J76',
              mergedCellAddress: 'J76',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K76',
              mergedCellAddress: 'K76',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L76', mergedCellAddress: 'L76', value: 20, type: 2 },
            { address: 'C76', value: 'Base-ADC12-2.0.STP', type: 3 },
            { address: 'E76', value: 'UTR3100-JP', type: 3 },
            { address: 'F76', value: '原色', type: 3 },
            { address: 'G76', value: 20, type: 2 },
            { address: 'H76', value: 1, type: 2 },
            {
              address: 'D76',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/d0d7ee19efaa4fb9ada38e543bbc9aab/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkMGQ3ZWUxOWVmYWE0ZmI5YWRhMzhlNTQzYmJjOWFhYiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.ueCT10m9ch-rXN9vWCPFyCthNBpEAn-wadIYiQaSBU-nLdKRTylICg4ffL5cQvfIjJ7Lep0Y6x7ZWAOaVAZqQQ&name=fixed-1607203719282Base-ADC12-2.0.STP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A77',
              mergedCellAddress: 'A77',
              value: 'XJ20201206-964296-1',
              type: 3,
            },
            {
              address: 'B77',
              mergedCellAddress: 'B77',
              value: '2020 年 12 月 06 日',
              type: 3,
            },
            { address: 'I77', mergedCellAddress: 'I77', value: 0, type: 2 },
            {
              address: 'J77',
              mergedCellAddress: 'J77',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K77',
              mergedCellAddress: 'K77',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L77', mergedCellAddress: 'L77', value: 20, type: 2 },
            { address: 'C77', value: 'Cover-ABS-2.0.STP', type: 3 },
            { address: 'E77', value: 'UTR3100-JP', type: 3 },
            { address: 'F77', value: '原色', type: 3 },
            { address: 'G77', value: 20, type: 2 },
            { address: 'H77', value: 1, type: 2 },
            {
              address: 'D77',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/4e2e72f24c7f111cc838bf8bee8339d9/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI0ZTJlNzJmMjRjN2YxMTFjYzgzOGJmOGJlZTgzMzlkOSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.nLD_fio9f4afhClxRj60HvL6L827e5tsUSOfzvQiVOP5X1vRAWAMlYXD51LeIDYmtpknpgV7A-9hryaQaS0nVQ&name=fixed-1607203682498Cover-ABS-2.0.STP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A78',
              mergedCellAddress: 'A81',
              value: 'XJ20201207-254744-7',
              type: 3,
            },
            {
              address: 'B78',
              mergedCellAddress: 'B81',
              value: '2020 年 12 月 07 日',
              type: 3,
            },
            { address: 'I78', mergedCellAddress: 'I81', value: 0, type: 2 },
            {
              address: 'J78',
              mergedCellAddress: 'J81',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K78',
              mergedCellAddress: 'K81',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L78', mergedCellAddress: 'L81', value: 480, type: 2 },
            { address: 'C78', value: 'LT2.stl', type: 3 },
            { address: 'E78', value: 'UTR9000E-JP', type: 3 },
            { address: 'F78', value: '原色', type: 3 },
            { address: 'G78', value: 3, type: 2 },
            { address: 'H78', value: 40, type: 2 },
            { address: 'C79', value: 'LB2.stl', type: 3 },
            { address: 'E79', value: 'UTR9000E-JP', type: 3 },
            { address: 'F79', value: '原色', type: 3 },
            { address: 'G79', value: 3, type: 2 },
            { address: 'H79', value: 40, type: 2 },
            { address: 'C80', value: 'RB2.stl', type: 3 },
            { address: 'E80', value: 'UTR9000E-JP', type: 3 },
            { address: 'F80', value: '原色', type: 3 },
            { address: 'G80', value: 3, type: 2 },
            { address: 'H80', value: 40, type: 2 },
            { address: 'C81', value: 'RT2.stl', type: 3 },
            { address: 'E81', value: 'UTR9000E-JP', type: 3 },
            { address: 'F81', value: '原色', type: 3 },
            { address: 'G81', value: 3, type: 2 },
            { address: 'H81', value: 40, type: 2 },
            {
              address: 'D78',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/b53914fbe7ea6c75ee2077ce508cfb9b/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJiNTM5MTRmYmU3ZWE2Yzc1ZWUyMDc3Y2U1MDhjZmI5YiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.oks-TwCrWofHZFDb6zCRP7aFBKTyi0w4jMyPhVssLGHPvfeGeZmKgYLLgc10Bof4Wufy2b3Q2aKP1QlAf-r3FA&name=fixed-1607337831756LT2.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D79',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/7cc52d32b032ed1e60f6e28292bd8464/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI3Y2M1MmQzMmIwMzJlZDFlNjBmNmUyODI5MmJkODQ2NCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.meVPVq75sS-LifSaWyz5oQx-Rq8CzSs5yZovpR3ss5Oc0goDBemnLP6NpQCNpKoDlYrOBYOkR-WuV4QBlTpB2A&name=fixed-1607337822753LB2.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D80',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/23d05482c6baf70b961d7652e0acb5e3/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIyM2QwNTQ4MmM2YmFmNzBiOTYxZDc2NTJlMGFjYjVlMyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.s7qe6BMb5V3mLNkjGQKj10fCcUoBf7OJUhMDAQkJxSgRfGEUzQVZ1_sl8QY7namX-JWQpQnPMbOG6HaWRON7Ug&name=fixed-1607337826740RB2.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D81',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/2d45b996a5dcaa35fc3167719eea8c75/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIyZDQ1Yjk5NmE1ZGNhYTM1ZmMzMTY3NzE5ZWVhOGM3NSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.CJOZYyMgJAbpWmghs6Ex7MB6mcD_LnKNqZO5cVK31N0PPte22VQywXVVnoLs9R6A1ylU-Av9rHWgoxYT8akdfQ&name=fixed-1607337835765RT2.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A82',
              mergedCellAddress: 'A83',
              value: 'XJ20201207-255322-5',
              type: 3,
            },
            {
              address: 'B82',
              mergedCellAddress: 'B83',
              value: '2020 年 12 月 07 日',
              type: 3,
            },
            { address: 'I82', mergedCellAddress: 'I83', value: 32, type: 2 },
            {
              address: 'J82',
              mergedCellAddress: 'J83',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [{ text: '附加费：32 元 \\n' }] },
              type: 8,
            },
            {
              address: 'K82',
              mergedCellAddress: 'K83',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L82', mergedCellAddress: 'L83', value: 65, type: 2 },
            { address: 'C82', value: 'xiaochazi.stp', type: 3 },
            { address: 'E82', value: 'UTR8100-透明-JP\\t', type: 3 },
            { address: 'F82', value: '原色', type: 3 },
            { address: 'G82', value: 3, type: 2 },
            { address: 'H82', value: 6, type: 2 },
            { address: 'C83', value: 'gaizi.stp', type: 3 },
            { address: 'E83', value: 'DSM-Taurus-JP', type: 3 },
            { address: 'F83', value: '原色', type: 3 },
            { address: 'G83', value: 15, type: 2 },
            { address: 'H83', value: 1, type: 2 },
            {
              address: 'D82',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/5eacda1f34233f06df3c32f632de2471/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI1ZWFjZGExZjM0MjMzZjA2ZGYzYzMyZjYzMmRlMjQ3MSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.9NBzaQsPB_Zn-gF8ApG6AsI9RcEpwR_D7eJHbNjAfowIYL7gRCEG_RCLOhIWgWVlAHkc7wL7t19eD1tqk4J0ig&name=fixed-1607331120566xiaochazi.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D83',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/a3aac8337d65798401a5939bdca43da5/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJhM2FhYzgzMzdkNjU3OTg0MDFhNTkzOWJkY2E0M2RhNSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.JbiNMGBdyhwS6nMCr-b_QIbQ_n8MchqeB34Ka0ezYUEopCCN4SryX7E5vkHfqZddJQkbR3bmfLQ_YlzN8NY6NA&name=fixed-1607331187386gaizi.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A84',
              mergedCellAddress: 'A86',
              value: 'XJ20201207-351714-6',
              type: 3,
            },
            {
              address: 'B84',
              mergedCellAddress: 'B86',
              value: '2020 年 12 月 07 日',
              type: 3,
            },
            { address: 'I84', mergedCellAddress: 'I86', value: 0, type: 2 },
            {
              address: 'J84',
              mergedCellAddress: 'J86',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K84',
              mergedCellAddress: 'K86',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L84', mergedCellAddress: 'L86', value: 20, type: 2 },
            { address: 'C84', value: '活动卡环.STL', type: 3 },
            { address: 'E84', value: 'UTR9000E-JP', type: 3 },
            { address: 'F84', value: '原色', type: 3 },
            { address: 'G84', value: 7, type: 2 },
            { address: 'H84', value: 1, type: 2 },
            { address: 'C85', value: '主轴卡环.STL', type: 3 },
            { address: 'E85', value: 'UTR9000E-JP', type: 3 },
            { address: 'F85', value: '原色', type: 3 },
            { address: 'G85', value: 7, type: 2 },
            { address: 'H85', value: 1, type: 2 },
            { address: 'C86', value: '540 齿轮.stl', type: 3 },
            { address: 'E86', value: 'UTR9000E-JP', type: 3 },
            { address: 'F86', value: '原色', type: 3 },
            { address: 'G86', value: 6, type: 2 },
            { address: 'H86', value: 1, type: 2 },
            {
              address: 'D84',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/6d77a75b76a529f82e033043bc478236/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI2ZDc3YTc1Yjc2YTUyOWY4MmUwMzMwNDNiYzQ3ODIzNiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.TFmtcG5BjZAPP-rOXuuI4xHNcRk01cxXCS7NkT2gJRZ2rL0GoqhMO_rgH647k_IIvBvDW2k-mZ_vDEJ9q5VONg&name=fixed-1607313173908活动卡环.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D85',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/b838cacc3a7d94886770957074275f58/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJiODM4Y2FjYzNhN2Q5NDg4Njc3MDk1NzA3NDI3NWY1OCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.X0Mv9eBb0naqfMDG5hIbkeIE1T-hx5Y_oZltr8iaiREjhIqTZc7nLC2RgpO2WIFBB_XWJ17L4TVi5iyqR_Q6Xg&name=fixed-1607313129367主轴卡环.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D86',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/af0e3511968407d0172fe774d95eaff6/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJhZjBlMzUxMTk2ODQwN2QwMTcyZmU3NzRkOTVlYWZmNiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.mkh8_M38lH8B49nFsefJ2bNfslptP6rSq8Kyy3-bGR8tRBEGUJnR1UxBvH3uBueQBcuO0dQnHukDAzq7mEOlWg&name=fixed-1607313104189540齿轮.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A87',
              mergedCellAddress: 'A87',
              value: 'XJ20201207-364872-6',
              type: 3,
            },
            {
              address: 'B87',
              mergedCellAddress: 'B87',
              value: '2020 年 12 月 07 日',
              type: 3,
            },
            { address: 'I87', mergedCellAddress: 'I87', value: 0, type: 2 },
            {
              address: 'J87',
              mergedCellAddress: 'J87',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K87',
              mergedCellAddress: 'K87',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L87', mergedCellAddress: 'L87', value: 45, type: 2 },
            { address: 'C87', value: '遮板*model1.stp', type: 3 },
            { address: 'E87', value: 'UTR9000E-JP', type: 3 },
            { address: 'F87', value: '原色', type: 3 },
            { address: 'G87', value: 45, type: 2 },
            { address: 'H87', value: 1, type: 2 },
            {
              address: 'D87',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/39ea248b1930dda348ab2e56eaeac811/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIzOWVhMjQ4YjE5MzBkZGEzNDhhYjJlNTZlYWVhYzgxMSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.GNbBio_qXmX7vnZ0vlkPIAQVDIzf1irwCvRpgqWJz-r-8tG-5ulYvIBuNtrTMByWS_x6zb53pQCTD4EGL28JQA&name=fixed-1607305076538遮板_model1.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A88',
              mergedCellAddress: 'A89',
              value: 'XJ20201207-366623-7',
              type: 3,
            },
            {
              address: 'B88',
              mergedCellAddress: 'B89',
              value: '2020 年 12 月 07 日',
              type: 3,
            },
            { address: 'I88', mergedCellAddress: 'I89', value: 0, type: 2 },
            {
              address: 'J88',
              mergedCellAddress: 'J89',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K88',
              mergedCellAddress: 'K89',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L88', mergedCellAddress: 'L89', value: 42, type: 2 },
            { address: 'C88', value: '零件 1.STL', type: 3 },
            { address: 'E88', value: 'DSM 128-JP', type: 3 },
            { address: 'F88', value: '原色', type: 3 },
            { address: 'G88', value: 20, type: 2 },
            { address: 'H88', value: 1, type: 2 },
            { address: 'C89', value: '零件 3.STL', type: 3 },
            { address: 'E89', value: 'DSM 128-JP', type: 3 },
            { address: 'F89', value: '原色', type: 3 },
            { address: 'G89', value: 22, type: 2 },
            { address: 'H89', value: 1, type: 2 },
            {
              address: 'D88',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/39fe803cb756c5611b38ef894aa49e42/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIzOWZlODAzY2I3NTZjNTYxMWIzOGVmODk0YWE0OWU0MiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.LEHF9ewT_alz2ydoIQB_CYBXDi0QvAmM26GUqqS7aUxH63FI38oZsFJwOUUvZJVv1jPjxHMFfntZHEQF4UgBHQ&name=fixed-1607320049618零件1.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D89',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/9b7d8a22a290ba76aa17861b29b24844/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI5YjdkOGEyMmEyOTBiYTc2YWExNzg2MWIyOWIyNDg0NCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.D-bssUx4QDFD0LbDtlBvZOfIkwpXVPLcf*-FmEcDFtbB3H9LP4WYCwkXC3fYvJg-r0dSIlXGD7DhfTGvl9QAPQ&name=fixed-1607320045613 零件 3.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A90',
              mergedCellAddress: 'A90',
              value: 'XJ20201207-721924-6',
              type: 3,
            },
            {
              address: 'B90',
              mergedCellAddress: 'B90',
              value: '2020 年 12 月 07 日',
              type: 3,
            },
            { address: 'I90', mergedCellAddress: 'I90', value: 0, type: 2 },
            {
              address: 'J90',
              mergedCellAddress: 'J90',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K90',
              mergedCellAddress: 'K90',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L90', mergedCellAddress: 'L90', value: 100, type: 2 },
            { address: 'C90', value: '亚克力中框.step', type: 3 },
            { address: 'E90', value: 'UTR8100-透明-JP\\t', type: 3 },
            { address: 'F90', value: '原色', type: 3 },
            { address: 'G90', value: 50, type: 2 },
            { address: 'H90', value: 2, type: 2 },
            {
              address: 'D90',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/359626031ddff788ce22b703eef8b110/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIzNTk2MjYwMzFkZGZmNzg4Y2UyMmI3MDNlZWY4YjExMCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.VxdLHWCv4_ymdHLwFaowI4aVPy0aZG8ELBqtGbTm1G2lhCoR7wW62vjFQFKVptUZjWQLxS7Y0DexkUe-dnpZbw&name=fixed-1607337840050亚克力中框.step.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A91',
              mergedCellAddress: 'A91',
              value: 'XJ20201208-115684-5',
              type: 3,
            },
            {
              address: 'B91',
              mergedCellAddress: 'B91',
              value: '2020 年 12 月 08 日',
              type: 3,
            },
            { address: 'I91', mergedCellAddress: 'I91', value: 4, type: 2 },
            {
              address: 'J91',
              mergedCellAddress: 'J91',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [{ text: '后处理费：4 元 \\n' }] },
              type: 8,
            },
            {
              address: 'K91',
              mergedCellAddress: 'K91',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L91', mergedCellAddress: 'L91', value: 20, type: 2 },
            { address: 'C91', value: '块.STEP', type: 3 },
            { address: 'E91', value: 'UTR3100-JP', type: 3 },
            { address: 'F91', value: '原色', type: 3 },
            { address: 'G91', value: 4, type: 2 },
            { address: 'H91', value: 4, type: 2 },
            {
              address: 'D91',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/66368ad1bad176b01799d4c69e53d5e8/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI2NjM2OGFkMWJhZDE3NmIwMTc5OWQ0YzY5ZTUzZDVlOCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.an_Q5SJC_AtusnjRjSr6qNwxiP6QFbjjNod8ix5Ym1m6Q-A6bx6KR7KGIXKsz0DYJm7bZu6wTnvElY_u6vYFqw&name=fixed-1607431178610块.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A92',
              mergedCellAddress: 'A93',
              value: 'XJ20201208-714464-1',
              type: 3,
            },
            {
              address: 'B92',
              mergedCellAddress: 'B93',
              value: '2020 年 12 月 08 日',
              type: 3,
            },
            { address: 'I92', mergedCellAddress: 'I93', value: 0, type: 2 },
            {
              address: 'J92',
              mergedCellAddress: 'J93',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            { address: 'K92', mergedCellAddress: 'K93', value: '', type: 3 },
            { address: 'L92', mergedCellAddress: 'L93', value: 70, type: 2 },
            {
              address: 'C92',
              value:
                '1-UTR3100-JP-数量 10-光电暗盒 1130****__****1130**_**-_**_46.stl',
              type: 3,
            },
            { address: 'E92', value: 'UTR3100-JP', type: 3 },
            { address: 'F92', value: '', type: 3 },
            { address: 'G92', value: 4, type: 2 },
            { address: 'H92', value: 10, type: 2 },
            {
              address: 'C93',
              value:
                '1-UTR3100-JP-数量 10-光电暗盒 1130**____****1130**_**-_**_47.stl',
              type: 3,
            },
            { address: 'E93', value: 'UTR3100-JP', type: 3 },
            { address: 'F93', value: '', type: 3 },
            { address: 'G93', value: 3, type: 2 },
            { address: 'H93', value: 10, type: 2 },
            {
              address: 'D92',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/2c/160907f6242ca26b71e8e466587265/decompressed-1-UTR3100-JP-数量10-光电暗盒1130**____****1130**_**-_**_46.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D93',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/80/58a3b30c5b6dbd73c1b3166ac453b8/decompressed-1-UTR3100-JP-数量10-光电暗盒1130**____****1130**_**-_**_47.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'A94',
              mergedCellAddress: 'A95',
              value: 'XJ20201208-718117-5',
              type: 3,
            },
            {
              address: 'B94',
              mergedCellAddress: 'B95',
              value: '2020 年 12 月 08 日',
              type: 3,
            },
            { address: 'I94', mergedCellAddress: 'I95', value: 0, type: 2 },
            {
              address: 'J94',
              mergedCellAddress: 'J95',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K94',
              mergedCellAddress: 'K95',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L94', mergedCellAddress: 'L95', value: 350, type: 2 },
            { address: 'C94', value: 'D83 外支架.STEP', type: 3 },
            { address: 'E94', value: 'UTR3100-JP', type: 3 },
            { address: 'F94', value: '原色', type: 3 },
            { address: 'G94', value: 24, type: 2 },
            { address: 'H94', value: 10, type: 2 },
            { address: 'C95', value: 'A85 灯板支架.STEP', type: 3 },
            { address: 'E95', value: 'UTR3100-JP', type: 3 },
            { address: 'F95', value: '原色', type: 3 },
            { address: 'G95', value: 11, type: 2 },
            { address: 'H95', value: 10, type: 2 },
            {
              address: 'D94',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/1e74601bdac93bb59804efbf992e2253/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIxZTc0NjAxYmRhYzkzYmI1OTgwNGVmYmY5OTJlMjI1MyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.bx-SMml-p1NdKJNMTJQvmUJSvCncASpdzyZ2vhqKZ9Q4eSVVt2TlZ92ttd3ueU71_Jn2ngRGMYL0OPgHXzqm_g&name=fixed-1607389955702D83外支架.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D95',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/d21240fe3a725511b25c19b330718834/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkMjEyNDBmZTNhNzI1NTExYjI1YzE5YjMzMDcxODgzNCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.R--KyAouVQvOly9bLwr4wu-vBZeL4tQRqwtzEk8SZ905kTQKuIz-Wnt4G7DfVZbie4qi1WXGVLpXo4jtf3o7-A&name=fixed-1607389960810A85灯板支架.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A96',
              mergedCellAddress: 'A98',
              value: 'XJ20201208-985716-8',
              type: 3,
            },
            {
              address: 'B96',
              mergedCellAddress: 'B98',
              value: '2020 年 12 月 08 日',
              type: 3,
            },
            { address: 'I96', mergedCellAddress: 'I98', value: 0, type: 2 },
            {
              address: 'J96',
              mergedCellAddress: 'J98',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K96',
              mergedCellAddress: 'K98',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L96', mergedCellAddress: 'L98', value: 233, type: 2 },
            { address: 'C96', value: '外壳.STEP', type: 3 },
            { address: 'E96', value: 'UTR3100-JP', type: 3 },
            { address: 'F96', value: '原色', type: 3 },
            { address: 'G96', value: 36, type: 2 },
            { address: 'H96', value: 3, type: 2 },
            { address: 'C97', value: '排风管.STEP', type: 3 },
            { address: 'E97', value: 'UTR3100-JP', type: 3 },
            { address: 'F97', value: '原色', type: 3 },
            { address: 'G97', value: 12, type: 2 },
            { address: 'H97', value: 5, type: 2 },
            { address: 'C98', value: '排风管双工位.STEP', type: 3 },
            { address: 'E98', value: 'UTR3100-JP', type: 3 },
            { address: 'F98', value: '原色', type: 3 },
            { address: 'G98', value: 13, type: 2 },
            { address: 'H98', value: 5, type: 2 },
            {
              address: 'D96',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/f9b1548dd5215c4038e44209102f37e4/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJmOWIxNTQ4ZGQ1MjE1YzQwMzhlNDQyMDkxMDJmMzdlNCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.g-NroQgV8Darmeo0oqJYosdXKwEV8eqS80yrpSbMVxLaau6ae1AaIBSq3lXxt6w1ysbGJcO2X4RBP_JxZAW7LQ&name=fixed-1607417132627外壳.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D97',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/9a16e7d92a529fa6185b51d5292fd6fa/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI5YTE2ZTdkOTJhNTI5ZmE2MTg1YjUxZDUyOTJmZDZmYSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.5afeKJRv3xQVFe4VgrQALwUGZuz5DqNxmnSC_sJMMOzIA2AH0Cq5JltubCip2ztNDwFMs3CKDxntNsWhvyL7qA&name=fixed-1607417144180排风管.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D98',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/6cf1d784102184c7b018145a7e338614/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI2Y2YxZDc4NDEwMjE4NGM3YjAxODE0NWE3ZTMzODYxNCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.LHqQ2BLFLg-Ab0p31c3K-iG9OoU5CPcqO_V-6227iuBsUku3gBdbQUWdCt8QKtYX_Kw3oyadhVG_X8Wf_hM79Q&name=fixed-1607417153034排风管双工位.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A99',
              mergedCellAddress: 'A99',
              value: 'XJ20201209-259856-8',
              type: 3,
            },
            {
              address: 'B99',
              mergedCellAddress: 'B99',
              value: '2020 年 12 月 09 日',
              type: 3,
            },
            { address: 'I99', mergedCellAddress: 'I99', value: 0, type: 2 },
            {
              address: 'J99',
              mergedCellAddress: 'J99',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K99',
              mergedCellAddress: 'K99',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L99', mergedCellAddress: 'L99', value: 50, type: 2 },
            { address: 'C99', value: '零件 B 板.STL', type: 3 },
            { address: 'E99', value: 'UTR3100-JP', type: 3 },
            { address: 'F99', value: '原色', type: 3 },
            { address: 'G99', value: 50, type: 2 },
            { address: 'H99', value: 1, type: 2 },
            {
              address: 'D99',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/fc6eb61e09c9f9f125415a09d3fc6d2f/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJmYzZlYjYxZTA5YzlmOWYxMjU0MTVhMDlkM2ZjNmQyZiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.kZEjOroFMVM3nj*-yu6c9_TlrZYYJudRaIFAUZH8-LGta-k1fFMSh3cRZUIbuNZZkzn_CDFCBz0XoFO68yDflw&name=fixed-1607490692532 零件 B 板.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A100',
              mergedCellAddress: 'A102',
              value: 'XJ20201209-412664-X',
              type: 3,
            },
            {
              address: 'B100',
              mergedCellAddress: 'B102',
              value: '2020 年 12 月 09 日',
              type: 3,
            },
            { address: 'I100', mergedCellAddress: 'I102', value: 0, type: 2 },
            {
              address: 'J100',
              mergedCellAddress: 'J102',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K100',
              mergedCellAddress: 'K102',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L100', mergedCellAddress: 'L102', value: 45, type: 2 },
            { address: 'C100', value: '身体.step', type: 3 },
            { address: 'E100', value: 'UTR3100-JP', type: 3 },
            { address: 'F100', value: '原色', type: 3 },
            { address: 'G100', value: 3, type: 2 },
            { address: 'H100', value: 5, type: 2 },
            { address: 'C101', value: '支架.step', type: 3 },
            { address: 'E101', value: 'UTR3100-JP', type: 3 },
            { address: 'F101', value: '原色', type: 3 },
            { address: 'G101', value: 3, type: 2 },
            { address: 'H101', value: 5, type: 2 },
            { address: 'C102', value: '鹦鹉头 v3.step', type: 3 },
            { address: 'E102', value: 'UTR3100-JP', type: 3 },
            { address: 'F102', value: '原色', type: 3 },
            { address: 'G102', value: 3, type: 2 },
            { address: 'H102', value: 5, type: 2 },
            {
              address: 'D100',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/a3077ce5190b64dcf45c37a9de0177e9/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJhMzA3N2NlNTE5MGI2NGRjZjQ1YzM3YTlkZTAxNzdlOSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.Dj9Ujat1wu7k7e33FNOfvvqTgODJI9xkJkclETHr65mKpCDc4FE_7oU-uSTPxBq1p_8dxTvtuFniSUNsk2qmeg&name=fixed-1607447357751身体.step.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D101',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/224706e5b1c46d3e967678f2ef8fae6a/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIyMjQ3MDZlNWIxYzQ2ZDNlOTY3Njc4ZjJlZjhmYWU2YSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.d3NeEYVvqcTvhyUf6FMh7ZpuA4c_QOGvS4NPtUHMRdXOoQdhGTjlrqmcT4hsd5tmx-nONqPbR7UDhF8XwcdMHw&name=fixed-1607447362018支架.step.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D102',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/a8c4bde4c2864266822910b1773fb96c/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJhOGM0YmRlNGMyODY0MjY2ODIyOTEwYjE3NzNmYjk2YyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.AkW8rKQZejKE3xInUTtqolW3ywzsJIYrWlAmsrdfYpl0fwRrjsBBBg1SrYIW3eusYHN5g6QBQrILCDaDzGWAdQ&name=fixed-1607447365722鹦鹉头 v3.step.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A103',
              mergedCellAddress: 'A103',
              value: 'XJ20201209-428832-0',
              type: 3,
            },
            {
              address: 'B103',
              mergedCellAddress: 'B103',
              value: '2020 年 12 月 09 日',
              type: 3,
            },
            { address: 'I103', mergedCellAddress: 'I103', value: 0, type: 2 },
            {
              address: 'J103',
              mergedCellAddress: 'J103',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K103',
              mergedCellAddress: 'K103',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L103', mergedCellAddress: 'L103', value: 162, type: 2 },
            { address: 'C103', value: '零件 C 板.STL', type: 3 },
            { address: 'E103', value: 'UTR3100-JP', type: 3 },
            { address: 'F103', value: '原色', type: 3 },
            { address: 'G103', value: 162, type: 2 },
            { address: 'H103', value: 1, type: 2 },
            {
              address: 'D103',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/169d7ec8b4d2ae7ded26438c2e752122/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIxNjlkN2VjOGI0ZDJhZTdkZWQyNjQzOGMyZTc1MjEyMiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.ZPHYRKs6Nwu1eOcQGzoTvi8tvVQEgcfAjRo83UrDrCC435pbYJNc2jThVEoOLY6aNqBwQ-ZK7NyaBS2L3W5baQ&name=fixed-1607490755170零件C板.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A104',
              mergedCellAddress: 'A109',
              value: 'XJ20201209-552799-2',
              type: 3,
            },
            {
              address: 'B104',
              mergedCellAddress: 'B109',
              value: '2020 年 12 月 09 日',
              type: 3,
            },
            { address: 'I104', mergedCellAddress: 'I109', value: 0, type: 2 },
            {
              address: 'J104',
              mergedCellAddress: 'J109',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K104',
              mergedCellAddress: 'K109',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L104', mergedCellAddress: 'L109', value: 88, type: 2 },
            {
              address: 'C104',
              value:
                '1-UTR3100-JP-数量 1-3.5-TFT**aocE320518D1pde_aocE320518D1pde-None.stl',
              type: 3,
            },
            { address: 'E104', value: 'UTR3100-JP', type: 3 },
            { address: 'F104', value: '', type: 3 },
            { address: 'G104', value: 26, type: 2 },
            { address: 'H104', value: 1, type: 2 },
            {
              address: 'C105',
              value:
                '1-UTR3100-JP-数量 1-3.5-TFT**aocE320518D1pde_aocE320518D1pde-None.stl',
              type: 3,
            },
            { address: 'E105', value: 'UTR9000E-JP', type: 3 },
            { address: 'F105', value: '', type: 3 },
            { address: 'G105', value: 26, type: 2 },
            { address: 'H105', value: 1, type: 2 },
            {
              address: 'C106',
              value:
                '1-UTR3100-JP-数量 1-3.5-TFT**aocE320518D1pde_aocE320518D1pde-None_1.stl',
              type: 3,
            },
            { address: 'E106', value: 'UTR3100-JP', type: 3 },
            { address: 'F106', value: '', type: 3 },
            { address: 'G106', value: 15, type: 2 },
            { address: 'H106', value: 1, type: 2 },
            {
              address: 'C107',
              value:
                '1-UTR3100-JP-数量 1-3.5-TFT**aocE320518D1pde_aocE320518D1pde-None_1.stl',
              type: 3,
            },
            { address: 'E107', value: 'UTR9000E-JP', type: 3 },
            { address: 'F107', value: '', type: 3 },
            { address: 'G107', value: 15, type: 2 },
            { address: 'H107', value: 1, type: 2 },
            {
              address: 'C108',
              value:
                '1-UTR3100-JP-数量 1-3.5-TFT**aocE320518D1pde_aocE320518D1pde-None_2.stl',
              type: 3,
            },
            { address: 'E108', value: 'UTR3100-JP', type: 3 },
            { address: 'F108', value: '', type: 3 },
            { address: 'G108', value: 3, type: 2 },
            { address: 'H108', value: 1, type: 2 },
            {
              address: 'C109',
              value:
                '1-UTR3100-JP-数量 1-3.5-TFT**aocE320518D1pde_aocE320518D1pde-None_2.stl',
              type: 3,
            },
            { address: 'E109', value: 'UTR9000E-JP', type: 3 },
            { address: 'F109', value: '', type: 3 },
            { address: 'G109', value: 3, type: 2 },
            { address: 'H109', value: 1, type: 2 },
            {
              address: 'D104',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/65/4b61936ffb4e36dbbe4534e038c847/decompressed-1-UTR3100-JP-数量1-3.5-TFT**aocE320518D1pde_aocE320518D1pde-None.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D105',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/65/4b61936ffb4e36dbbe4534e038c847/decompressed-1-UTR3100-JP-数量1-3.5-TFT__aocE320518D1pde_aocE320518D1pde-None.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D106',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/23/d74ed3ac780709a42de54ee742fe9b/decompressed-1-UTR3100-JP-数量1-3.5-TFT__aocE320518D1pde_aocE320518D1pde-None_1.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D107',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/23/d74ed3ac780709a42de54ee742fe9b/decompressed-1-UTR3100-JP-数量1-3.5-TFT__aocE320518D1pde_aocE320518D1pde-None_1.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D108',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/10/ce368f97691dd4de05e289956a2abf/decompressed-1-UTR3100-JP-数量1-3.5-TFT__aocE320518D1pde_aocE320518D1pde-None_2.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D109',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/10/ce368f97691dd4de05e289956a2abf/decompressed-1-UTR3100-JP-数量1-3.5-TFT__aocE320518D1pde_aocE320518D1pde-None_2.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'A110',
              mergedCellAddress: 'A110',
              value: 'XJ20201209-697968-2',
              type: 3,
            },
            {
              address: 'B110',
              mergedCellAddress: 'B110',
              value: '2020 年 12 月 09 日',
              type: 3,
            },
            { address: 'I110', mergedCellAddress: 'I110', value: 0, type: 2 },
            {
              address: 'J110',
              mergedCellAddress: 'J110',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K110',
              mergedCellAddress: 'K110',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L110', mergedCellAddress: 'L110', value: 220, type: 2 },
            { address: 'C110', value: '零件 A 板.STL', type: 3 },
            { address: 'E110', value: 'UTR3100-JP', type: 3 },
            { address: 'F110', value: '原色', type: 3 },
            { address: 'G110', value: 220, type: 2 },
            { address: 'H110', value: 1, type: 2 },
            {
              address: 'D110',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/649aec8abf6c4b7d03531ea3d4a935cf/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI2NDlhZWM4YWJmNmM0YjdkMDM1MzFlYTNkNGE5MzVjZiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTQsImlhdCI6MTYwNzY1NzI5NH0.bl_fBL-pXhaWlrDSWDJqUErCYoim7GohLSdqR8AijLcbStWgb1NFTW_JyR-8ldg491Tl7s567oXqnsE-grrp_A&name=fixed-1607490251001零件A板.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A111',
              mergedCellAddress: 'A114',
              value: 'XJ20201209-952636-9',
              type: 3,
            },
            {
              address: 'B111',
              mergedCellAddress: 'B114',
              value: '2020 年 12 月 09 日',
              type: 3,
            },
            { address: 'I111', mergedCellAddress: 'I114', value: 0, type: 2 },
            {
              address: 'J111',
              mergedCellAddress: 'J114',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K111',
              mergedCellAddress: 'K114',
              value: '免费',
              type: 3,
            },
            { address: 'L111', mergedCellAddress: 'L114', value: 0, type: 2 },
            {
              address: 'C111',
              value: 'mg-35-r3n8c2z4t6-20201203.stp',
              type: 3,
            },
            { address: 'E111', value: '【耐高温】UTR Therm 1', type: 3 },
            { address: 'F111', value: '', type: 3 },
            { address: 'G111', value: 0, type: 2 },
            { address: 'H111', value: 1, type: 2 },
            { address: 'C112', value: 'ug-28-r3n7c2t2-20201209.stp', type: 3 },
            { address: 'E112', value: '【耐高温】UTR Therm 1', type: 3 },
            { address: 'F112', value: '', type: 3 },
            { address: 'G112', value: 0, type: 2 },
            { address: 'H112', value: 1, type: 2 },
            {
              address: 'C113',
              value: 'ug-35-r3n8c2z4t2-20201209.stp',
              type: 3,
            },
            { address: 'E113', value: '【耐高温】UTR Therm 1', type: 3 },
            { address: 'F113', value: '', type: 3 },
            { address: 'G113', value: 0, type: 2 },
            { address: 'H113', value: 1, type: 2 },
            {
              address: 'C114',
              value: 'ug-35-r3n8c2z4t4-20201203.stp',
              type: 3,
            },
            { address: 'E114', value: '【耐高温】UTR Therm 1', type: 3 },
            { address: 'F114', value: '', type: 3 },
            { address: 'G114', value: 0, type: 2 },
            { address: 'H114', value: 1, type: 2 },
            {
              address: 'D111',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/dd/d261a97eed6149f5981ba4933ddc95/decompressed-mg-35-r3n8c2z4t6-20201203.stp.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D112',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/38/e23413bc6aad7b456b540855cd19f0/decompressed-ug-28-r3n7c2t2-20201209.stp.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D113',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/b2/903a3d0eda114ed215f874b748f9fb/decompressed-ug-35-r3n8c2z4t2-20201209.stp.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D114',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/fd/9bb60d8eac137c2aecf8c4db5678d7/decompressed-ug-35-r3n8c2z4t4-20201203.stp.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'A115',
              mergedCellAddress: 'A116',
              value: 'XJ20201209-976832-9',
              type: 3,
            },
            {
              address: 'B115',
              mergedCellAddress: 'B116',
              value: '2020 年 12 月 09 日',
              type: 3,
            },
            { address: 'I115', mergedCellAddress: 'I116', value: 0, type: 2 },
            {
              address: 'J115',
              mergedCellAddress: 'J116',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K115',
              mergedCellAddress: 'K116',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L115', mergedCellAddress: 'L116', value: 30, type: 2 },
            { address: 'C115', value: '油门误踩盖板 B.STL', type: 3 },
            { address: 'E115', value: 'UTR3100-JP', type: 3 },
            { address: 'F115', value: '原色', type: 3 },
            { address: 'G115', value: 3, type: 2 },
            { address: 'H115', value: 5, type: 2 },
            { address: 'C116', value: '油门误踩盖板 A.STL', type: 3 },
            { address: 'E116', value: 'UTR3100-JP', type: 3 },
            { address: 'F116', value: '原色', type: 3 },
            { address: 'G116', value: 3, type: 2 },
            { address: 'H116', value: 5, type: 2 },
            {
              address: 'D115',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/2aeca72b4452f94a166e01b179871f86/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIyYWVjYTcyYjQ0NTJmOTRhMTY2ZTAxYjE3OTg3MWY4NiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.WcQLQ3VLXPy3wcb-zP7t8r-1liI1dVJjF1dkdm3vpbzsD9BS1agHUAGbt5EmX9GtCIGib_rl5qlxZtSBTitN3A&name=fixed-1607506907930油门误踩盖板B.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D116',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/3944ee66db565c0a3e5a76dc755b516b/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIzOTQ0ZWU2NmRiNTY1YzBhM2U1YTc2ZGM3NTViNTE2YiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.znCnGXpxJwZLhr4fFa7VcTPx6EMry19t05UCyNoXbIXB6cUQliZH-q_bzA0rt4WH5MF6xLiyQDsAGXBRmKaTpw&name=fixed-1607506900918油门误踩盖板A.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A117',
              mergedCellAddress: 'A118',
              value: 'XJ20201210-239421-5',
              type: 3,
            },
            {
              address: 'B117',
              mergedCellAddress: 'B118',
              value: '2020 年 12 月 10 日',
              type: 3,
            },
            { address: 'I117', mergedCellAddress: 'I118', value: 0, type: 2 },
            {
              address: 'J117',
              mergedCellAddress: 'J118',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K117',
              mergedCellAddress: 'K118',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L117', mergedCellAddress: 'L118', value: 308, type: 2 },
            { address: 'C117', value: '208 底板.stl', type: 3 },
            { address: 'E117', value: 'UTR3100-JP', type: 3 },
            { address: 'F117', value: '原色', type: 3 },
            { address: 'G117', value: 170, type: 2 },
            { address: 'H117', value: 1, type: 2 },
            { address: 'C118', value: '磁铁槽(4) (1).stl', type: 3 },
            { address: 'E118', value: 'UTR3100-JP', type: 3 },
            { address: 'F118', value: '原色', type: 3 },
            { address: 'G118', value: 69, type: 2 },
            { address: 'H118', value: 2, type: 2 },
            {
              address: 'D117',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/aac74ba74e554302da7841562543c0f1/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJhYWM3NGJhNzRlNTU0MzAyZGE3ODQxNTYyNTQzYzBmMSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.vyepZuj_01H2Jl3gKg309CX94RMcwKrkxIV-yFM07EuUVY4GWTmQyDzXf_vayOkIYkKZTfdOVv2bbfQWPwnx0A&name=fixed-1607567546702208底板.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D118',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/815478bf979646b2c74cd51cf1934a6f/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI4MTU0NzhiZjk3OTY0NmIyYzc0Y2Q1MWNmMTkzNGE2ZiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.e1DkPb9AU1MSieKAVEYUMunZ3DoRZNUklZPYY_H8aPWu7dBfExCXA4XC3zT5KLDvUNACOxwbx_49gCrdjDUESQ&name=fixed-1607567550678磁铁槽(4) (1).stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A119',
              mergedCellAddress: 'A119',
              value: 'XJ20201210-246239-X',
              type: 3,
            },
            {
              address: 'B119',
              mergedCellAddress: 'B119',
              value: '2020 年 12 月 10 日',
              type: 3,
            },
            { address: 'I119', mergedCellAddress: 'I119', value: 0, type: 2 },
            {
              address: 'J119',
              mergedCellAddress: 'J119',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K119',
              mergedCellAddress: 'K119',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L119', mergedCellAddress: 'L119', value: 34, type: 2 },
            { address: 'C119', value: 'pingmubangz.stp', type: 3 },
            { address: 'E119', value: 'UTR3100-JP', type: 3 },
            { address: 'F119', value: '原色', type: 3 },
            { address: 'G119', value: 34, type: 2 },
            { address: 'H119', value: 1, type: 2 },
            {
              address: 'D119',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/0de02e5236b8bbcf93807ecc30b0c28e/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIwZGUwMmU1MjM2YjhiYmNmOTM4MDdlY2MzMGIwYzI4ZSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.IkfznGUxjf_xwPBSQlXrZUZjAjAalL2oF-a_ZJD-2vpluPNoXFEP7qPW3KTT2PqfiU7OCnzd4qq9NB59zBUQXA&name=fixed-1607609106886pingmubangz.stp.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A120',
              mergedCellAddress: 'A125',
              value: 'XJ20201210-377158-9',
              type: 3,
            },
            {
              address: 'B120',
              mergedCellAddress: 'B125',
              value: '2020 年 12 月 10 日',
              type: 3,
            },
            { address: 'I120', mergedCellAddress: 'I125', value: 100, type: 2 },
            {
              address: 'J120',
              mergedCellAddress: 'J125',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [{ text: '附加费：100 元 \\n' }] },
              type: 8,
            },
            {
              address: 'K120',
              mergedCellAddress: 'K125',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L120', mergedCellAddress: 'L125', value: 593, type: 2 },
            { address: 'C120', value: '头部屏幕罩.STEP', type: 3 },
            { address: 'E120', value: 'UTR3100-JP', type: 3 },
            { address: 'F120', value: '原色', type: 3 },
            { address: 'G120', value: 51, type: 2 },
            { address: 'H120', value: 1, type: 2 },
            { address: 'C121', value: '屏幕后盖.STEP', type: 3 },
            { address: 'E121', value: 'UTR3100-JP', type: 3 },
            { address: 'F121', value: '原色', type: 3 },
            { address: 'G121', value: 97, type: 2 },
            { address: 'H121', value: 1, type: 2 },
            { address: 'C122', value: '脖子通道.STEP', type: 3 },
            { address: 'E122', value: 'UTR3100-JP', type: 3 },
            { address: 'F122', value: '原色', type: 3 },
            { address: 'G122', value: 87, type: 2 },
            { address: 'H122', value: 1, type: 2 },
            { address: 'C123', value: '屏幕前盖.STEP', type: 3 },
            { address: 'E123', value: 'UTR3100-JP', type: 3 },
            { address: 'F123', value: '原色', type: 3 },
            { address: 'G123', value: 80, type: 2 },
            { address: 'H123', value: 1, type: 2 },
            { address: 'C124', value: '6800 轴承套组合.STEP', type: 3 },
            { address: 'E124', value: 'UTR3100-JP', type: 3 },
            { address: 'F124', value: '原色', type: 3 },
            { address: 'G124', value: 2, type: 2 },
            { address: 'H124', value: 5, type: 2 },
            { address: 'C125', value: '后盖.STEP', type: 3 },
            { address: 'E125', value: 'UTR3100-JP', type: 3 },
            { address: 'F125', value: '原色', type: 3 },
            { address: 'G125', value: 168, type: 2 },
            { address: 'H125', value: 1, type: 2 },
            {
              address: 'D120',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/7761caea6c37fe47aa5d09ed31f15d08/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI3NzYxY2FlYTZjMzdmZTQ3YWE1ZDA5ZWQzMWYxNWQwOCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.5e3G49I8h4Fu37KKEelzR2V9rsM7ZeSRTCt1e_uq8P0UYqL6t3e2o9czs6e9zBHtO2dHP3l_zMFlhTD5k1JcCQ&name=fixed-1607582789486头部屏幕罩.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D121',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/dee2376c03557797d7176934f02fbe2b/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkZWUyMzc2YzAzNTU3Nzk3ZDcxNzY5MzRmMDJmYmUyYiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.60CVpU19vI3XoZIsC5IebqfkwmzmT1zTI7NQos4sNOkdS5petWK-HF6IapU9IvfTDwUBklbu25xiQKUTs37G5Q&name=fixed-1607582794890屏幕后盖.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D122',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/3cd7fd11efa88d5b3766bccc2147c3f9/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIzY2Q3ZmQxMWVmYTg4ZDViMzc2NmJjY2MyMTQ3YzNmOSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.MSuW-eXdKcAQbX81CV7FGmMjfDuqz-NjyFY4sRbs5P2gOA8pAxMYTUmStxJMVo_L3WKH7thHxOVGEo0veKekbw&name=fixed-1607582807318脖子通道.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D123',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/906de83bd1daa31a5681530287517642/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI5MDZkZTgzYmQxZGFhMzFhNTY4MTUzMDI4NzUxNzY0MiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.OD02EWnOSd_cX2EOnKlTgL1e87W14BN3X6eva40zqWSubshe0oCqq8ypsThsAZnqZJf_dyGRnFCuFdBp3drdsw&name=fixed-1607582802738屏幕前盖.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D124',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/b80eb687b571b6ed377d52f7fe274707/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJiODBlYjY4N2I1NzFiNmVkMzc3ZDUyZjdmZTI3NDcwNyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.j9EMUb3Yr_8lA3TGbvN4nx4_yGSkZVnyc7oJYpCy5oBsTDr0DcEOEzb_wLzJH274bhTDmXXnQ1mx_HhZXmoRew&name=fixed-16075828104306800轴承套组合.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D125',
              value: {
                src:
                  'https://gateway.unionfab.com/file/md5/44eed31c1b841ad9596113390253d01f/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI0NGVlZDMxYzFiODQxYWQ5NTk2MTEzMzkwMjUzZDAxZiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDgyNjIwOTMsImlhdCI6MTYwNzY1NzI5M30.e581q3Mn49xDM-Mer3Wj05ZVFo2kJy42REMdlfjBnhLkJ1LfQJ20BJpfilU0CjMy_NVWUOyHrAn7sTK_Mmd_Cg&name=fixed-1607582800067后盖.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A126',
              mergedCellAddress: 'A129',
              value: 'XJ20201210-718516-X',
              type: 3,
            },
            {
              address: 'B126',
              mergedCellAddress: 'B129',
              value: '2020 年 12 月 10 日',
              type: 3,
            },
            { address: 'I126', mergedCellAddress: 'I129', value: 0, type: 2 },
            {
              address: 'J126',
              mergedCellAddress: 'J129',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K126',
              mergedCellAddress: 'K129',
              value: '免费',
              type: 3,
            },
            { address: 'L126', mergedCellAddress: 'L129', value: 0, type: 2 },
            {
              address: 'C126',
              value: 'mg-35-r3n8c2z4t6-20201203.stp',
              type: 3,
            },
            { address: 'E126', value: '【耐高温】UTR Therm 1', type: 3 },
            { address: 'F126', value: '', type: 3 },
            { address: 'G126', value: 0, type: 2 },
            { address: 'H126', value: 4, type: 2 },
            { address: 'C127', value: 'ug-28-r3n7c2t2-20201209.stp', type: 3 },
            { address: 'E127', value: '【耐高温】UTR Therm 1', type: 3 },
            { address: 'F127', value: '', type: 3 },
            { address: 'G127', value: 0, type: 2 },
            { address: 'H127', value: 4, type: 2 },
            {
              address: 'C128',
              value: 'ug-35-r3n8c2z4t2-20201209.stp',
              type: 3,
            },
            { address: 'E128', value: '【耐高温】UTR Therm 1', type: 3 },
            { address: 'F128', value: '', type: 3 },
            { address: 'G128', value: 0, type: 2 },
            { address: 'H128', value: 4, type: 2 },
            {
              address: 'C129',
              value: 'ug-35-r3n8c2z4t4-20201203.stp',
              type: 3,
            },
            { address: 'E129', value: '【耐高温】UTR Therm 1', type: 3 },
            { address: 'F129', value: '', type: 3 },
            { address: 'G129', value: 0, type: 2 },
            { address: 'H129', value: 4, type: 2 },
            {
              address: 'D126',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/dd/d261a97eed6149f5981ba4933ddc95/decompressed-mg-35-r3n8c2z4t6-20201203.stp.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D127',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/38/e23413bc6aad7b456b540855cd19f0/decompressed-ug-28-r3n7c2t2-20201209.stp.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D128',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/b2/903a3d0eda114ed215f874b748f9fb/decompressed-ug-35-r3n8c2z4t2-20201209.stp.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D129',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/fd/9bb60d8eac137c2aecf8c4db5678d7/decompressed-ug-35-r3n8c2z4t4-20201203.stp.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'A130',
              mergedCellAddress: 'A131',
              value: 'XJ20201211-758244-8',
              type: 3,
            },
            {
              address: 'B130',
              mergedCellAddress: 'B131',
              value: '2020 年 12 月 11 日',
              type: 3,
            },
            { address: 'I130', mergedCellAddress: 'I131', value: 0, type: 2 },
            {
              address: 'J130',
              mergedCellAddress: 'J131',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K130',
              mergedCellAddress: 'K131',
              value: '月结 30 天(发票日）',
              type: 3,
            },
            { address: 'L130', mergedCellAddress: 'L131', value: 20, type: 2 },
            {
              address: 'C130',
              value: '1-UTR3100-JP-数量 2-dz-1211**DZ-1210.stl',
              type: 3,
            },
            { address: 'E130', value: 'UTR3100-JP', type: 3 },
            { address: 'F130', value: '', type: 3 },
            { address: 'G130', value: 4, type: 2 },
            { address: 'H130', value: 2, type: 2 },
            {
              address: 'C131',
              value: '2-UTR3100-JP-数量 3-wg-1211**WG-1210.stl',
              type: 3,
            },
            { address: 'E131', value: 'UTR3100-JP', type: 3 },
            { address: 'F131', value: '', type: 3 },
            { address: 'G131', value: 4, type: 2 },
            { address: 'H131', value: 3, type: 2 },
            {
              address: 'D130',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/ed/7a91e5297439bbfb1240faa9b097c7/decompressed-1-UTR3100-JP-数量2-dz-1211__DZ-1210.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D131',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/34/b8ded603933040468dd7b615a4fd96/decompressed-2-UTR3100-JP-数量3-wg-1211__WG-1210.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
          ],
        },
      ],
    };

    const g = new ExcelGenerator(
      new WorkbookDO(jsonObj),
      path.resolve(__dirname, 'test.xlsx'),
    );

    await g.generateByExcelJs();
  });
});
