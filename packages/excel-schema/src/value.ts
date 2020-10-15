import { Font } from './style';

/** 值类型 */
export enum ErrorValue {
  NotApplicable = '#N/A',
  Ref = '#REF!',
  Name = '#NAME?',
  DivZero = '#DIV/0!',
  Null = '#NULL!',
  Value = '#VALUE!',
  Num = '#NUM!',
}

export interface CellImageValue {
  src: string;
  width?: number;
  height?: number;
}

export interface CellQrcodeValue {
  qrcodeText: string;
  width?: number;
  height?: number;
}

export interface CellErrorValue {
  error:
    | '#N/A'
    | '#REF!'
    | '#NAME?'
    | '#DIV/0!'
    | '#NULL!'
    | '#VALUE!'
    | '#NUM!';
}

export interface RichText {
  text: string;
  font?: Partial<Font>;
}

export interface CellRichTextValue {
  richText: RichText[];
}

export interface CellHyperlinkValue {
  text: string;
  hyperlink: string;
}

export interface CellFormulaValue {
  formula: string;
  result?: number | string | Date | { error: CellErrorValue };
  date1904: boolean;
}

export interface CellSharedFormulaValue {
  sharedFormula: string;
  readonly formula?: string;
  result?: number | string | Date | { error: CellErrorValue };
  date1904: boolean;
}

export type DataValidationOperator =
  | 'between'
  | 'notBetween'
  | 'equal'
  | 'notEqual'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual';

export interface DataValidation {
  type: 'list' | 'whole' | 'decimal' | 'date' | 'textLength' | 'custom';
  formulae: any[];
  allowBlank?: boolean;
  operator?: DataValidationOperator;
  error?: string;
  errorTitle?: string;
  errorStyle?: string;
  prompt?: string;
  promptTitle?: string;
  showErrorMessage?: boolean;
  showInputMessage?: boolean;
}
