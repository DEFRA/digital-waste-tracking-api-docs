---
search:
  exclude: true
robots: noindex, nofollow
---

# DWT National Movements: Versioning Schedule

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

Single source of truth for release scope.

> **Nomenclature change:** Releases are now numbered beta-0 through beta-5, replacing the earlier 1.0–2.0 numbering. Each entry below states the release's purpose and the specific integration risk or capability it lets software providers test, that's the lens for tagging any story to a release.

## Overview

| **Release** | **Name** | **Endpoints** | **Integration value for software providers** |
| :-- | :-- | :-- | :-- |
| beta-0 | Receipt of Waste (Production baseline) | receipt | What's live today — the only release currently deployed to production. |
| beta-1 | Contract API Test | all (no validation) | Tests structural alignment, and usage of identifiers across all the ednpoints. This ensures the process is implemented before the data. |
| beta-2 | Full Validation (all endpoints) | create, collect, drop-off, receipt, reject | Tests business-rule validation and Success/Warning/Error handling across the full movement lifecycle, including rejection. |
| beta-3 | Update a Waste Movement | all (update/cancel) | Tests amending or cancelling a movement already created. |
| beta-4 | Retrieve Waste Movements | retrieve (GET) | Tests the read/query side; pulling back movement data that has already been submitted. |
| beta-5 | Final Iterations | — | Absorbs outstanding high-priority feedback from beta-0–beta-4 before releasing to production |

**Milestone:** beta-2 is the earliest release that constitutes a fully testable end-to-end service — the first point an integrator can exercise create → collect → drop-off → receipt (plus reject) with full validation. Flag this when a story depends on full end-to-end integration testing.

---

## beta-0: Receipt of Waste (Production baseline)

- **Endpoints:** receipt
- **Data validation:** None specified
- **Response types:** Success

The current Production state of the platform, and the only release live and deployed today. This is the CURRENT API spec baseline. Any story referencing "what's currently deployed" should be checked against beta-0 only.

---

## beta-1: Contract API Test

- **Endpoints:** create, collect, drop-off, receipt
- **Data validation:** None
- **Response types:** Success, Faked Error

Exact mapping to the former Release 1.1. All endpoints are deployed to the test environment with no data validation or business rules enforced — any payload can be sent to an endpoint and a successful response is returned.

**Value to software providers:** this is where an integrator confirms the highest-risk unknown first; structural alignment. Can the identifiers be correctly consumed and mapped to operational events within their systems, with the correct identifiers (Movement ID, Transfer ID). This release is not a source of validation or error-handling behaviour for story writing, that arrives in beta-2.

---

## beta-2: Full Validation (all endpoints)

- **Endpoints:** create, collect, drop-off, receipt, reject
- **Data validation:** Full
- **Response types:** Success, Warning, Error

Full data structure and business-rule validation is added across every core endpoint (create, collect, drop-off, receipt), and reject-movement functionality is introduced alongside it. Success, Warning, and Error responses can now be returned.

**Value to software providers:** this is where an integrator moves from "does the process work" to "does my data pass the rules”. Testing real validation logic, warning/error handling, and the ability to reject a movement, across the full create → collect → drop-off → receipt journey. Any story involving validation, warnings, error handling, or rejection belongs to beta-2 or later — not beta-0/beta-1, which have no validation.

**Open item:** whether beta-2 is released as one block or sliced into independent per-endpoint validation releases has not been decided. Confirm before tagging a story that assumes one or the other.

---

## beta-3: Update a Waste Movement

- **Endpoints:** all (update/cancel functionality)
- **Data validation:** Full
- **Response types:** Success, Warning, Error

Full update and cancel functionality is added across the whole suite of endpoints.

**Value to software providers:** tests an integrator's ability to correct or withdraw a movement after the fact, rather than only ever submitting forward, this closes the loop on data entry errors or changed circumstances. Any story involving amending or cancelling an already-created Waste Movement belongs to beta-3 or later.

---

## beta-4: Retrieve Waste Movements

- **Endpoints:** retrieve (GET)
- **Data validation:** Full
- **Response types:** Success, Warning, Error

GET endpoints for retrieving Waste Movement information are added to the platform.

**Value to software providers:** tests the read/query side of integration, confirming an integrator can retrieve and reconcile movement data they've previously submitted, not just push data one-way. Any story involving querying existing movement data belongs to beta-4 or later.

---

## beta-5: Final Iterations

- **Endpoints:** —
- **Data validation:** n/a
- **Response types:** —

Any high-priority outstanding feedback from previous releases is addressed here. Scope is not fixed in advance — this release absorbs whatever high-priority items remain open from beta-0– beta-4 at that point.

**Value to software providers:** de-risks final integration ahead of production availability by resolving known friction points raised during beta-0–beta-4 testing. Do not tag a story to beta-5 unless it's explicitly deferred feedback from an earlier release.
