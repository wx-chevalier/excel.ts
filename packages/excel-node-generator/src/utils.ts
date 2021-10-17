import * as U from '@m-fe/utils';
import axios from 'axios';
import { Cell, Column, Row, Style } from 'exceljs';

/** 从 URL 中获取图片的 Base64 */
export async function getImageAsBase64(url: string) {
  return (
    axios
      // 这里仅对中文和特殊字符编码
      .get(U.encodeUri(url), {
        responseType: 'arraybuffer',
      })
      .then(response => Buffer.from(response.data, 'binary').toString('base64'))
  );
}

/** 合并样式对象 */
export function mergeStyle(
  obj: Cell | Partial<Column> | Partial<Row>,
  style: Partial<Style>,
) {
  const { alignment, font, border, fill, protection } = style;

  if (alignment) {
    obj.alignment = {
      ...(obj.alignment || {}),
      ...alignment,
    };
  }

  if (font) {
    obj.font = {
      ...(obj.font || {}),
      ...font,
    };
  }

  if (border) {
    obj.border = {
      ...(obj.border || {}),
      ...border,
    };
  }

  if (fill) {
    obj.fill = {
      ...(obj.fill || {}),
      ...fill,
    };
  }

  if (protection) {
    obj.protection = {
      ...(obj.protection || {}),
      ...protection,
    };
  }
}
