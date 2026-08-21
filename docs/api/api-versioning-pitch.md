---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

## TL;DR

Version the API **during alpha** (path-based milestones, `/v1-alpha-N`, run in parallel) to iterate on shape while breaking changes are frequent; at **GA drop the version** and publish a single stable **unversioned** API that evolves **additive-only** thereafter. Alpha versions are retired by usage, signalled in-band with a `Deprecation: true` header.

## Baseline

There is no versioning of any kind today — no path prefix, no version header, no query parameter. The spec's `info.version` (`0.2.5-alpha`) is a documentation label, not a runtime version, and the server URL carries no `/v1`. The only existing statement is a terms-of-service line telling integrators to keep their software compatible with "the latest version" — a single-track policy with no technical scheme.

Only the **Receipt of Waste** endpoints are live; the rest of the waste-movement journey is still to be built. This scheme applies to those **new** endpoints — the already-live endpoints keep their current unversioned paths.

The [GOV.UK API technical and data standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) recommend URI-path versioning _if_ you version, and advise against header and media-type versioning (proxies and firewalls can block them); their overriding principle is not to break existing consumers.

## Problem

As the remaining endpoints are built we will discover the right shape by iterating, which means frequent breaking changes before the contract stabilises. We need a way to ship those iterations without conflict — and, once stable, a public contract that never breaks its integrators. A single fixed policy serves one phase well and the other badly: always-version carries needless machinery and duplication once the shape is stable; never-version makes rapid, breaking iteration painful while we are still designing.

## Solution

**Version while in alpha, then drop the version at GA.** Use versioning as a development-phase tool to iterate on the API shape; once the shape is settled, publish a single stable **unversioned** API and evolve it additively from then on. This applies the ["just say no to versioning"](https://www.hmeid.com/blog/just-say-no-to-versioning) discipline exactly where it matters — the stable public contract — while keeping versioning where it earns its keep — rapid, breaking iteration during alpha.

- **During alpha — versioned in the URI path.** While we are still discovering the shape, breaks are frequent, so we version each milestone in the path (`/v1-alpha-0`, `/v1-alpha-1`, …) and can run milestones **in parallel**, letting the small, controlled set of early integrators migrate at their own pace. Path is the simplest addressable form and alpha is non-public, so it is acceptable here; a request header would keep URLs cleaner (nodding to review feedback that milestone labels shouldn't sit in public paths), but that only matters once public — which, by design, this never is.
- **At GA — drop the version; unversioned and additive-only thereafter.** Once the shape is settled we publish one **unversioned** API and commit to never breaking it: additive changes only (new optional fields/endpoints/enum values, shipped in place), clients tolerate unknown fields, complexity absorbed server-side. A genuinely unavoidable breaking change is treated as a **new resource/API**, not a `/v2`. This honours the GOV.UK standard's overriding principle — don't break existing consumers.
- **The alpha→GA cutover.** Dropping the version at GA is itself a one-time breaking change for alpha integrators — but that is expected (an alpha contract is unstable by definition) and it is a single, announced event. Smooth it with the deprecation mechanism below: run the final alpha version **alongside** the unversioned GA API for a migration window, mark the alpha paths deprecated, then retire them.
- **New endpoints only; existing stay put.** All of this applies to the new waste-movement endpoints; the already-live endpoints keep their current unversioned paths — we don't move them.
- **Orchestrated in the service — working assumption, to confirm.** Running alpha milestones in parallel is assumed to live in the **same service** (branching/duplicated handlers per milestone). We do **not** yet know what CDP offers — there may be a platform- or gateway-level way to route/version services we should use instead. Confirm CDP's capability before relying on in-service duplication. (Post-GA there is a single unversioned API, so this cost disappears.)
- **Usage-driven deprecation, signalled by `Deprecation: true`.** To retire an alpha version, monitor calls **per software provider** (via the JWT `client_id` that identifies the calling software), nudge remaining providers to migrate, and once use is negligible, withdraw it. While deprecated, every response from that version carries a single `Deprecation: true` header — an in-band signal a monitoring client can detect immediately, not only via out-of-band comms.

## Rabbit holes

- **Platform-level versioning.** We assume version orchestration lives in the service (parallel code paths per milestone). Before hard-coding that, confirm whether CDP or the API gateway already offers versioning/routing we should use instead — it may move where the duplication lives, or remove it.

## References

- [GOV.UK — API technical and data standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) — recommends URI-path versioning; overriding principle is not to break existing consumers.
- ["Just say no to versioning" — hmeid.com](https://www.hmeid.com/blog/just-say-no-to-versioning) — the argument for evolving additively instead of versioning; the basis for the unversioned, additive-only GA approach.
