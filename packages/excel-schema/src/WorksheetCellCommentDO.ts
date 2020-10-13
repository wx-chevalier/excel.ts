import { RichText } from './value';

export interface CommentMargins {
  insetmode: 'auto' | 'custom';
  inset: number[];
}

export interface CommentProtection {
  locked: 'True' | 'False';
  lockText: 'True' | 'False';
}

export type CommentEditAs = 'twoCells' | 'oneCells' | 'absolute';

export interface WorksheetCellCommentDO {
  texts?: RichText[];
  margins?: Partial<CommentMargins>;
  protection?: Partial<CommentProtection>;
  editAs?: CommentEditAs;
}
