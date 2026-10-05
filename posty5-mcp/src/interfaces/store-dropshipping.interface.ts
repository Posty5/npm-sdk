import type { IOrderFulfilmentGroup } from "@posty5/store";

/** One part of a store order, found to name it in a confirmation text. */
export interface IOrderPartLookup {
  orderNumber: string;
  part: IOrderFulfilmentGroup;
}
