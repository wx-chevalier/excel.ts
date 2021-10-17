import {
  CellHyperlinkValue,
  CellImageValue,
  CellQrcodeValue,
  CellRichTextValue,
  CellValueType,
  WorkbookDO,
  WorksheetDO,
} from '@m-fe/excel-schema';
import * as U from '@m-fe/utils';
import Excel, { PageSetup, Workbook, Worksheet } from 'exceljs';
import fs from 'fs-extra';
import QRCode from 'qrcode';

import { getImageAsBase64, mergeStyle } from './utils';

export class ExcelGenerator {
  // 外部传入的属性
  workbookDO: WorkbookDO;
  outputFilePath: string;
  onCellProgress: (percent: number) => void = () => {};

  // 内部状态控制属性
  isCancelled = false;

  constructor(
    workbookDO: WorkbookDO,
    outputFilePath: string,
    { onCellProgress }: { onCellProgress?: (percent: number) => void } = {},
  ) {
    this.workbookDO = workbookDO;
    this.outputFilePath = outputFilePath;
    if (onCellProgress) {
      this.onCellProgress = onCellProgress;
    }
  }

  async cancel() {
    this.isCancelled = true;
  }

  async generateByExcelJs() {
    const workbook = new Excel.Workbook();
    const { workbookDO, outputFilePath } = this;

    workbook.creator = workbookDO.creator;
    workbook.lastModifiedBy = workbookDO.lastModifiedBy;

    if (Date.parse(workbookDO.created)) {
      workbook.created = new Date(workbookDO.created);
    }

    if (Date.parse(workbookDO.modified)) {
      workbook.modified = new Date(workbookDO.modified);
    }

    if (Date.parse(workbookDO.lastPrinted)) {
      workbook.lastPrinted = new Date(workbookDO.lastPrinted);
    }

    for (const sheetDO of workbookDO.sheets) {
      const sheet = workbook.addWorksheet(sheetDO.name, {
        pageSetup: ({ ...(sheetDO.pageSetup || {}) } as unknown) as PageSetup,
        views: sheetDO.view ? [sheetDO.view] : [],
      });

      // 设置默认样式
      if (sheetDO.properties.defaultColWidth) {
        sheet.properties.defaultColWidth = sheetDO.properties.defaultColWidth;
      }
      if (sheetDO.properties.defaultRowHeight) {
        sheet.properties.defaultRowHeight = sheetDO.properties.defaultRowHeight;
      }

      if (sheetDO.properties.defaultAlignment) {
        for (let i = 0; i < 100; i++) {
          sheet.getRow(i).alignment = {
            ...(sheetDO.properties.defaultAlignment || {}),
          };
        }
      }

      // 设置某些固定行的宽度与高度
      if (U.isValidArray(sheetDO.columns)) {
        sheetDO.columns.forEach(c => {
          const $col = sheet.getColumn(c.key);

          if (c.width) {
            $col.width = c.width;
          }

          if (c.style) {
            mergeStyle($col, c.style);
          }
        });
      }

      if (U.isValidArray(sheetDO.rows)) {
        sheetDO.rows.forEach(c => {
          const $row = sheet.getRow(Number(c.number));

          if (c.height) {
            $row.height = c.height;
          }

          if (c.style) {
            mergeStyle($row, c.style);
          }
        });
      }

      // 开始填入具体的内容
      await this.fillSheet(sheet, sheetDO, workbook);
    }

    if (this.isCancelled) {
      return false;
    }

    // 移除现有文件
    await fs.remove(outputFilePath);

    // 写入新文件
    await workbook.xlsx.writeFile(outputFilePath);

    return true;
  }

  async fillSheet(
    sheet: Worksheet,
    sheetDO: Partial<WorksheetDO>,
    workbook: Workbook,
  ) {
    if (U.isValidArray(sheetDO.rows)) {
      for (const rowDO of sheetDO.rows) {
        if (!rowDO.number) {
          console.error('>>>fillSheet>>>', rowDO, '>>>invalid number');
          continue;
        }

        const $row = sheet.getRow(rowDO.number);

        // 判断是否需要隐藏
        if (rowDO.hidden) {
          $row.hidden = rowDO.hidden;
        }
      }
    }

    if (U.isValidArray(sheetDO.cells)) {
      let i = 0;
      // 遍历全部的 Cell
      for (const cellDO of sheetDO.cells) {
        // 判断是否已经被取消，如果取消则不再进行操作
        if (this.isCancelled) {
          return;
        }

        i++;

        const $cell = sheet.getCell(cellDO.address);

        if (this.onCellProgress) {
          this.onCellProgress(U.toFixedNumber(i / sheetDO.cells.length));
        }

        try {
          let mergableCellAddress = `${cellDO.address}:${cellDO.address}`;

          // 首先判断是否需要合并
          if (
            cellDO.mergedCellAddress &&
            cellDO.mergedCellAddress !== cellDO.address &&
            !$cell.isMerged
          ) {
            mergableCellAddress = `${cellDO.address}:${cellDO.mergedCellAddress}`;

            try {
              sheet.mergeCells(mergableCellAddress);
            } catch (_) {
              console.error(
                '>>>exceljs>>>fillSheet>>>mergeCells>>>' +
                  cellDO.address +
                  ':' +
                  cellDO.mergedCellAddress +
                  '>>>error:' +
                  _,
              );
            }
          }

          // 添加数据校验
          if (cellDO.dataValidation) {
            $cell.dataValidation = cellDO.dataValidation;
          }

          // 然后依次填充内容
          if (cellDO.style) {
            mergeStyle($cell, cellDO.style);
          }

          if (cellDO.value) {
            switch (cellDO.type) {
              case CellValueType.Null:
                break;
              case CellValueType.Merge:
                break;
              case CellValueType.Number:
                $cell.value = cellDO.value as number;
                break;
              case CellValueType.String:
                $cell.value = cellDO.value as string;
                break;
              case CellValueType.Date:
                $cell.value = new Date(cellDO.value as string);
                break;
              case CellValueType.Hyperlink:
                $cell.value = cellDO.value as CellHyperlinkValue;
                break;
              case CellValueType.RichText:
                $cell.value = cellDO.value as CellRichTextValue;
                break;
              case CellValueType.Boolean:
                $cell.value = cellDO.value as boolean;
                break;
              case CellValueType.Qrcode:
                const qrcodeValue = cellDO.value as CellQrcodeValue;

                try {
                  const base64 = await QRCode.toDataURL(qrcodeValue.qrcodeText);
                  const imageId = workbook.addImage({
                    base64,
                    extension: 'png',
                  });

                  // 判断是否指定了图片坐标，如果已经指定，则直接放置
                  if (qrcodeValue.tl && qrcodeValue.br) {
                    sheet.addImage(imageId, {
                      tl: qrcodeValue.tl as any,
                      br: qrcodeValue.br as any,
                    });
                  } else {
                    sheet.addImage(imageId, mergableCellAddress);
                  }
                } catch (_) {
                  console.error(
                    '>>>fillSheet>>>CellValueType.Qrcode>>>',
                    qrcodeValue.qrcodeText,
                  );
                }

                break;
              case CellValueType.Image:
                const imageValue = cellDO.value as CellImageValue;

                try {
                  // 抓取图片
                  const base64 = await getImageAsBase64(imageValue.src);

                  if (base64) {
                    const imageId = workbook.addImage({
                      base64,
                      extension: 'png',
                    });

                    if (imageValue.tl && imageValue.br) {
                      sheet.addImage(imageId, {
                        tl: imageValue.tl as any,
                        br: imageValue.br as any,
                      });
                    } else {
                      sheet.addImage(imageId, mergableCellAddress);
                    }
                  }
                } catch (_) {
                  console.error(
                    '>>>fillSheet>>>CellValueType.Image>>>',
                    imageValue.src,
                  );
                }

                break;
              default:
                $cell.value = cellDO.value as any;
                break;
            }
          }
        } catch (_) {
          console.error('>>>fillSheet>>>cell', _);
        }
      }
    }
  }
}
