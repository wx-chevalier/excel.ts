import {
  CellHyperlinkValue,
  CellImageValue,
  CellRichTextValue,
  CellValueType,
  WorkbookDO,
  WorksheetDO,
} from '@m-fe/excel-schema';
import { isValidArray } from '@m-fe/utils';
import Excel, { PageSetup, Workbook, Worksheet } from 'exceljs';
import fs from 'fs-extra';

import { getImageAsBase64 } from './utils';

export async function generateByExcelJs(
  workbookDO: WorkbookDO,
  outputFilePath: string,
) {
  const workbook = new Excel.Workbook();

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
    if (isValidArray(sheetDO.columns)) {
      sheetDO.columns.forEach(c => {
        const $col = sheet.getColumn(c.key);

        if (c.width) {
          $col.width = c.width;
        }
      });
    }

    if (isValidArray(sheetDO.rows)) {
      sheetDO.rows.forEach(c => {
        const $row = sheet.getRow(Number(c.number));

        if (c.height) {
          $row.height = c.height;
        }
      });
    }

    await fillSheet(sheet, sheetDO, workbook);
  }

  // 移除现有文件
  await fs.remove(outputFilePath);

  // 写入新文件
  await workbook.xlsx.writeFile(outputFilePath);
}

/** 填写具体的某个 Sheet */
export async function fillSheet(
  sheet: Worksheet,
  sheetDO: Partial<WorksheetDO>,
  workbook: Workbook,
) {
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

  // 遍历全部的 Cell
  for (const cellDO of sheetDO.cells) {
    try {
      let mergableCellAddress = `${cellDO.address}:${cellDO.address}`;

      // 首先判断是否需要合并
      if (cellDO.mergedCellAddress) {
        mergableCellAddress = `${cellDO.address}:${cellDO.mergedCellAddress}`;
        sheet.mergeCells(mergableCellAddress);
      }

      const $cell = sheet.getCell(cellDO.address);

      // 添加数据校验
      if (cellDO.dataValidation) {
        $cell.dataValidation = cellDO.dataValidation;
      }

      // 然后依次填充内容
      if (cellDO.style) {
        const { alignment, font } = cellDO.style;

        if (alignment) {
          $cell.alignment = {
            ...($cell.alignment || {}),
            ...alignment,
          };
        }

        if (font) {
          $cell.font = {
            ...($cell.font || {}),
            ...font,
          };
        }
      }

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
        case CellValueType.Image:
          const imageValue = cellDO.value as CellImageValue;
          try {
            // 抓取图片
            const base64 = await getImageAsBase64(imageValue.src);
            const imageId = workbook.addImage({ base64, extension: 'png' });
            sheet.addImage(imageId, mergableCellAddress);
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
    } catch (_) {
      console.error('>>>fillSheet>>>cell', _);
    }
  }
}
