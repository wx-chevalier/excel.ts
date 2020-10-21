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
            printArea: 'A1:K14',
          },
          view: { showGridLines: true },
          properties: {
            defaultColWidth: 12,
            defaultRowHeight: 25,
            defaultAlignment: {
              horizontal: 'right',
              wrapText: true,
              vertical: 'middle',
            },
          },
          rows: [
            { number: 12, height: 25 },
            { number: 13, height: 25 },
            { number: 14, height: 25 },
            { number: 1, height: 25 },
            { number: 2, height: 50 },
            { number: 3, height: 30 },
            { number: 4, height: 22.25 },
            { number: 5, height: 11.25 },
            { number: 6, height: 22.25 },
            { number: 7, height: 22.25 },
            { number: 8, height: 22.25 },
            { number: 9, height: 22.25 },
          ],
          columns: [
            { key: 'B', width: 20 },
            { key: 'C', width: 1 },
            { key: 'D', width: 10 },
            { key: 'E', width: 12 },
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
              value: {
                src:
                  'https://ufc-marketing.oss-cn-shanghai.aliyuncs.com/%E6%8E%A8%E5%B9%BF%E4%BA%8C%E7%BB%B4%E7%A0%81/gh_8add26c69588_344%20%281%29.jpg',
              },
              type: 11,
            },
            {
              address: 'F1',
              mergedCellAddress: 'J1',
              value: 'Unionfab AM Technology（Shanghai）Co.,Ltd',
              style: {
                font: { size: 12, bold: true },
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
                font: { size: 12, bold: true },
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
              address: 'F4',
              mergedCellAddress: 'J4',
              value: '上海市松江区新格路 901 号 5 幢 3 楼',
              style: {
                font: { size: 9 },
                alignment: {
                  horizontal: 'right',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              type: 3,
            },
            {
              address: 'A6',
              mergedCellAddress: 'D6',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  { text: '客户名称：' },
                  {
                    text: '上海隽工自动化科技有限公司  ',
                    font: { underline: true },
                  },
                ],
              },
              type: 8,
            },
            {
              address: 'A7',
              mergedCellAddress: 'D7',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  { text: '联系人：' },
                  { text: '方梦琪  ', font: { underline: true } },
                ],
              },
              type: 8,
            },
            {
              address: 'A8',
              mergedCellAddress: 'D8',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  { text: '电话：' },
                  { text: '16602103254  ', font: { underline: true } },
                ],
              },
              type: 8,
            },
            {
              address: 'A9',
              mergedCellAddress: 'D9',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  { text: '地址：' },
                  {
                    text: '上海市松江区洞泾镇振业路280号1栋A8507室  ',
                    font: { underline: true },
                  },
                ],
              },
              type: 8,
            },
            {
              address: 'G6',
              mergedCellAddress: 'J6',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  { text: '订单号：' },
                  { text: 'XJ20201021-764483-2  ', font: { underline: true } },
                ],
              },
              type: 8,
            },
            {
              address: 'G7',
              mergedCellAddress: 'J7',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  { text: '快递单号：' },
                  { text: '  ', font: { underline: true } },
                ],
              },
              type: 8,
            },
            {
              address: 'A10',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: true },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: 'No.',
              type: 3,
            },
            {
              address: 'B10',
              mergedCellAddress: 'C10',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: true },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: '文件名称',
              type: 3,
            },
            {
              address: 'D10',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: true },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: '加工工艺',
              type: 3,
            },
            {
              address: 'E10',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: true },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: '材料',
              type: 3,
            },
            {
              address: 'F10',
              mergedCellAddress: 'G10',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: true },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: '增值后处理',
              type: 3,
            },
            {
              address: 'H10',
              mergedCellAddress: 'I10',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: true },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: '数量（件）',
              type: 3,
            },
            {
              address: 'J10',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: true },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: '备注',
              type: 3,
            },
            {
              address: 'A11',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: false },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: '1',
              type: 3,
            },
            {
              address: 'B11',
              mergedCellAddress: 'C11',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: false },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: 'DSH-MCS-TO220-08-01-V1_Rescaled(9.99899)缩放.stl',
              type: 3,
            },
            {
              address: 'D11',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: false },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: 'SLA',
              type: 3,
            },
            {
              address: 'E11',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: false },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: '尼龙 ',
              type: 3,
            },
            {
              address: 'F11',
              mergedCellAddress: 'G11',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: false },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: '',
              type: 3,
            },
            {
              address: 'H11',
              mergedCellAddress: 'I11',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: false },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: '4',
              type: 3,
            },
            {
              address: 'J11',
              style: {
                alignment: {
                  horizontal: 'center',
                  wrapText: true,
                  vertical: 'middle',
                },
                font: { bold: false },
                border: {
                  top: { style: 'thin' },
                  right: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                },
              },
              value: '',
              type: 3,
            },
            {
              address: 'A12',
              mergedCellAddress: 'J12',
              value:
                '注：若收货有差异或损耗，请于24小时内反馈至我司，过后视为正常签收；也可搜索 优联智造 微信小程序获取更多。',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              type: 3,
            },
            {
              address: 'A13',
              mergedCellAddress: 'C13',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  { text: '制单人：' },
                  { text: '  ', font: { underline: true } },
                ],
              },
              type: 8,
            },
            {
              address: 'A14',
              mergedCellAddress: 'C14',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  { text: '制单日期：' },
                  { text: '2020-10-21', font: { underline: true } },
                ],
              },
              type: 8,
            },
            {
              address: 'D13',
              mergedCellAddress: 'F13',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  { text: '发货人：' },
                  { text: '  ', font: { underline: true } },
                ],
              },
              type: 8,
            },
            {
              address: 'D14',
              mergedCellAddress: 'F14',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  { text: '发货日期：' },
                  { text: '2020-10-21', font: { underline: true } },
                ],
              },
              type: 8,
            },
            {
              address: 'G13',
              mergedCellAddress: 'J13',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  { text: '客户确认签章：' },
                  { text: '  ', font: { underline: true } },
                ],
              },
              type: 8,
            },
            {
              address: 'G14',
              mergedCellAddress: 'J14',
              style: {
                alignment: {
                  horizontal: 'left',
                  wrapText: true,
                  vertical: 'middle',
                },
              },
              value: {
                richText: [
                  { text: '签收日期：' },
                  { text: '2020-10-21', font: { underline: true } },
                ],
              },
              type: 8,
            },
            {
              address: 'A:14',
              style: { border: { bottom: { style: 'thin' } } },
            },
            { address: 'A:0', style: { border: { top: { style: 'thin' } } } },
            {
              address: 'B:14',
              style: { border: { bottom: { style: 'thin' } } },
            },
            { address: 'B:0', style: { border: { top: { style: 'thin' } } } },
            {
              address: 'C:14',
              style: { border: { bottom: { style: 'thin' } } },
            },
            { address: 'C:0', style: { border: { top: { style: 'thin' } } } },
            {
              address: 'D:14',
              style: { border: { bottom: { style: 'thin' } } },
            },
            { address: 'D:0', style: { border: { top: { style: 'thin' } } } },
            {
              address: 'E:14',
              style: { border: { bottom: { style: 'thin' } } },
            },
            { address: 'E:0', style: { border: { top: { style: 'thin' } } } },
            {
              address: 'F:14',
              style: { border: { bottom: { style: 'thin' } } },
            },
            { address: 'F:0', style: { border: { top: { style: 'thin' } } } },
            {
              address: 'G:14',
              style: { border: { bottom: { style: 'thin' } } },
            },
            { address: 'G:0', style: { border: { top: { style: 'thin' } } } },
            {
              address: 'H:14',
              style: { border: { bottom: { style: 'thin' } } },
            },
            { address: 'H:0', style: { border: { top: { style: 'thin' } } } },
            {
              address: 'I:14',
              style: { border: { bottom: { style: 'thin' } } },
            },
            { address: 'I:0', style: { border: { top: { style: 'thin' } } } },
            {
              address: 'J:14',
              style: { border: { bottom: { style: 'thin' } } },
            },
            { address: 'J:0', style: { border: { top: { style: 'thin' } } } },
            { address: 'J:1', style: { border: { right: { style: 'thin' } } } },
            { address: 'A:1', style: { border: { left: { style: 'thin' } } } },
            { address: 'J:2', style: { border: { right: { style: 'thin' } } } },
            { address: 'A:2', style: { border: { left: { style: 'thin' } } } },
            { address: 'J:3', style: { border: { right: { style: 'thin' } } } },
            { address: 'A:3', style: { border: { left: { style: 'thin' } } } },
            { address: 'J:4', style: { border: { right: { style: 'thin' } } } },
            { address: 'A:4', style: { border: { left: { style: 'thin' } } } },
            { address: 'J:5', style: { border: { right: { style: 'thin' } } } },
            { address: 'A:5', style: { border: { left: { style: 'thin' } } } },
            { address: 'J:6', style: { border: { right: { style: 'thin' } } } },
            { address: 'A:6', style: { border: { left: { style: 'thin' } } } },
            { address: 'J:7', style: { border: { right: { style: 'thin' } } } },
            { address: 'A:7', style: { border: { left: { style: 'thin' } } } },
            { address: 'J:8', style: { border: { right: { style: 'thin' } } } },
            { address: 'A:8', style: { border: { left: { style: 'thin' } } } },
            { address: 'J:9', style: { border: { right: { style: 'thin' } } } },
            { address: 'A:9', style: { border: { left: { style: 'thin' } } } },
            {
              address: 'J:10',
              style: { border: { right: { style: 'thin' } } },
            },
            { address: 'A:10', style: { border: { left: { style: 'thin' } } } },
            {
              address: 'J:11',
              style: { border: { right: { style: 'thin' } } },
            },
            { address: 'A:11', style: { border: { left: { style: 'thin' } } } },
            {
              address: 'J:12',
              style: { border: { right: { style: 'thin' } } },
            },
            { address: 'A:12', style: { border: { left: { style: 'thin' } } } },
            {
              address: 'J:13',
              style: { border: { right: { style: 'thin' } } },
            },
            { address: 'A:13', style: { border: { left: { style: 'thin' } } } },
            {
              address: 'J:14',
              style: { border: { right: { style: 'thin' } } },
            },
            { address: 'A:14', style: { border: { left: { style: 'thin' } } } },
            {
              address: 'J:14',
              style: {
                border: { bottom: { style: 'thin' }, right: { style: 'thin' } },
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
