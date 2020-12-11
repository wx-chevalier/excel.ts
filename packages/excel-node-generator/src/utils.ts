import * as U from '@m-fe/utils';
import axios from 'axios';

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
