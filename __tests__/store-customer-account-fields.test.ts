/**
 * storefront-customer-accounts — `accountKind` / `emailVerified` on a customer
 * are optional and typed, so a payload from an older API still fits. Offline:
 * no API. Written 2026-10-22, not run (ask before running the npm-sdk suite).
 */
import { IStoreCustomer, StoreCustomerAccountKind } from "@posty5/store";

describe("@posty5/store — customer account fields", () => {
  it("accepts a customer with the account fields and one without them", () => {
    const withAccount: IStoreCustomer = { _id: "c1", __v: 0, name: "Sara", hasAccount: false, accountKind: "store", emailVerified: true };
    const older: IStoreCustomer = { _id: "c2", __v: 0, name: "Omar", hasAccount: true };
    expect(withAccount.accountKind).toBe("store");
    expect(older.accountKind).toBeUndefined();
  });

  it("tells a store-account holder from a guest, which hasAccount cannot", () => {
    const rows: Partial<IStoreCustomer>[] = [
      { hasAccount: false, accountKind: "store", emailVerified: false },
      { hasAccount: false, accountKind: "guest" },
      { hasAccount: true, accountKind: "posty5" },
    ];
    const kinds: StoreCustomerAccountKind[] = ["store", "guest", "posty5"];
    expect(rows.map((row) => row.accountKind)).toEqual(kinds);
    expect(rows.filter((row) => row.accountKind === "guest")).toHaveLength(1);
  });
});
