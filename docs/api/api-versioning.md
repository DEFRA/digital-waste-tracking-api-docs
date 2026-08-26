---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

## TL;DR

Version the API **during beta** (path-based milestones, `/beta-N`, e.g. `/beta-1/waste-movements/{id}`, run in parallel) to iterate on shape while breaking changes are frequent; at **GA drop the version** and publish a single stable **unversioned** API that evolves **additive-only** thereafter. Within a given `/beta-N`, software providers get the **full endpoint surface** — never a split where some endpoints sit on one version and some on another. Beta versions are retired by usage, signalled in-band with a `Deprecation: true` header.

## Baseline

There is no versioning of any kind today — no path prefix, no version header, no query parameter. The spec's `info.version` (`0.2.5-alpha`) is a documentation label, not a runtime version, and the server URL carries no `/v1`. The only existing statement is a terms-of-service line telling integrators to keep their software compatible with "the latest version" — a single-track policy with no technical scheme.

Only the **Receipt of Waste** endpoints are live; the rest of the waste-movement journey is still to be built. This scheme applies to those **new** endpoints — the already-live endpoints keep their current unversioned paths.

The [GOV.UK API technical and data standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) recommend URI-path versioning _if_ you version, and advise against header and media-type versioning (proxies and firewalls can block them); their overriding principle is not to break existing consumers.

## Problem

As the remaining endpoints are built we will discover the right shape by iterating, which means frequent breaking changes before the contract stabilises. We need a way to ship those iterations without conflict — and, once stable, a public contract that never breaks its integrators. A single fixed policy serves one phase well and the other badly: always-version carries needless machinery and duplication once the shape is stable; never-version makes rapid, breaking iteration painful while we are still designing.

## Solution

**Version while in beta, then drop the version at GA.** Use versioning as a development-phase tool to iterate on the API shape; once the shape is settled, publish a single stable **unversioned** API and evolve it additively from then on. This applies the ["just say no to versioning"](https://www.hmeid.com/blog/just-say-no-to-versioning) discipline exactly where it matters — the stable public contract — while keeping versioning where it earns its keep — rapid, breaking iteration during beta.

- **During beta — versioned in the URI path.** While we are still discovering the shape, breaks are frequent, so we version each milestone in the path (`/beta-0`, `/beta-1`, …) and can run milestones **in parallel**, letting the small, controlled set of early integrators migrate at their own pace. The version is a **prefix** on the resource path, not a separate host or query parameter — e.g. the collection-event endpoint is `/beta-0/waste-movements/{id}/collection` in milestone 0 and, unchanged in shape, `/beta-1/waste-movements/{id}/collection` once milestone 1 exists. Path is the simplest addressable form and beta is non-public, so it is acceptable here; a request header would keep URLs cleaner (nodding to review feedback that milestone labels shouldn't sit in public paths), but that only matters once public — which, by design, this never is.
- **Full endpoint parity within a version — no split access.** A software provider integrating against `/beta-N` must be able to reach the **entire** endpoint surface at that prefix; it is never the case that some endpoints live only on `/beta-N` and others only on `/beta-N+1`. Concretely, this means: when a breaking change forces a milestone bump, we copy **every** existing endpoint forward into the new version — not just the one that changed — so `/beta-N+1` is complete and self-consistent from the moment it exists. This costs more duplication per bump but keeps the integration story simple: one version number to code against, never a matrix of which endpoint is on which milestone.
- **At GA — drop the version; unversioned and additive-only thereafter.** Once the shape is settled we publish one **unversioned** API and commit to never breaking it: additive changes only (new optional fields/endpoints/enum values, shipped in place), clients tolerate unknown fields, complexity absorbed server-side. A genuinely unavoidable breaking change is treated as a **new resource/API**, not a `/v2`. This honours the GOV.UK standard's overriding principle — don't break existing consumers.
- **The beta→GA cutover.** Dropping the version at GA is itself a one-time breaking change for beta integrators — but that is expected (a beta contract is unstable by definition) and it is a single, announced event. Smooth it with the deprecation mechanism below: run the final `/beta-N` **alongside** the unversioned GA API for a migration window, mark its paths deprecated, then retire them.
- **New endpoints only; existing stay put.** All of this applies to the new waste-movement endpoints; the already-live endpoints keep their current unversioned paths — we don't move them.
- **Orchestrated in the service** Running beta milestones in parallel lives in the **same service** (branching/duplicated handlers per milestone) — confirmed there is no CDP platform versioning/routing capability to use instead, so in-service duplication is the mechanism. (Post-GA there is a single unversioned API, so this cost disappears.)
- **Usage-driven deprecation, signalled by `Deprecation: true`.** To retire a beta version, monitor calls **per software provider** (via the JWT `client_id` that identifies the calling software), nudge remaining providers to migrate, and once use is negligible, withdraw it. While deprecated, every response from that version carries a single `Deprecation: true` header — an in-band signal a monitoring client can detect immediately, not only via out-of-band comms.

## Rabbit holes

- **Cost of full-surface duplication per bump.** Requiring every endpoint to exist at the latest `/beta-N` means a single breaking change to one endpoint forces copying all the others forward too, not just the one that changed. As the endpoint count grows this makes each milestone bump more expensive — not a blocker, but worth watching if milestones turn out to be frequent.

## References

- [GOV.UK — API technical and data standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) — recommends URI-path versioning; overriding principle is not to break existing consumers.
- ["Just say no to versioning" — hmeid.com](https://www.hmeid.com/blog/just-say-no-to-versioning) — the argument for evolving additively instead of versioning; the basis for the unversioned, additive-only GA approach.
