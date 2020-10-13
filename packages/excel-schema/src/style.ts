import { BaseEntity } from '@m-fe/utils';

/** 颜色定义 */
export interface Color {
  /**
   * Hex string for alpha-red-green-blue e.g. FF00FF00
   */
  argb: string;

  /**
   * Choose a theme by index
   */
  theme: number;
}

/** 字体样式 */
export interface Font {
  name: string;
  size: number;
  family: number;
  scheme: 'minor' | 'major' | 'none';
  charset: number;
  color: Partial<Color>;
  bold: boolean;
  italic: boolean;
  underline:
    | boolean
    | 'none'
    | 'single'
    | 'double'
    | 'singleAccounting'
    | 'doubleAccounting';
  vertAlign: 'superscript' | 'subscript';
  strike: boolean;
  outline: boolean;
}

/** 边框 */
export type BorderStyle =
  | 'thin'
  | 'dotted'
  | 'hair'
  | 'medium'
  | 'double'
  | 'thick'
  | 'dashDot'
  | 'dashDotDot'
  | 'slantDashDot'
  | 'mediumDashed'
  | 'mediumDashDotDot'
  | 'mediumDashDot';

export interface Border {
  style: BorderStyle;
  color: Partial<Color>;
}

export interface BorderDiagonal extends Border {
  up: boolean;
  down: boolean;
}

export interface Borders {
  top: Partial<Border>;
  left: Partial<Border>;
  bottom: Partial<Border>;
  right: Partial<Border>;
  diagonal: Partial<BorderDiagonal>;
}

export interface Margins {
  top: number;
  left: number;
  bottom: number;
  right: number;
  header: number;
  footer: number;
}

export declare enum ReadingOrder {
  LeftToRight = 1,
  RightToLeft = 2,
}

export interface Alignment {
  horizontal:
    | 'left'
    | 'center'
    | 'right'
    | 'fill'
    | 'justify'
    | 'centerContinuous'
    | 'distributed';
  vertical: 'top' | 'middle' | 'bottom' | 'distributed' | 'justify';
  wrapText: boolean;
  shrinkToFit: boolean;
  indent: number;
  readingOrder: 'rtl' | 'ltr';
  textRotation: number | 'vertical';
}

export interface Protection {
  locked: boolean;
}

export type FillPatterns =
  | 'none'
  | 'solid'
  | 'darkVertical'
  | 'darkHorizontal'
  | 'darkGrid'
  | 'darkTrellis'
  | 'darkDown'
  | 'darkUp'
  | 'lightVertical'
  | 'lightHorizontal'
  | 'lightGrid'
  | 'lightTrellis'
  | 'lightDown'
  | 'lightUp'
  | 'darkGray'
  | 'mediumGray'
  | 'lightGray'
  | 'gray125'
  | 'gray0625';

export interface FillPattern {
  type: 'pattern';
  pattern: FillPatterns;
  fgColor: Partial<Color>;
  bgColor?: Partial<Color>;
}

export interface GradientStop {
  position: number;
  color: Partial<Color>;
}

export interface FillGradientAngle {
  type: 'gradient';
  gradient: 'angle';

  /**
   * For 'angle' gradient, specifies the direction of the gradient. 0 is from the left to the right.
   * Values from 1 - 359 rotates the direction clockwise
   */
  degree: number;

  /**
   * Specifies the gradient colour sequence. Is an array of objects containing position and
   * color starting with position 0 and ending with position 1.
   * Intermediary positions may be used to specify other colours on the path.
   */
  stops: GradientStop[];
}

export interface FillGradientPath {
  type: 'gradient';
  gradient: 'path';

  /**
   * For 'path' gradient. Specifies the relative coordinates for the start of the path.
   * 'left' and 'top' values range from 0 to 1
   */
  center: { left: number; top: number };

  /**
   * Specifies the gradient colour sequence. Is an array of objects containing position and
   * color starting with position 0 and ending with position 1.
   * Intermediary positions may be used to specify other colours on the path.
   */
  stops: GradientStop[];
}

export type Fill = FillPattern | FillGradientAngle | FillGradientPath;

export interface Style {
  numFmt: string;
  font: Partial<Font>;
  alignment: Partial<Alignment>;
  protection: Partial<Protection>;
  border: Partial<Borders>;
  fill: Fill;
}

export class ParsedAddress extends BaseEntity<ParsedAddress> {
  sheetName?: string;
  address: string;
  col: string;
  row: number;
  $col$row: string;

  constructor(data: Partial<ParsedAddress> = {}) {
    super(data);

    // 判断 address 与 col/row 是否都有
    if (this.address) {
      const parsedAddress = /([A-Z]+)(\d+)/.exec(this.address);

      this.col = parsedAddress[1];
      this.row = Number(parsedAddress[2]);
    } else {
      this.address = `${this.col}${this.row}`;
    }
  }
}
