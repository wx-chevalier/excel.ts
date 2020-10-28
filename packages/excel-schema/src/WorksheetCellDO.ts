import { BaseEntity } from '@m-fe/utils';

import { Style } from './style';
import {
  CellErrorValue,
  CellFormulaValue,
  CellHyperlinkValue,
  CellImageValue,
  CellQrcodeValue,
  CellRichTextValue,
  CellSharedFormulaValue,
  DataValidation,
} from './value';
import { WorksheetCellCommentDO } from './WorksheetCellCommentDO';

export enum CellValueType {
  Null = 0,
  Merge = 1,
  Number = 2,
  String = 3,
  Date = 4,
  Hyperlink = 5,
  Formula = 6,
  SharedString = 7,
  RichText = 8,
  Boolean = 9,
  Error = 10,
  Image = 11,
  Qrcode = 12,
}

export type CellValue =
  | null
  | number
  | string
  | boolean
  | Date
  | CellErrorValue
  | CellRichTextValue
  | CellHyperlinkValue
  | CellFormulaValue
  | CellSharedFormulaValue
  | CellImageValue
  | CellQrcodeValue;

export class WorksheetCellDO extends BaseEntity<WorksheetCellDO> {
  address: string;

  // 该 Cell 合并到的目标
  mergedCellAddress?: string;

  type: CellValueType;
  value: CellValue;

  style: Partial<Style>;
  formula?: string;
  sharedFormula?: string;
  result?: string | number | any;
  comment: WorksheetCellCommentDO;
  dataValidation: DataValidation;

  constructor(data: Partial<WorksheetCellDO> = {}) {
    super(data);

    if (!this.type) {
      // 根据值类型来指定类型
      if (data.value === null) {
        this.type = CellValueType.Null;
      } else if (typeof data.value === 'number') {
        this.type = CellValueType.Number;
      } else if (typeof data.value === 'string') {
        if (
          (data.value.includes('-') || data.value.includes('/')) &&
          Date.parse(data.value)
        ) {
          this.type = CellValueType.Date;
        } else {
          this.type = CellValueType.String;
        }
      } else if (typeof data.value === 'object') {
        if ((data.value as CellHyperlinkValue).hyperlink) {
          this.type = CellValueType.Hyperlink;
        } else if ((data.value as CellRichTextValue).richText) {
          this.type = CellValueType.RichText;
        } else if ((data.value as CellImageValue).src) {
          this.type = CellValueType.Image;
        } else if ((data.value as CellQrcodeValue).qrcodeText) {
          this.type = CellValueType.Qrcode;
        }
      }
    }
  }
}

const hasValue = (v: any) => typeof v !== 'undefined' && v !== null && v !== '';

/** 合并元组 */
export function mergeCell(
  cell1: Partial<WorksheetCellDO>,
  cell2: Partial<WorksheetCellDO>,
) {
  // 合并值与类型
  if (hasValue(cell2.value)) {
    cell1.value = cell2.value;
    cell1.type = cell2.type;
  }

  // 合并合并项目
  if (cell2.mergedCellAddress) {
    cell1.mergedCellAddress = cell2.mergedCellAddress;
  }

  // 合并样式
  if (hasValue(cell2.style)) {
    cell1.style = mergeStyle(cell1.style, cell2.style);
  }

  return cell1;
}

/** 合并样式对象 */
export function mergeStyle(style1: Partial<Style>, style2: Partial<Style>) {
  if (!style1 || !style2) {
    return style1 || style2 || {};
  }

  const { alignment, font, border, fill, protection } = style2;

  if (alignment) {
    style1.alignment = {
      ...(style1.alignment || {}),
      ...alignment,
    };
  }

  if (font) {
    style1.font = {
      ...(style1.font || {}),
      ...font,
    };
  }

  if (border) {
    style1.border = {
      ...(style1.border || {}),
      ...border,
    };
  }

  if (fill) {
    style1.fill = {
      ...(style1.fill || {}),
      ...fill,
    };
  }

  if (protection) {
    style1.protection = {
      ...(style1.protection || {}),
      ...protection,
    };
  }

  return style1;
}
