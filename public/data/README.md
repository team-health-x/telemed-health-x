# Thai Address Catalog

`thai-addresses.json` is a snapshot of HealthX's existing `address` reference
table, exported on 2026-09-24. It contains public province, district,
subdistrict and postal-code data only, with no customer records.

Shipping address selection loads this static asset rather than waiting for
the clinical database. Refresh the snapshot when the reference table changes;
validate all 77 provinces and preserve multiple areas sharing a postal code.
