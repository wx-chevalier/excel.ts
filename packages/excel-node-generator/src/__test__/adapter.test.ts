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
            {
              key: 'E',
              width: 20,
            },
            {
              key: 'G',
              width: 13,
            },
            {
              key: 'H',
              width: 13,
            },
            {
              key: 'I',
              width: 13,
            },
            {
              key: 'J',
              width: 13,
            },
            {
              key: 'K',
              width: 13,
            },
            {
              key: 'L',
              width: 13,
            },
          ],
          rows: [
            {
              number: 1,
              height: 100,
            },
            {
              number: 2,
              height: 25,
            },
            {
              number: 3,
              height: 80,
            },
            {
              number: 4,
              height: 80,
            },
            {
              number: 5,
              height: 80,
            },
            {
              number: 6,
              height: 80,
            },
            {
              number: 7,
              height: 80,
            },
            {
              number: 8,
              height: 80,
            },
            {
              number: 9,
              height: 80,
            },
            {
              number: 10,
              height: 80,
            },
            {
              number: 11,
              height: 80,
            },
            {
              number: 12,
              height: 80,
            },
            {
              number: 13,
              height: 80,
            },
            {
              number: 14,
              height: 80,
            },
            {
              number: 15,
              height: 80,
            },
            {
              number: 16,
              height: 80,
            },
            {
              number: 17,
              height: 80,
            },
            {
              number: 18,
              height: 80,
            },
            {
              number: 19,
              height: 80,
            },
            {
              number: 20,
              height: 80,
            },
            {
              number: 21,
              height: 80,
            },
            {
              number: 22,
              height: 80,
            },
            {
              number: 23,
              height: 80,
            },
            {
              number: 24,
              height: 80,
            },
            {
              number: 25,
              height: 80,
            },
            {
              number: 26,
              height: 80,
            },
          ],
          cells: [
            {
              address: 'A1',
              mergedCellAddress: 'H1',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                },
              },
              value: {
                richText: [
                  {
                    font: {
                      size: 16,
                      name: '宋体',
                    },
                    text: '江苏省准寻科技有限责任公司 \n',
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
                    text: '账单日期：2020-09-03~2020-10-14 \n',
                  },
                  {
                    font: {
                      size: 12,
                    },
                    text: '导出时间：2020/10/14 15:54 \n',
                  },
                  {
                    font: {
                      size: 12,
                      color: {
                        argb: 'DC143C',
                      },
                      name: '宋体',
                    },
                    text: '账单总金额：￥112435.04 \n',
                  },
                ],
              },
              type: 8,
            },
            {
              address: 'A2',
              value: '订单编号',
              type: 3,
            },
            {
              address: 'B2',
              value: '创建时间',
              type: 3,
            },
            {
              address: 'C2',
              value: '文件名称',
              type: 3,
            },
            {
              address: 'D2',
              value: '图片预览',
              type: 3,
            },
            {
              address: 'E2',
              value: '打印材料',
              type: 3,
            },
            {
              address: 'F2',
              value: '增值后处理',
              type: 3,
            },
            {
              address: 'G2',
              value: '单件价格（元）',
              type: 3,
            },
            {
              address: 'H2',
              value: '数量（件）',
              type: 3,
            },
            {
              address: 'I2',
              value: '其他费用（元）',
              type: 3,
            },
            {
              address: 'J2',
              value: '其他费用说明',
              type: 3,
            },
            {
              address: 'K2',
              value: '付款方式',
              type: 3,
            },
            {
              address: 'L2',
              value: '订单金额（元）',
              type: 3,
            },
            {
              address: 'A3',
              mergedCellAddress: 'A3',
              value: 'XJ20200817-849869-X',
              type: 3,
            },
            {
              address: 'B3',
              mergedCellAddress: 'B3',
              value: '2020 年 08 月 17 日',
              type: 3,
            },
            {
              address: 'I3',
              mergedCellAddress: 'I3',
              value: 0,
              type: 2,
            },
            {
              address: 'J3',
              mergedCellAddress: 'J3',
              style: {
                alignment: {
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [],
              },
              type: 8,
            },
            {
              address: 'K3',
              mergedCellAddress: 'K3',
              value: '月结',
              type: 3,
            },
            {
              address: 'L3',
              mergedCellAddress: 'L3',
              value: 500,
              type: 2,
            },
            {
              address: 'C3',
              value: '猫或狗碗1.stl',
              type: 3,
            },
            {
              address: 'E3',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F3',
              value: '丝印',
              type: 3,
            },
            {
              address: 'G3',
              value: 250,
              type: 2,
            },
            {
              address: 'H3',
              value: 2,
              type: 2,
            },
            {
              address: 'D3',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/ee61b24b802a9ba46eb8919b47ea4c84/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJlZTYxYjI0YjgwMmE5YmE0NmViODkxOWI0N2VhNGM4NCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.m3Wa9N_SO-NnNd5hOQupo4NTS3_6xnnBBUv-PNUYwvTNUn9kpArwH5RXTdroe82RpKj0HOJJY3BZbnzGo6mkWQ&name=decompressed-猫或狗碗1.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A4',
              mergedCellAddress: 'A4',
              value: 'XJ20200824-866818-8',
              type: 3,
            },
            {
              address: 'B4',
              mergedCellAddress: 'B4',
              value: '2020 年 08 月 24 日',
              type: 3,
            },
            {
              address: 'I4',
              mergedCellAddress: 'I4',
              value: 50,
              type: 2,
            },
            {
              address: 'J4',
              mergedCellAddress: 'J4',
              style: {
                alignment: {
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  {
                    text: '物流费：10 元 \n',
                  },
                  {
                    text: '附加费：20 元 \n',
                  },
                  {
                    text: '后处理费：10 元 \n',
                  },
                  {
                    text: '包装费：10 元 \n',
                  },
                ],
              },
              type: 8,
            },
            {
              address: 'K4',
              mergedCellAddress: 'K4',
              value: '款到发货',
              type: 3,
            },
            {
              address: 'L4',
              mergedCellAddress: 'L4',
              value: 763.92,
              type: 2,
            },
            {
              address: 'C4',
              value: 'muju.stl',
              type: 3,
            },
            {
              address: 'E4',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F4',
              value: '',
              type: 3,
            },
            {
              address: 'G4',
              value: 713.92,
              type: 2,
            },
            {
              address: 'H4',
              value: 1,
              type: 2,
            },
            {
              address: 'D4',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/77aaf0f01d80758bf471fd9c370c003f/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI3N2FhZjBmMDFkODA3NThiZjQ3MWZkOWMzNzBjMDAzZiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.Axsmgz02oNPR8TKoXKycPjxNS-jWtB0fOyMMtTJ-3vDLJ4wi9OZy-wtqHjgsO18QwJPaCWIxUhPaGPxOoDzXhA&name=decompressed-muju.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A5',
              mergedCellAddress: 'A5',
              value: 'XJ20200904-851579-5',
              type: 3,
            },
            {
              address: 'B5',
              mergedCellAddress: 'B5',
              value: '2020 年 09 月 04 日',
              type: 3,
            },
            {
              address: 'I5',
              mergedCellAddress: 'I5',
              value: 0,
              type: 2,
            },
            {
              address: 'J5',
              mergedCellAddress: 'J5',
              style: {
                alignment: {
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [],
              },
              type: 8,
            },
            {
              address: 'K5',
              mergedCellAddress: 'K5',
              value: '款到发货',
              type: 3,
            },
            {
              address: 'L5',
              mergedCellAddress: 'L5',
              value: 10,
              type: 2,
            },
            {
              address: 'C5',
              value: 'aaron-burden--IQGXSMLYJc.jpg',
              type: 3,
            },
            {
              address: 'E5',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F5',
              value: '',
              type: 3,
            },
            {
              address: 'G5',
              value: 0,
              type: 2,
            },
            {
              address: 'H5',
              value: 1,
              type: 2,
            },
            {
              address: 'D5',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/8020d99ed845638d44314026cca1c98a/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI4MDIwZDk5ZWQ4NDU2MzhkNDQzMTQwMjZjY2ExYzk4YSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.Eoh_sw_8XrEBjDtn8yrF_yr4b5Kv8QMSzEjKnNNbD2dbZ6sMf5aI_memBXn8UTo9FIyriW612teDkDNpHPUi0A&name=aaron-burden--IQGXSMLYJc.jpg',
              },
              type: 11,
            },
            {
              address: 'A6',
              mergedCellAddress: 'A6',
              value: 'XJ20200907-979437-6',
              type: 3,
            },
            {
              address: 'B6',
              mergedCellAddress: 'B6',
              value: '2020 年 09 月 07 日',
              type: 3,
            },
            {
              address: 'I6',
              mergedCellAddress: 'I6',
              value: 0,
              type: 2,
            },
            {
              address: 'J6',
              mergedCellAddress: 'J6',
              style: {
                alignment: {
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [],
              },
              type: 8,
            },
            {
              address: 'K6',
              mergedCellAddress: 'K6',
              value: '款到发货',
              type: 3,
            },
            {
              address: 'L6',
              mergedCellAddress: 'L6',
              value: 899.25,
              type: 2,
            },
            {
              address: 'C6',
              value: '12(1).stl',
              type: 3,
            },
            {
              address: 'E6',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F6',
              value: '',
              type: 3,
            },
            {
              address: 'G6',
              value: 899.25,
              type: 2,
            },
            {
              address: 'H6',
              value: 1,
              type: 2,
            },
            {
              address: 'D6',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/4fc0f04ab805431b6547c92fcd19e6b2/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI0ZmMwZjA0YWI4MDU0MzFiNjU0N2M5MmZjZDE5ZTZiMiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.UXtPdTd_0Zme-vpeCuI9og7wqk5pmNyf4TWR0HqaYlIay39DBZ_Vfz8_t7fAellhoQ8X706uxehZlLjOjA5H0w&name=decompressed-12(1).stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A7',
              mergedCellAddress: 'A7',
              value: 'XJ20200907-158968-X',
              type: 3,
            },
            {
              address: 'B7',
              mergedCellAddress: 'B7',
              value: '2020 年 09 月 07 日',
              type: 3,
            },
            {
              address: 'I7',
              mergedCellAddress: 'I7',
              value: 0,
              type: 2,
            },
            {
              address: 'J7',
              mergedCellAddress: 'J7',
              style: {
                alignment: {
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [],
              },
              type: 8,
            },
            {
              address: 'K7',
              mergedCellAddress: 'K7',
              value: '月结',
              type: 3,
            },
            {
              address: 'L7',
              mergedCellAddress: 'L7',
              value: 21.16,
              type: 2,
            },
            {
              address: 'C7',
              value: 'Voronoi.stl',
              type: 3,
            },
            {
              address: 'E7',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F7',
              value: '',
              type: 3,
            },
            {
              address: 'G7',
              value: 21.16,
              type: 2,
            },
            {
              address: 'H7',
              value: 1,
              type: 2,
            },
            {
              address: 'D7',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/83f1f682b88d1620a83fc30f85cd95a5/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI4M2YxZjY4MmI4OGQxNjIwYTgzZmMzMGY4NWNkOTVhNSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.TtHSojQ9vs4lkO7-aoDQLvCKUhhUHfEY8E5IWJRtb0JDWVWD_cSIw46O_pT4Cv_7HndkI6aEcx9utURO7bE5Kg&name=decompressed-Voronoi.stl.thumbnail.PNG',
              },
              type: 11,
            },
            {
              address: 'A8',
              mergedCellAddress: 'A9',
              value: 'XJ20200910-833871-6',
              type: 3,
            },
            {
              address: 'B8',
              mergedCellAddress: 'B9',
              value: '2020 年 09 月 10 日',
              type: 3,
            },
            {
              address: 'I8',
              mergedCellAddress: 'I9',
              value: 0,
              type: 2,
            },
            {
              address: 'J8',
              mergedCellAddress: 'J9',
              style: {
                alignment: {
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [],
              },
              type: 8,
            },
            {
              address: 'K8',
              mergedCellAddress: 'K9',
              value: '测试付款测试付款',
              type: 3,
            },
            {
              address: 'L8',
              mergedCellAddress: 'L9',
              value: 20,
              type: 2,
            },
            {
              address: 'C8',
              value: '上海交大-01.png',
              type: 3,
            },
            {
              address: 'E8',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F8',
              value: '',
              type: 3,
            },
            {
              address: 'G8',
              value: 0,
              type: 2,
            },
            {
              address: 'H8',
              value: 1,
              type: 2,
            },
            {
              address: 'C9',
              value: '特斯拉.png',
              type: 3,
            },
            {
              address: 'E9',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F9',
              value: '',
              type: 3,
            },
            {
              address: 'G9',
              value: 0,
              type: 2,
            },
            {
              address: 'H9',
              value: 1,
              type: 2,
            },
            {
              address: 'D8',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/bedd143aaf857926f01dfb5cde95e3c2/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJiZWRkMTQzYWFmODU3OTI2ZjAxZGZiNWNkZTk1ZTNjMiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.9sOVYNFednOWSAc3ixd5iHghMDWDI3GF7s1j7XDizBSqzkhLxG3vz03Uk9ml6EsPShJNgQuFwIGXFp7nogRTUQ&name=上海交大-01.png',
              },
              type: 11,
            },
            {
              address: 'D9',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/269775b7b731ae6d34e2cc3a451f1252/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIyNjk3NzViN2I3MzFhZTZkMzRlMmNjM2E0NTFmMTI1MiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.CeMp8jaUJN40RXu6pg4qwR6tl-dCML3HiNymmAQabsjUOE07jhnZqXmihAAeC46l1PHPnso-cod4zwCIhiv1ag&name=特斯拉.png',
              },
              type: 11,
            },
            {
              address: 'A10',
              mergedCellAddress: 'A25',
              value: 'XJ20200916-392148-3',
              type: 3,
            },
            {
              address: 'B10',
              mergedCellAddress: 'B25',
              value: '2020 年 09 月 16 日',
              type: 3,
            },
            {
              address: 'I10',
              mergedCellAddress: 'I25',
              value: 10,
              type: 2,
            },
            {
              address: 'J10',
              mergedCellAddress: 'J25',
              style: {
                alignment: {
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  {
                    text: '物流费：10 元 \n',
                  },
                ],
              },
              type: 8,
            },
            {
              address: 'K10',
              mergedCellAddress: 'K25',
              value: '款到发货',
              type: 3,
            },
            {
              address: 'L10',
              mergedCellAddress: 'L25',
              value: 110210.71,
              type: 2,
            },
            {
              address: 'C10',
              value: 'file.obj',
              type: 3,
            },
            {
              address: 'E10',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F10',
              value: '丝印',
              type: 3,
            },
            {
              address: 'G10',
              value: 110050.71,
              type: 2,
            },
            {
              address: 'H10',
              value: 1,
              type: 2,
            },
            {
              address: 'C11',
              value: 'aaron-burden--IQGXSMLYJc.jpg',
              type: 3,
            },
            {
              address: 'E11',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F11',
              value: '',
              type: 3,
            },
            {
              address: 'G11',
              value: 0,
              type: 2,
            },
            {
              address: 'H11',
              value: 1,
              type: 2,
            },
            {
              address: 'C12',
              value: 'adrihani-rashid-fTkNnftidCU.jpg',
              type: 3,
            },
            {
              address: 'E12',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F12',
              value: '',
              type: 3,
            },
            {
              address: 'G12',
              value: 0,
              type: 2,
            },
            {
              address: 'H12',
              value: 1,
              type: 2,
            },
            {
              address: 'C13',
              value: 'annie-spratt-0ZPSX_mQ3xI.jpg',
              type: 3,
            },
            {
              address: 'E13',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F13',
              value: '',
              type: 3,
            },
            {
              address: 'G13',
              value: 0,
              type: 2,
            },
            {
              address: 'H13',
              value: 1,
              type: 2,
            },
            {
              address: 'C14',
              value: 'arto-marttinen-fHXP17AxOEk.jpg',
              type: 3,
            },
            {
              address: 'E14',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F14',
              value: '',
              type: 3,
            },
            {
              address: 'G14',
              value: 0,
              type: 2,
            },
            {
              address: 'H14',
              value: 1,
              type: 2,
            },
            {
              address: 'C15',
              value: 'antoine-le-idiwVxHqmGg.jpg',
              type: 3,
            },
            {
              address: 'E15',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F15',
              value: '',
              type: 3,
            },
            {
              address: 'G15',
              value: 0,
              type: 2,
            },
            {
              address: 'H15',
              value: 1,
              type: 2,
            },
            {
              address: 'C16',
              value: 'asoggetti-arOA3Q38OEY.jpg',
              type: 3,
            },
            {
              address: 'E16',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F16',
              value: '',
              type: 3,
            },
            {
              address: 'G16',
              value: 0,
              type: 2,
            },
            {
              address: 'H16',
              value: 1,
              type: 2,
            },
            {
              address: 'C17',
              value: 'austin-chan-8NHL3OI5eWc.jpg',
              type: 3,
            },
            {
              address: 'E17',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F17',
              value: '',
              type: 3,
            },
            {
              address: 'G17',
              value: 0,
              type: 2,
            },
            {
              address: 'H17',
              value: 1,
              type: 2,
            },
            {
              address: 'C18',
              value: 'blog:面试2.jpg',
              type: 3,
            },
            {
              address: 'E18',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F18',
              value: '',
              type: 3,
            },
            {
              address: 'G18',
              value: 0,
              type: 2,
            },
            {
              address: 'H18',
              value: 1,
              type: 2,
            },
            {
              address: 'C19',
              value: 'brady-corps-zjaWzPj9WjM.jpg',
              type: 3,
            },
            {
              address: 'E19',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F19',
              value: '',
              type: 3,
            },
            {
              address: 'G19',
              value: 0,
              type: 2,
            },
            {
              address: 'H19',
              value: 1,
              type: 2,
            },
            {
              address: 'C20',
              value: 'cam-morin-gTb46ltlKOI.jpg',
              type: 3,
            },
            {
              address: 'E20',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F20',
              value: '',
              type: 3,
            },
            {
              address: 'G20',
              value: 0,
              type: 2,
            },
            {
              address: 'H20',
              value: 1,
              type: 2,
            },
            {
              address: 'C21',
              value: 'cédric-frixon-QiJp6dWw1oE.jpg',
              type: 3,
            },
            {
              address: 'E21',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F21',
              value: '',
              type: 3,
            },
            {
              address: 'G21',
              value: 0,
              type: 2,
            },
            {
              address: 'H21',
              value: 1,
              type: 2,
            },
            {
              address: 'C22',
              value: 'christopher-burns-wJkFjOB3KR0.jpg',
              type: 3,
            },
            {
              address: 'E22',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F22',
              value: '',
              type: 3,
            },
            {
              address: 'G22',
              value: 0,
              type: 2,
            },
            {
              address: 'H22',
              value: 1,
              type: 2,
            },
            {
              address: 'C23',
              value: 'clark-van der beken-xApC8DIiD54.jpg',
              type: 3,
            },
            {
              address: 'E23',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F23',
              value: '',
              type: 3,
            },
            {
              address: 'G23',
              value: 0,
              type: 2,
            },
            {
              address: 'H23',
              value: 1,
              type: 2,
            },
            {
              address: 'C24',
              value: 'cropped-2560-1600-648581.jpg',
              type: 3,
            },
            {
              address: 'E24',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F24',
              value: '',
              type: 3,
            },
            {
              address: 'G24',
              value: 0,
              type: 2,
            },
            {
              address: 'H24',
              value: 1,
              type: 2,
            },
            {
              address: 'C25',
              value: 'cropped-2560-1600-931523.jpg',
              type: 3,
            },
            {
              address: 'E25',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F25',
              value: '',
              type: 3,
            },
            {
              address: 'G25',
              value: 0,
              type: 2,
            },
            {
              address: 'H25',
              value: 1,
              type: 2,
            },
            {
              address: 'D10',
              value: {
                src:
                  'https://ufc-dev.oss-cn-shenzhen.aliyuncs.com/sync/8d/e0906a2969892a1f4a85aac8e1c0f2/decompressed-file.obj.stl.thumbnail.PNG?x-oss-process=image%2Fresize%2Cw_100',
              },
              type: 11,
            },
            {
              address: 'D11',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/8020d99ed845638d44314026cca1c98a/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI4MDIwZDk5ZWQ4NDU2MzhkNDQzMTQwMjZjY2ExYzk4YSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.Eoh_sw_8XrEBjDtn8yrF_yr4b5Kv8QMSzEjKnNNbD2dbZ6sMf5aI_memBXn8UTo9FIyriW612teDkDNpHPUi0A&name=aaron-burden--IQGXSMLYJc.jpg',
              },
              type: 11,
            },
            {
              address: 'D12',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/f22353fa5a12cc5e46e019d25f86556f/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJmMjIzNTNmYTVhMTJjYzVlNDZlMDE5ZDI1Zjg2NTU2ZiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.Uy39cxcV_Ezf-s0p8T8jKQ3LZGqbRVVEkw1fuaoNlf3s2mX3M9eTZcTsW7OMPo6s97LxL990pxV0vntV6Tt5Fw&name=adrihani-rashid-fTkNnftidCU.jpg',
              },
              type: 11,
            },
            {
              address: 'D13',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/473124b814c95bc80d5aa1809ea147f6/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI0NzMxMjRiODE0Yzk1YmM4MGQ1YWExODA5ZWExNDdmNiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.XTzxA8Dwwp60BlPbcE6qAgMTEA1xkpgyzLf9vPkPaEJfnT53DrUUuvuLuupYb7Sy9lavPF5JgTZx1EZcRqGTUQ&name=annie-spratt-0ZPSX_mQ3xI.jpg',
              },
              type: 11,
            },
            {
              address: 'D14',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/eb48233d8d8e51904fefb01a33dd936f/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJlYjQ4MjMzZDhkOGU1MTkwNGZlZmIwMWEzM2RkOTM2ZiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.Ur6cSTubmlJHTYi9cA0qjxOx1ttMN8K9PNA3yhKdES-7T8hgXgbXss_-D1U8zq2Vbbs5rDewnA81EDcqiBaKDg&name=arto-marttinen-fHXP17AxOEk.jpg',
              },
              type: 11,
            },
            {
              address: 'D15',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/4b6b5e97724023f525ede4635f792d58/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI0YjZiNWU5NzcyNDAyM2Y1MjVlZGU0NjM1Zjc5MmQ1OCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.2v7gSL3A5Ds5v6089hz1xnAhMCg3eGeXm2WCb2K_pEpt7ntFlX1Rre4p4vzUjK-ofEAm7BUziPsQBkFUCYhuOw&name=antoine-le-idiwVxHqmGg.jpg',
              },
              type: 11,
            },
            {
              address: 'D16',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/2bec35b7c55d3e69c09efd7106ecd1ee/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIyYmVjMzViN2M1NWQzZTY5YzA5ZWZkNzEwNmVjZDFlZSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.Oktxgr37WTSXLXkU3Riatyd-z03pcLPrtNVnC1zYUpWUiR3vXe3TkFL5eZrdbAp5CpS2Y5ZkKLIetsFKpSeQ7Q&name=asoggetti-arOA3Q38OEY.jpg',
              },
              type: 11,
            },
            {
              address: 'D17',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/9b2e7536f10cf40496228fd1ff263fe6/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI5YjJlNzUzNmYxMGNmNDA0OTYyMjhmZDFmZjI2M2ZlNiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.DH-X4D9sVdBLp8DEAVhsiY05mCaN_3QMeOjFNvMK0T5SW60WjE6tJJRYiPkWYXiq6tPzETCiMLLLPz3MYJKN3A&name=austin-chan-8NHL3OI5eWc.jpg',
              },
              type: 11,
            },
            {
              address: 'D18',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/4fe19669c3ec24c06db231b4931699f1/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI0ZmUxOTY2OWMzZWMyNGMwNmRiMjMxYjQ5MzE2OTlmMSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.KVyQXyxfJxwTNobr0ffJibmi4lHqiD9LIsfzuv1vRfT4Zn4l8i6noIO4_p6saa_XfHh-9qPqZQobL8BTe7zkUg&name=blog:面试2.jpg',
              },
              type: 11,
            },
            {
              address: 'D19',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/579e9b9e09392fe2c7b34db1000ba1b4/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI1NzllOWI5ZTA5MzkyZmUyYzdiMzRkYjEwMDBiYTFiNCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.yP9GwydyjJvG8VkLdJpIs3_MU7_w-GVV6Lw1rvr8Ad5zMmFY4IYDh3svVEPZYtwCfJ5ChCR_MLG6F6D52Zp7GA&name=brady-corps-zjaWzPj9WjM.jpg',
              },
              type: 11,
            },
            {
              address: 'D20',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/d11d42b9eb9619a58a580070e29de1db/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJkMTFkNDJiOWViOTYxOWE1OGE1ODAwNzBlMjlkZTFkYiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.4hn49QWOhJg2_gbVCBNpADCNiG5VNUAfUlh50jgYyJYUaHANeKoyyEJGUD1bz-EgMsyT_vIdZ8a6kA0v38JTSg&name=cam-morin-gTb46ltlKOI.jpg',
              },
              type: 11,
            },
            {
              address: 'D21',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/b9b1e3dbb65348bb377c3ee04350f871/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJiOWIxZTNkYmI2NTM0OGJiMzc3YzNlZTA0MzUwZjg3MSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.V1uPjWIcMazjzQNlyB0b-4H7AlFFEG_JbQKQKTa-blFkpiexVy-6Mr3Y0yMsv3K01OX_BJrUNoogEOcNzEDTRg&name=cédric-frixon-QiJp6dWw1oE.jpg',
              },
              type: 11,
            },
            {
              address: 'D22',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/3c45d500a8e9eef2b9b764a8f1a27fb8/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyIzYzQ1ZDUwMGE4ZTllZWYyYjliNzY0YThmMWEyN2ZiOCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.cgATv3vbwZxBLqj21p9X8R-xEPLHNmWqU76H-F2oAVVuLfJqCCKr_C9G9pWEeeaHe5xzenENdeZ0gjq2Apz4rg&name=christopher-burns-wJkFjOB3KR0.jpg',
              },
              type: 11,
            },
            {
              address: 'D23',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/52bb2cd44ac8668e90ab5f89790bb389/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI1MmJiMmNkNDRhYzg2NjhlOTBhYjVmODk3OTBiYjM4OSJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.-wcPrbg2wGVSIAkRoyaz61uO00f7Sa0d_dTsIIJdw7nhuabsJESmkwKPUa325jMJrVeM6I8QN3Sbzy_pgbYdHA&name=clark-van der beken-xApC8DIiD54.jpg',
              },
              type: 11,
            },
            {
              address: 'D24',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/8523a29c6fbebbd6b00bc4b8e0246b10/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI4NTIzYTI5YzZmYmViYmQ2YjAwYmM0YjhlMDI0NmIxMCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.hCa3tLPcjc6ZyN4yRfckQcqH8JcOIW9hnmB8RWBjZntPaGoBzrsC59NxeQpaxDQQCxJyzheEd3oSX9pNjJMy4Q&name=cropped-2560-1600-648581.jpg',
              },
              type: 11,
            },
            {
              address: 'D25',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/c39b0f4415d1d348fb65c679a5b43fa7/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJjMzliMGY0NDE1ZDFkMzQ4ZmI2NWM2NzlhNWI0M2ZhNyJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.kHg9HayIYPxmNh5ffzWHn5uUQO9uIYq7rA-KqOI_1vrDBSvQ2dv4DxqLx_av7ItemHJHptFYbt9m_-nqaCPiHA&name=cropped-2560-1600-931523.jpg',
              },
              type: 11,
            },
            {
              address: 'A26',
              mergedCellAddress: 'A26',
              value: 'XJ20200922-854567-6',
              type: 3,
            },
            {
              address: 'B26',
              mergedCellAddress: 'B26',
              value: '2020 年 09 月 22 日',
              type: 3,
            },
            {
              address: 'I26',
              mergedCellAddress: 'I26',
              value: 0,
              type: 2,
            },
            {
              address: 'J26',
              mergedCellAddress: 'J26',
              style: {
                alignment: {
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [],
              },
              type: 8,
            },
            {
              address: 'K26',
              mergedCellAddress: 'K26',
              value: '测试付款测试付款',
              type: 3,
            },
            {
              address: 'L26',
              mergedCellAddress: 'L26',
              value: 10,
              type: 2,
            },
            {
              address: 'C26',
              value: 'arto-marttinen-fHXP17AxOEk.jpg',
              type: 3,
            },
            {
              address: 'E26',
              value: '测试材料二',
              type: 3,
            },
            {
              address: 'F26',
              value: '',
              type: 3,
            },
            {
              address: 'G26',
              value: 0,
              type: 2,
            },
            {
              address: 'H26',
              value: 1,
              type: 2,
            },
            {
              address: 'D26',
              value: {
                src:
                  'https://gateway.test.unionfab.com/file/md5/eb48233d8d8e51904fefb01a33dd936f/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJlYjQ4MjMzZDhkOGU1MTkwNGZlZmIwMWEzM2RkOTM2ZiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMyNjY4OTMsImlhdCI6MTYwMjY2MjA5M30.Ur6cSTubmlJHTYi9cA0qjxOx1ttMN8K9PNA3yhKdES-7T8hgXgbXss_-D1U8zq2Vbbs5rDewnA81EDcqiBaKDg&name=arto-marttinen-fHXP17AxOEk.jpg',
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
