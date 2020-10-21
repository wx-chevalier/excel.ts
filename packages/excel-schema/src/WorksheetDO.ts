import { BaseEntity, isValidArray } from '@m-fe/utils';

import { Style } from './style';
import { WorksheetCellDO, mergeCell, mergeStyle } from './WorksheetCellDO';
import {
  HeaderFooter,
  PageSetup,
  WorksheetProperties,
  WorksheetView,
} from './WorksheetProps';

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

function mergeRow(
  row1: Partial<WorksheetRowDO>,
  row2: Partial<WorksheetRowDO>,
) {
  return new WorksheetRowDO({
    ...row1,
    ...row2,
    style: mergeStyle(row1.style, row2.style),
  });
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
}

function mergeCol(
  col1: Partial<WorksheetColDO>,
  col2: Partial<WorksheetColDO>,
) {
  return new WorksheetRowDO({
    ...col1,
    ...col2,
    style: mergeStyle(col1.style, col2.style),
  });
}

export class WorksheetDO extends BaseEntity<WorksheetDO> {
  name: string;

  columns: Array<Partial<WorksheetColDO>> = [];
  rows: Array<Partial<WorksheetRowDO>> = [];
  cells: Partial<WorksheetCellDO>[] = [];

  /**
   * Contains information related to how a worksheet is printed
   */
  pageSetup: Partial<PageSetup>;

  /**
   *
   */
  view: Partial<WorksheetView>;

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
  properties: Partial<WorksheetProperties>;

  optimize() {
    // 合并 cells
    const finalCellMap: Record<string, Partial<WorksheetCellDO>> = {};

    for (const cell of this.cells) {
      if (!finalCellMap[cell.address]) {
        finalCellMap[cell.address] = cell;
      } else {
        // 如果已经存在，则进行合并
        finalCellMap[cell.address] = mergeCell(
          finalCellMap[cell.address],
          cell,
        );
      }
    }

    this.cells = Object.values(finalCellMap);

    const finalRowMap: Record<number, Partial<WorksheetRowDO>> = {};

    // 合并 rows
    for (const row of this.rows) {
      if (!finalRowMap[row.number]) {
        finalRowMap[row.number] = row;
      } else {
        finalRowMap[row.number] = mergeRow(finalRowMap[row.number], row);
      }
    }

    this.rows = Object.values(finalRowMap);

    // 合并 cols
    const finalColMap: Record<number, Partial<WorksheetColDO>> = {};

    for (const col of this.columns) {
      if (!finalColMap[col.key]) {
        finalColMap[col.key] = col;
      } else {
        finalColMap[col.key] = mergeCol(finalColMap[col.key], col);
      }
    }

    this.columns = Object.values(finalColMap);
  }

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
