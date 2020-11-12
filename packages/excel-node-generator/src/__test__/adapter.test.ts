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
          ],
          cells: [
            {
              address: 'A1',
              mergedCellAddress: 'H1',
              style: { alignment: { horizontal: 'left', wrapText: true } },
              value: {
                richText: [
                  {
                    font: { size: 16, name: '宋体' },
                    text: '樱方（上海）智能科技有限公司 \n',
                  },
                  { text: '\n' },
                  { text: '\n' },
                  {
                    font: { size: 12 },
                    text: '账单日期：2020-09-01~2020-09-30 \n',
                  },
                  {
                    font: { size: 12 },
                    text: '导出时间：2020/11/12 15:11 \n',
                  },
                  {
                    font: {
                      size: 12,
                      color: { argb: 'DC143C' },
                      name: '宋体',
                    },
                    text: '账单总金额：￥2245 \n',
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
              mergedCellAddress: 'A9',
              value: 'XJ20200904-379418-X',
              type: 3,
            },
            {
              address: 'B3',
              mergedCellAddress: 'B9',
              value: '2020 年 09 月 04 日',
              type: 3,
            },
            { address: 'I3', mergedCellAddress: 'I9', value: 12, type: 2 },
            {
              address: 'J3',
              mergedCellAddress: 'J9',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [{ text: '物流费：12 元 \n' }] },
              type: 8,
            },
            {
              address: 'K3',
              mergedCellAddress: 'K9',
              value: '月结30天(发票日）',
              type: 3,
            },
            { address: 'L3', mergedCellAddress: 'L9', value: 197, type: 2 },
            { address: 'C3', value: 'dianjiduangai-3 1件.STL', type: 3 },
            { address: 'E3', value: '【白料】UTR 3100', type: 3 },
            { address: 'F3', value: '', type: 3 },
            { address: 'G3', value: 40.57, type: 2 },
            { address: 'H3', value: 1, type: 2 },
            { address: 'C4', value: 'dianjiduangai-4  1件.STL', type: 3 },
            { address: 'E4', value: '【白料】UTR 3100', type: 3 },
            { address: 'F4', value: '', type: 3 },
            { address: 'G4', value: 32.12, type: 2 },
            { address: 'H4', value: 1, type: 2 },
            { address: 'C5', value: 'gear17  3件.STL', type: 3 },
            { address: 'E5', value: '【白料】UTR 3100', type: 3 },
            { address: 'F5', value: '', type: 3 },
            { address: 'G5', value: 1.02, type: 2 },
            { address: 'H5', value: 3, type: 2 },
            { address: 'C6', value: 'gear18  3件.STL', type: 3 },
            { address: 'E6', value: '【白料】UTR 3100', type: 3 },
            { address: 'F6', value: '', type: 3 },
            { address: 'G6', value: 1.16, type: 2 },
            { address: 'H6', value: 3, type: 2 },
            { address: 'C7', value: 'gear55  1件.STL', type: 3 },
            { address: 'E7', value: '【白料】UTR 3100', type: 3 },
            { address: 'F7', value: '', type: 3 },
            { address: 'G7', value: 51.41, type: 2 },
            { address: 'H7', value: 1, type: 2 },
            { address: 'C8', value: 'gear57   1件.STL', type: 3 },
            { address: 'E8', value: '【白料】UTR 3100', type: 3 },
            { address: 'F8', value: '', type: 3 },
            { address: 'G8', value: 21.52, type: 2 },
            { address: 'H8', value: 1, type: 2 },
            { address: 'C9', value: 'planet carrier   1件.STL', type: 3 },
            { address: 'E9', value: '【白料】UTR 3100', type: 3 },
            { address: 'F9', value: '', type: 3 },
            { address: 'G9', value: 32.84, type: 2 },
            { address: 'H9', value: 1, type: 2 },
            {
              address: 'D3',
              value: {
                src:
                  'http://10.0.30.250:8081/file/md5/d41d8cd98f00b204e9800998ecf8427e/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkNDFkOGNkOThmMDBiMjA0ZTk4MDA5OThlY2Y4NDI3ZSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDU3Njk5MTcsImlhdCI6MTYwNTE2NTExN30.4DvLXXt8k3aRq1I8liwU3Wd4rZTYQ0W2NEMNSk-dt-_5GJzb6_uILrqUmKUQJOGbRyoQCnsa-VSSBjpOlgHOrw&name=dianjiduangai-3 1件.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D4',
              value: {
                src:
                  'http://10.0.30.250:8081/file/md5/d41d8cd98f00b204e9800998ecf8427e/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkNDFkOGNkOThmMDBiMjA0ZTk4MDA5OThlY2Y4NDI3ZSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDU3Njk5MTcsImlhdCI6MTYwNTE2NTExN30.4DvLXXt8k3aRq1I8liwU3Wd4rZTYQ0W2NEMNSk-dt-_5GJzb6_uILrqUmKUQJOGbRyoQCnsa-VSSBjpOlgHOrw&name=dianjiduangai-4  1件.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D5',
              value: {
                src:
                  'http://10.0.30.250:8081/file/md5/d41d8cd98f00b204e9800998ecf8427e/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkNDFkOGNkOThmMDBiMjA0ZTk4MDA5OThlY2Y4NDI3ZSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDU3Njk5MTcsImlhdCI6MTYwNTE2NTExN30.4DvLXXt8k3aRq1I8liwU3Wd4rZTYQ0W2NEMNSk-dt-_5GJzb6_uILrqUmKUQJOGbRyoQCnsa-VSSBjpOlgHOrw&name=gear17  3件.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D6',
              value: {
                src:
                  'http://10.0.30.250:8081/file/md5/d41d8cd98f00b204e9800998ecf8427e/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkNDFkOGNkOThmMDBiMjA0ZTk4MDA5OThlY2Y4NDI3ZSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDU3Njk5MTcsImlhdCI6MTYwNTE2NTExN30.4DvLXXt8k3aRq1I8liwU3Wd4rZTYQ0W2NEMNSk-dt-_5GJzb6_uILrqUmKUQJOGbRyoQCnsa-VSSBjpOlgHOrw&name=gear18  3件.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D7',
              value: {
                src:
                  'http://10.0.30.250:8081/file/md5/d41d8cd98f00b204e9800998ecf8427e/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkNDFkOGNkOThmMDBiMjA0ZTk4MDA5OThlY2Y4NDI3ZSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDU3Njk5MTcsImlhdCI6MTYwNTE2NTExN30.4DvLXXt8k3aRq1I8liwU3Wd4rZTYQ0W2NEMNSk-dt-_5GJzb6_uILrqUmKUQJOGbRyoQCnsa-VSSBjpOlgHOrw&name=gear55  1件.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D8',
              value: {
                src:
                  'http://10.0.30.250:8081/file/md5/d41d8cd98f00b204e9800998ecf8427e/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkNDFkOGNkOThmMDBiMjA0ZTk4MDA5OThlY2Y4NDI3ZSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDU3Njk5MTcsImlhdCI6MTYwNTE2NTExN30.4DvLXXt8k3aRq1I8liwU3Wd4rZTYQ0W2NEMNSk-dt-_5GJzb6_uILrqUmKUQJOGbRyoQCnsa-VSSBjpOlgHOrw&name=gear57   1件.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D9',
              value: {
                src:
                  'http://10.0.30.250:8081/file/md5/d41d8cd98f00b204e9800998ecf8427e/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkNDFkOGNkOThmMDBiMjA0ZTk4MDA5OThlY2Y4NDI3ZSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDU3Njk5MTcsImlhdCI6MTYwNTE2NTExN30.4DvLXXt8k3aRq1I8liwU3Wd4rZTYQ0W2NEMNSk-dt-_5GJzb6_uILrqUmKUQJOGbRyoQCnsa-VSSBjpOlgHOrw&name=planet carrier   1件.STL.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A10',
              mergedCellAddress: 'A14',
              value: 'XJ20200907-782692-4',
              type: 3,
            },
            {
              address: 'B10',
              mergedCellAddress: 'B14',
              value: '2020 年 09 月 07 日',
              type: 3,
            },
            {
              address: 'I10',
              mergedCellAddress: 'I14',
              value: 12,
              type: 2,
            },
            {
              address: 'J10',
              mergedCellAddress: 'J14',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [{ text: '物流费：12 元 \n' }] },
              type: 8,
            },
            {
              address: 'K10',
              mergedCellAddress: 'K14',
              value: '月结30天(发票日）',
              type: 3,
            },
            {
              address: 'L10',
              mergedCellAddress: 'L14',
              value: 377,
              type: 2,
            },
            { address: 'C10', value: '磁吸杯底2份.STEP', type: 3 },
            { address: 'E10', value: '【白料】UTR 3100', type: 3 },
            { address: 'F10', value: '', type: 3 },
            { address: 'G10', value: 36.65, type: 2 },
            { address: 'H10', value: 2, type: 2 },
            { address: 'C11', value: '电泳室配件电极板6份.STEP', type: 3 },
            { address: 'E11', value: '【白料】UTR 3100', type: 3 },
            { address: 'F11', value: '', type: 3 },
            { address: 'G11', value: 0.44, type: 2 },
            { address: 'H11', value: 6, type: 2 },
            { address: 'C12', value: '电泳室直筒（新）2份.STEP', type: 3 },
            { address: 'E12', value: '【白料】UTR 3100', type: 3 },
            { address: 'F12', value: '', type: 3 },
            { address: 'G12', value: 106.73, type: 2 },
            { address: 'H12', value: 2, type: 2 },
            { address: 'C13', value: '抗体槽4份黄色.STEP', type: 3 },
            { address: 'E13', value: '【白料】UTR 3100', type: 3 },
            { address: 'F13', value: '', type: 3 },
            { address: 'G13', value: 10.65, type: 2 },
            { address: 'H13', value: 4, type: 2 },
            { address: 'C14', value: '样品槽3份红色.STEP', type: 3 },
            { address: 'E14', value: '【白料】UTR 3100', type: 3 },
            { address: 'F14', value: '', type: 3 },
            { address: 'G14', value: 11, type: 2 },
            { address: 'H14', value: 3, type: 2 },
            {
              address: 'D10',
              value: {
                src:
                  'http://10.0.30.250:8081/file/md5/bfc2464dfeef77426941b0c8a136ea98/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJiZmMyNDY0ZGZlZWY3NzQyNjk0MWIwYzhhMTM2ZWE5OCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDU3Njk5MTcsImlhdCI6MTYwNTE2NTExN30.9JvY4B-agwjlaKJf5r_HuxDGABepbjzbSyiYAQNhokAYp9sVs-KbHv9eeG19aGmZmuXnCQfZps6LDoEaiG3XJA&name=decompressed-磁吸杯底2份.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D11',
              value: {
                src:
                  'http://10.0.30.250:8081/file/md5/bc244c184c26db2ca6a19e5a0898ad7b/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJiYzI0NGMxODRjMjZkYjJjYTZhMTllNWEwODk4YWQ3YiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDU3Njk5MTcsImlhdCI6MTYwNTE2NTExN30.GNWurf9W13ZfNPStnK92V5lFWGKhYekmjyn4JSdxQDlidbE4rzUSPleXJjUZMiV1RGfXKZco5iKVr0vvau1S1A&name=decompressed-电泳室配件电极板6份.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D12',
              value: {
                src:
                  'http://10.0.30.250:8081/file/md5/c1dfc69a1c961e6cb93221c781732a17/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJjMWRmYzY5YTFjOTYxZTZjYjkzMjIxYzc4MTczMmExNyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDU3Njk5MTcsImlhdCI6MTYwNTE2NTExN30.10zieT7klID-VRz2S_mEMRhQ1W_D5NesiZWPG0z3sp-EK2dCpXLsUtrZYnjMmFQKbj2GhY7lrfgk8wYf-m_cyQ&name=decompressed-电泳室直筒（新）2份.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D13',
              value: {
                src:
                  'http://10.0.30.250:8081/file/md5/645a492f02654421bcad58901674b178/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI2NDVhNDkyZjAyNjU0NDIxYmNhZDU4OTAxNjc0YjE3OCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDU3Njk5MTcsImlhdCI6MTYwNTE2NTExN30.YXbU2Xsg5VitLLsGmx8WYjSaUwfKYvpw5CdewOJNF-SgbrBCl6p5kvJP9YYhxPxRwf-9DdAbB4J-H99WAeYaXA&name=decompressed-抗体槽4份黄色.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'D14',
              value: {
                src:
                  'http://10.0.30.250:8081/file/md5/25fce2de5d984dcff933878d264f788a/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIyNWZjZTJkZTVkOTg0ZGNmZjkzMzg3OGQyNjRmNzg4YSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDU3Njk5MTcsImlhdCI6MTYwNTE2NTExN30.l_ke9Q1bsJHeCNBNWxHLp2Dk_SfWY6aNa0cGl4lr7wQCzOwo6D8eVcOqOdQWZMigZQgM3QEO4XlDV_9-sInruQ&name=decompressed-样品槽3份红色.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A15',
              mergedCellAddress: 'A15',
              value: 'XJ20200909-287487-7',
              type: 3,
            },
            {
              address: 'B15',
              mergedCellAddress: 'B15',
              value: '2020 年 09 月 09 日',
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
              value: '月结30天(发票日）',
              type: 3,
            },
            {
              address: 'L15',
              mergedCellAddress: 'L15',
              value: 1085,
              type: 2,
            },
            { address: 'C15', value: '外壳^扭矩.STEP', type: 3 },
            { address: 'E15', value: '【耐高温】RT 6180', type: 3 },
            { address: 'F15', value: '喷漆', type: 3 },
            { address: 'G15', value: 1085, type: 2 },
            { address: 'H15', value: 1, type: 2 },
            {
              address: 'D15',
              value: {
                src:
                  'http://10.0.30.250:8081/file/md5/910a340aec5a2e22ea824a5424b6295a/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI5MTBhMzQwYWVjNWEyZTIyZWE4MjRhNTQyNGI2Mjk1YSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDU3Njk5MTcsImlhdCI6MTYwNTE2NTExN30.ld1fmTOfAZ5J_oEq0XyWyXVPjY-qULmito1REK_hsTXB2rWY-V1qmWKrfUPU24wRs0Z4cSplsoGkVaWc3Xv48A&name=decompressed-外壳^扭矩.STEP.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A16',
              mergedCellAddress: 'A19',
              value: 'XJ20200914-443927-4',
              type: 3,
            },
            {
              address: 'B16',
              mergedCellAddress: 'B19',
              value: '2020 年 09 月 14 日',
              type: 3,
            },
            {
              address: 'I16',
              mergedCellAddress: 'I19',
              value: 12,
              type: 2,
            },
            {
              address: 'J16',
              mergedCellAddress: 'J19',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [{ text: '物流费：12 元 \n' }] },
              type: 8,
            },
            {
              address: 'K16',
              mergedCellAddress: 'K19',
              value: '月结30天(发票日）',
              type: 3,
            },
            {
              address: 'L16',
              mergedCellAddress: 'L19',
              value: 112,
              type: 2,
            },
            { address: 'C16', value: '涡扇______.stl', type: 3 },
            { address: 'E16', value: '【耐高温】RT 6180', type: 3 },
            { address: 'F16', value: '', type: 3 },
            { address: 'G16', value: 37, type: 2 },
            { address: 'H16', value: 1, type: 2 },
            { address: 'C17', value: '定子______.stl', type: 3 },
            { address: 'E17', value: '【耐高温】RT 6180', type: 3 },
            { address: 'F17', value: '', type: 3 },
            { address: 'G17', value: 22, type: 2 },
            { address: 'H17', value: 1, type: 2 },
            { address: 'C18', value: '定子水平轴____________.stl', type: 3 },
            { address: 'E18', value: '【耐高温】RT 6180', type: 3 },
            { address: 'F18', value: '', type: 3 },
            { address: 'G18', value: 23, type: 2 },
            { address: 'H18', value: 1, type: 2 },
            { address: 'C19', value: '涡轮零件9__________9.stl', type: 3 },
            { address: 'E19', value: '【耐高温】RT 6180', type: 3 },
            { address: 'F19', value: '', type: 3 },
            { address: 'G19', value: 18, type: 2 },
            { address: 'H19', value: 1, type: 2 },
            {
              address: 'D16',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/b5/10b65082c4fe606046b627ccfc99be/decompressed-涡扇______.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D17',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/ee/3987ce73c1130d05e72b83c06b9078/decompressed-定子______.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D18',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/85/f8d16933da21c121a42b4b5fc64440/decompressed-定子水平轴____________.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D19',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/3c/35fc29996cf9d128148aafb2631f4d/decompressed-涡轮零件9__________9.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'A20',
              mergedCellAddress: 'A24',
              value: 'XJ20200920-923753-1',
              type: 3,
            },
            {
              address: 'B20',
              mergedCellAddress: 'B24',
              value: '2020 年 09 月 20 日',
              type: 3,
            },
            { address: 'I20', mergedCellAddress: 'I24', value: 0, type: 2 },
            {
              address: 'J20',
              mergedCellAddress: 'J24',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K20',
              mergedCellAddress: 'K24',
              value: '月结30天(发票日）',
              type: 3,
            },
            {
              address: 'L20',
              mergedCellAddress: 'L24',
              value: 374,
              type: 2,
            },
            { address: 'C20', value: '磁吸杯底2份.STEP', type: 3 },
            { address: 'E20', value: '【白料】UTR 3100', type: 3 },
            { address: 'F20', value: '', type: 3 },
            { address: 'G20', value: 37.15, type: 2 },
            { address: 'H20', value: 2, type: 2 },
            { address: 'C21', value: '电泳室配件电极板4份.STEP', type: 3 },
            { address: 'E21', value: '【白料】UTR 3100', type: 3 },
            { address: 'F21', value: '', type: 3 },
            { address: 'G21', value: 0.44, type: 2 },
            { address: 'H21', value: 4, type: 2 },
            { address: 'C22', value: '电泳室直筒（新）2份.STEP', type: 3 },
            { address: 'E22', value: '【白料】UTR 3100', type: 3 },
            { address: 'F22', value: '', type: 3 },
            { address: 'G22', value: 106.73, type: 2 },
            { address: 'H22', value: 2, type: 2 },
            { address: 'C23', value: '抗体槽6份.STEP', type: 3 },
            { address: 'E23', value: '【白料】UTR 3100', type: 3 },
            { address: 'F23', value: '', type: 3 },
            { address: 'G23', value: 10.65, type: 2 },
            { address: 'H23', value: 6, type: 2 },
            { address: 'C24', value: '样品槽2份.STEP', type: 3 },
            { address: 'E24', value: '【白料】UTR 3100', type: 3 },
            { address: 'F24', value: '', type: 3 },
            { address: 'G24', value: 10.29, type: 2 },
            { address: 'H24', value: 2, type: 2 },
            {
              address: 'D20',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/bf/c2464dfeef77426941b0c8a136ea98/decompressed-磁吸杯底2份.STEP.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D21',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/bc/244c184c26db2ca6a19e5a0898ad7b/decompressed-电泳室配件电极板4份.STEP.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D22',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/c1/dfc69a1c961e6cb93221c781732a17/decompressed-电泳室直筒（新）2份.STEP.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D23',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/64/5a492f02654421bcad58901674b178/decompressed-抗体槽6份.STEP.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D24',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/25/fce2de5d984dcff933878d264f788a/decompressed-样品槽2份.STEP.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'A25',
              mergedCellAddress: 'A26',
              value: 'XJ20200925-431131-7',
              type: 3,
            },
            {
              address: 'B25',
              mergedCellAddress: 'B26',
              value: '2020 年 09 月 25 日',
              type: 3,
            },
            { address: 'I25', mergedCellAddress: 'I26', value: 0, type: 2 },
            {
              address: 'J25',
              mergedCellAddress: 'J26',
              style: { alignment: { wrapText: true, vertical: 'middle' } },
              value: { richText: [] },
              type: 8,
            },
            {
              address: 'K25',
              mergedCellAddress: 'K26',
              value: '月结30天(发票日）',
              type: 3,
            },
            {
              address: 'L25',
              mergedCellAddress: 'L26',
              value: 100,
              type: 2,
            },
            { address: 'C25', value: '涡轮零件9__________9.stl', type: 3 },
            { address: 'E25', value: '【耐高温】RT 6180', type: 3 },
            { address: 'F25', value: '', type: 3 },
            { address: 'G25', value: 25, type: 2 },
            { address: 'H25', value: 2, type: 2 },
            { address: 'C26', value: '直形涡轮__________.stl', type: 3 },
            { address: 'E26', value: '【耐高温】RT 6180', type: 3 },
            { address: 'F26', value: '', type: 3 },
            { address: 'G26', value: 25, type: 2 },
            { address: 'H26', value: 2, type: 2 },
            {
              address: 'D25',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/0b/7602136b292dbd13a0bccb1194a2fe/涡轮零件9__________9.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D26',
              value: {
                src:
                  'https://ufc-prod-image.oss-cn-shanghai.aliyuncs.com/sync/da/e1e1d5fdc9414c28e28f27efbf9b0b/直形涡轮__________.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
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
