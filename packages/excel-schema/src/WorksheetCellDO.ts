import { BaseEntity, isValidArray } from '@m-fe/utils';

import { Address, Style } from './style';
import {
  CellErrorValue,
  CellFormulaValue,
  CellHyperlinkValue,
  CellImageValue,
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
  | CellImageValue;

export class WorksheetCellDO extends BaseEntity<WorksheetCellDO> {
  address: Address;
  mergedCells?: [Address, Address];

  type: CellValueType;
  value: CellValue;

  style: Style;
  formula?: string;
  sharedFormula?: string;
  result?: string | number | any;
  comment: WorksheetCellCommentDO;
  dataValidation: DataValidation;

  constructor(data: Partial<WorksheetCellDO> = {}) {
    super(data);

    if (data.address) {
      this.address = new Address(data.address);
    }

    if (isValidArray(data.mergedCells) && data.mergedCells.length === 2) {
      this.mergedCells = [
        new Address(data.mergedCells[0]),
        new Address(data.mergedCells[1]),
      ];
    }

    if (!this.type) {
      // 根据值类型来指定类型
      if (data.value === null) {
        this.type = CellValueType.Null;
      } else if (typeof data.value === 'number') {
        this.type = CellValueType.Number;
      } else if (typeof data.value === 'string') {
        if (Date.parse(data.value)) {
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
        }
      }
    }
  }
}
