import { BaseEntity, isValidArray } from '@m-fe/utils';

import { Alignment, Borders, Fill, Font, Protection, Style } from './style';
import { WorksheetCellDO } from './WorksheetCellDO';
import { HeaderFooter, PageSetup, WorksheetProperties } from './WorksheetProps';

export type WorksheetState = 'visible' | 'hidden' | 'veryHidden';

export class WorksheetRowDO extends BaseEntity<WorksheetRowDO> {
  number: number;
  min: number;
  max: number;
  height: number;
  style: Partial<Style>;
  hidden: boolean;
  outlineLevel: number;
  collapsed: boolean;
}

export class WorksheetColDO extends BaseEntity<WorksheetColDO> {
  /**
   * Can be a string to set one row high header or an array to set multi-row high header
   */
  header: string | string[];

  /**
   * The name of the properties associated with this column in each row
   */
  key: string;

  /**
   * The width of the column
   */
  width: number;

  /**
   * Set an outline level for columns
   */
  outlineLevel: number;

  /**
   * Hides the column
   */
  hidden: boolean;

  /**
   * Styles applied to the column
   */
  style: Partial<Style>;

  border: Partial<Borders>;
  fill: Fill;
  numFmt: string;
  font: Partial<Font>;
  alignment: Partial<Alignment>;
  protection: Partial<Protection>;
}

export class WorksheetDO extends BaseEntity<WorksheetDO> {
  name: string;

  columns: Array<Partial<WorksheetColDO>>;
  rows: Array<Partial<WorksheetRowDO>>;
  cells: Partial<WorksheetCellDO>[];

  /**
   * Contains information related to how a worksheet is printed
   */
  pageSetup: Partial<PageSetup>;

  /**
   * Worksheet Header and Footer
   */
  headerFooter: Partial<HeaderFooter>;

  /**
   * Worksheet State
   */
  state: WorksheetState;

  /**
   * Worksheet Properties
   */
  properties: WorksheetProperties;

  constructor(data: Partial<WorksheetDO> = {}) {
    super(data);

    if (isValidArray(data.columns)) {
      this.columns = data.columns.map(c => new WorksheetColDO(c));
    }

    if (isValidArray(data.rows)) {
      this.rows = data.rows.map(r => new WorksheetRowDO(r));
    }

    if (isValidArray(data.cells)) {
      this.cells = data.cells.map(c => new WorksheetCellDO(c));
    }
  }
}
