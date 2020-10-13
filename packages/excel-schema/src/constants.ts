/* eslint-disable @typescript-eslint/camelcase */
export enum RelationshipType {
  None = 0,
  OfficeDocument = 1,
  Worksheet = 2,
  CalcChain = 3,
  SharedStrings = 4,
  Styles = 5,
  Theme = 6,
  Hyperlink = 7,
}

export enum DocumentType {
  Xlsx = 1,
}

export enum PaperSize {
  Legal = 5,
  Executive = 7,
  A4 = 9,
  A5 = 11,
  B5 = 13,
  Envelope_10 = 20,
  Envelope_DL = 27,
  Envelope_C5 = 28,
  Envelope_B5 = 34,
  Envelope_Monarch = 37,
  Double_Japan_Postcard_Rotated = 82,
  K16_197x273_mm = 119,
}
