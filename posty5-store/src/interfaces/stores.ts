/** One store the key's owner can manage, from `GET /api/store/lookup`. */
export interface IStoreLookupItem {
  /** The `storeId` every other store method takes. */
  _id: string;
  /** `"<slug> - <name>"`. */
  name: string;
}
