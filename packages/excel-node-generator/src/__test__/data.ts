import * as S from 'ufc-schema';

const inquiryOrderStatements: any[] = [
  {
    id: 'INQUIRY_ORDER-535',
    code: 'XJ20200815-374815-4',
    payMethod: '月结',
    createdAt: '2020-08-15T22:33:09+08:00',
    switchWaitProductAt: '2020-09-01T16:21:51+08:00',
    price: {
      orderId: 'INQUIRY_ORDER-535',
      handleFee: 0,
      postage: 0,
      packingFee: 0,
      surcharge: 0,
      materialFee: 1010.91,
      taxRate: 130,
      totalPriceWithTax: 1010.91,
      totalPriceWithoutTax: 879.49,
    },
    saleManId: 'USER-6',
    saleMan: {
      userId: 'USER-6',
      username: 'XXXX',
      nickname: 'XXXX',
    },
    printInfo: [
      {
        orderId: 'INQUIRY_ORDER-535',
        orderItemId: 'INQUIRY_ORDER_ITEM-641',
        fileId: 'FILE-30283',
        handle: {
          method: '',
          desc: '',
        },
        price: 1010.91,
        printCount: 1,
        fileName: '巴基碗_巴基碗1.stl',
        previewUrl: {
          url:
            'https://gateway.test.unionfab.com/file/md5/8db70b5d99c74d66d3d527f06d862ec2/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyI4ZGI3MGI1ZDk5Yzc0ZDY2ZDNkNTI3ZjA2ZDg2MmVjMiJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMxNzUwMDAsImlhdCI6MTYwMjU3MDIwMH0.EHRcRpISqa7m4uQl8DBFIiuHYDy3RWHZBBCOBf29B6CK2OfomkI4MVTxN1yZVl7ZhNCEA8tOXcitpSiRrLAMvw&name=decompressed-巴基碗_巴基碗1.stl.thumbnail.PNG',
          expiresAt: '2020-10-20T06:23:20.995Z',
        },
        thumbnailFileId: 'FILE-30285',
        materialName: '测试材料二',
      },
    ],
  },
  {
    id: 'INQUIRY_ORDER-657',
    code: 'XJ20200824-454878-4',
    payMethod: '月结',
    createdAt: '2020-08-24T20:50:53+08:00',
    switchWaitProductAt: '2020-09-07T16:58:41+08:00',
    price: {
      orderId: 'INQUIRY_ORDER-657',
      handleFee: 100,
      postage: 0,
      packingFee: 0,
      surcharge: 0,
      materialFee: 245,
      taxRate: 130,
      totalPriceWithTax: 345,
      totalPriceWithoutTax: 300.15,
    },
    saleManId: 'USER-5',
    saleMan: {
      userId: 'USER-5',
      username: 'tangfeng',
      nickname: 'YYYY',
    },
    printInfo: [
      {
        orderId: 'INQUIRY_ORDER-657',
        orderItemId: 'INQUIRY_ORDER_ITEM-1330',
        fileId: 'FILE-31529',
        handle: {
          method: '丝印',
          desc: '7894456123123123123',
        },
        price: 245,
        printCount: 1,
        fileName: '猫或狗碗1.stl',
        previewUrl: {
          url:
            'https://gateway.test.unionfab.com/file/md5/ee61b24b802a9ba46eb8919b47ea4c84/download?&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJhY2Nlc3NpYmxlTWQ1cyI6WyJlZTYxYjI0YjgwMmE5YmE0NmViODkxOWI0N2VhNGM4NCJdLCJjYW5BY2Nlc3NBbnkiOnRydWUsImlzcyI6InVmYyIsInJlYWRPbmx5Ijp0cnVlLCJleHAiOjE2MDMxNzUwMDAsImlhdCI6MTYwMjU3MDIwMH0.25Vtd9RuXMMR1SqCArpJzvhedUFeM5TCf8Qt79PALRrVNJG0CC-glwNTfccfU0ywNr9czkySOUNHb2W0J2ff3Q&name=猫或狗碗1.stl.thumbnail.PNG',
          expiresAt: '2020-10-20T06:23:20.996Z',
        },
        thumbnailFileId: 'FILE-31530',
        materialName: '测试材料五',
      },
    ],
  },
];

export const testData: {
  totalPrice: number;
  date: string;
  customerName: string;
  inquiryOrderStatement: S.InquiryOrderStatement[];
} = {
  date: '2020-09-01~2020-10-13',
  totalPrice: 1355.91,
  customerName: '客户AAA1',
  inquiryOrderStatement: inquiryOrderStatements.map(
    s => new S.InquiryOrderStatement(s),
  ),
};
