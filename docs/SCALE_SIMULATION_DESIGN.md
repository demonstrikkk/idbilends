# Scale Simulation Design

Phase 6 scales the synthetic demo engine from the 9 flagship MSMEs to 1000 deterministic synthetic profiles.

## Generation

The first 9 flagship cases remain stable for the original demo script. Additional profiles are generated from seeded weighted distributions for segment, scenario, city, state, zone, branch, relationship manager, and sector tags.

## Operational Fields

Generated profiles include region, zone, branch, relationship manager, sector tags, monitoring status, and last-updated metadata where the schema allows it.

## Querying

`GET /portfolio/cases` supports limit, offset, sort, risk tier, segment, city, zone, branch, scenario, and text search. The frontend should request slices rather than loading all 1000 cases into every page.

## Data Safety

All generated records are synthetic. No real customer, IDBI, GST, bureau, Udyam, GeM, or Account Aggregator data is included.
