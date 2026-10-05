/** A QR code template, as the template lookups return it. */
export interface IQRCodeTemplateLookupItem {
  /** The `templateId` the QR create methods take. */
  _id: string;
  name: string;
}

/** Filter for the template lookups. */
export interface IQRCodeTemplateLookupParams {
  /** Name contains, case-insensitive. */
  term?: string;
}

/** Extra filter for Posty5's public templates. */
export interface IPublicQRCodeTemplateLookupParams extends IQRCodeTemplateLookupParams {
  schemeType?: string;
}
