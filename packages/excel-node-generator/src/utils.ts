import * as U from '@m-fe/utils';
import axios from 'axios';
import URI from 'urijs';

export function encodeUrl(url: string) {
  const u: URI = U.newUri(url);

  return `${u.scheme()}://${u.host()}${encodeURI(u.path())}`;
}

/** 从 URL 中获取图片的 Base64 */
export async function getImageAsBase64(url: string) {
  return axios
    .get(U.encodeUri(url), {
      responseType: 'arraybuffer',
    })
    .then(response => Buffer.from(response.data, 'binary').toString('base64'));
}
