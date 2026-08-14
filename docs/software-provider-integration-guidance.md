# Digital Waste Tracking: software provider integration guidance

**Status:** draft outline, v0.1

**Owner:** Dave Oliver

This is a working skeleton for a guidance document to help software providers integrate their systems with the Defra API for recording waste movements. Section headings and structure are stable; most section bodies are placeholders to be filled in as the API design firms up. [Appendix C](#appendix-c-open-questions-log) includes a list of gaps so far.

## Contents

- [1. Introduction](#1-introduction)
- [2. Service overview](#2-service-overview)
  - [2.1 Actors](#21-actors)
  - [2.2 Core entities](#22-core-entities)
  - [2.3 Lifecycle stages](#23-lifecycle-stages)
  - [2.4 Recording modes](#24-recording-modes)
- [3. Integration personas](#3-integration-personas)
- [4. Becoming an integrated software provider](#4-becoming-an-integrated-software-provider)
- [5. Authentication and security](#5-authentication-and-security)
- [6. API reference](#6-api-reference)
  - [6.1 Create movement (BWM)](#61-create-movement-bwm)
  - [6.2 Record collection (WWC)](#62-record-collection-wwc)
  - [6.3 Record drop-off (WWR)](#63-record-drop-off-wwr)
  - [6.4 Record receipt (WWR / AWR)](#64-record-receipt-wwr--awr)
  - [6.5 General conventions](#65-general-conventions)
- [7. Business rules and data reconciliation](#7-business-rules-and-data-reconciliation)
  - [7.1 Estimated vs actual declarations](#71-estimated-vs-actual-declarations)
  - [7.2 Collection cardinality](#72-collection-cardinality)
  - [7.3 Movement-to-transfer cardinality](#73-movement-to-transfer-cardinality)
  - [7.4 Timing rules](#74-timing-rules)
- [8. Testing and conformance](#8-testing-and-conformance)
- [9. Go-live and operations](#9-go-live-and-operations)
- [10. Compliance and legal considerations](#10-compliance-and-legal-considerations)
- [Appendix A: glossary](#appendix-a-glossary)
- [Appendix B: endpoint quick reference](#appendix-b-endpoint-quick-reference)
- [Appendix C: open questions log](#appendix-c-open-questions-log)

---

## 1. Introduction

- Purpose of this document and who it's for: software vendors building producer, broker, carrier/driver or receiver-facing systems that need to record waste movements
- Policy context: Digital Waste Tracking (DWT) replaces the paper Waste Transfer Note (WTN) and Hazardous Waste Consignment Note (HWCN) with a digital waste movement record
- Scope of this document: the integration API only – not the DWT frontend service, which is out of scope here
- How to give feedback on this guidance while it's in draft

## 2. Service overview

### 2.1 Actors
- **Producer** – the organisation whose waste is being moved
- **Broker** – arranges the movement on behalf of a producer or receiver
- **Carrier** – the organisation licensed to transport the waste; may operate through a **Driver** as the field-level user recording events in real time
- **Receiver** – the site accepting the waste for treatment, disposal or recovery

### 2.2 Core entities
- **Waste Movement** – the primary record of an intended waste movement, identified by a **Waste Movement ID**, created before the waste moves
- **Waste Transfer** – the record created at drop-off, identified by a **Waste Transfer ID**; a single Transfer can bundle one or more Movement IDs together

### 2.3 Lifecycle stages
The API is organised around four stages:

| Stage | Code | What happens |
|---|---|---|
| Before the waste moves | BWM | Movement is created; estimated details are declared |
| When the waste is collected | WWC | Carrier/driver records each collection against a Movement ID |
| When the waste is being dropped off / received | WWR | Driver records drop-off (generates a Transfer ID); receiver inspects and records receipt |
| After the waste has been received | AWR | Any deferred or retrospective records are completed; producer can check the fate of their waste |

### 2.4 Recording modes
Collection and receipt can each be recorded in real time or deferred/retrospectively. Software providers need to support both, including handling offline capture in field/driver apps.

## 3. Integration personas

Most software providers will fall into one or more of these personas, which map onto the endpoint groups in [section 6](#6-api-reference):

| Persona | Typical software | Endpoints used |
|---|---|---|
| Producer/broker system | Waste management, ERP | Create movement |
| Carrier/driver system | Field/mobile logistics app | Record collection, record drop-off |
| Receiver system | Site/gate management system | Record receipt |

A single product may cover more than one persona e.g. a waste management company that both carries and receives.

## 4. Becoming an integrated software provider

- Registration/onboarding process – *TBC*
- Any conformance or listing requirements, comparable to HMRC's Making Tax Digital recognised-software model – *TBC*
- Sandbox access and setting up a test organisation – *TBC*
- Support contacts during onboarding – *TBC*

## 5. Authentication and security

- Identity model: organisation-level authentication with user/role delegation – *TBC exact mechanism*
- Credential type: likely OAuth2/OIDC or API key-based, consistent with other Defra digital services? – *TBC*
- Required scopes per persona – *TBC*
- Transport security (TLS) and data protection requirements

## 6. API reference

Structured by lifecycle stage rather than by resource, so it reads in the same order a movement actually happens?

### 6.1 Create movement (BWM)

| | |
|---|---|
| **Endpoints** | `POST /movements/create`, `PUT /movements/{id}/create`, `DELETE /movements/create` |
| **Input** | Waste classification, hazardous details, POPs details, producer details, estimated collection details, estimated receiver details, estimated carrier details, broker details |
| **Output** | Validation result, Waste Movement ID |

### 6.2 Record collection (WWC)

| | |
|---|---|
| **Endpoints** | `POST/PUT/GET /movements/static-collection`, `POST/PUT/GET /movements/transit-collection` (treated as equivalent for integration purposes) |
| **Input** | Waste Movement ID, collection dateTime, carrier details |
| **Output** | Validation result |

Each physical collection is recorded as a separate entry – there's no requirement to model consolidation where multiple loads are later combined.

### 6.3 Record drop-off (WWR)

| | |
|---|---|
| **Endpoints** | `POST /movements/drop-off`, `POST /movements/{id}/drop-off` |
| **Input** | Drop-off dateTime, drop-off address, one or more Movement IDs, carrier details |
| **Output** | Validation result, Waste Transfer ID |

A drop-off can link multiple Movement IDs to a single Transfer ID.

### 6.4 Record receipt (WWR / AWR)

| | |
|---|---|
| **Endpoints** | `POST /movements/receive`, `PUT /movements/{id}/receive` |
| **Input** | Waste Transfer ID, waste classification, hazardous details, POPs details, receiver details, carrier details, broker details |
| **Output** | Validation result |

See [section 7.1](#71-estimated-vs-actual-declarations) for how this reconciles against the estimated details captured at creation.

### 6.5 General conventions

- Environments and base URLs (sandbox/production) – *TBC*
- API versioning and deprecation policy – *TBC*
- Standard error response shape and status codes – *TBC*
- Idempotency behaviour on retries – *TBC*
- Rate limits and pagination – *TBC*

## 7. Business rules and data reconciliation

### 7.1 Estimated vs actual declarations
Waste classification, hazardous details, POPs details and carrier details are declared twice: as estimates at movement creation, and as actuals at receipt. This is a declare-then-reconcile pattern rather than a strict match requirement – the receiver may accept a load as compliant even where the actual details diverge from the estimate, at their discretion.

Software providers building receiver-side systems should design their accept/reject/flag interaction around this discretionary tolerance rather than a hard validation failure. See the open question in [Appendix C](#appendix-c-open-questions-log) about how this decision is represented in the API contract.

### 7.2 Collection cardinality
One collection entry per physical collection event, even where loads are later combined at drop-off.

### 7.3 Movement-to-transfer cardinality
Many Movement IDs can be linked to a single Transfer ID at drop-off; a Transfer ID always originates from exactly one drop-off event.

### 7.4 Timing rules
- Time limits, if any, for deferred/retrospective collection and receipt recording – *TBC*
- Whether a Movement can be deleted/cancelled after collection has started – *TBC*

## 8. Testing and conformance

- Sandbox scenarios covering each of the four endpoint groups in section 6
- Reference test data, including chained Movement ID → Transfer ID scenarios and hazardous/POPs edge cases
- Conformance or certification process ahead of production access – *TBC*

## 9. Go-live and operations

- Go-live checklist – *TBC*
- Support channels and escalation paths – *TBC*
- Service status page and incident communication – *TBC*
- How API changes and deprecations are communicated – *TBC*

## 10. Compliance and legal considerations

- Data retention and audit trail obligations
- Regulatory reporting responsibilities, and how liability splits between the software provider and the end-user organisation
- GDPR and data protection requirements for personal data captured in producer/carrier/receiver details

## Appendix A: glossary

| Term | Meaning |
|---|---|
| AWR | After the waste has been received – lifecycle stage |
| BWM | Before the waste moves – lifecycle stage |
| DWT | Digital Waste Tracking – the digital service this API supports |
| EWC | European Waste Catalogue – the code list used to classify waste type |
| HWCN | Hazardous Waste Consignment Note – the paper record DWT replaces for hazardous waste |
| POPs | Persistent organic pollutants – chemicals subject to additional handling and reporting rules e.g. old sofas with chemical flame retardants, legacy electrical equipment, historical pesticide products |
| Waste Movement ID | Identifier issued when a movement is created, before waste moves |
| Waste Transfer ID | Identifier issued at drop-off; can link multiple Movement IDs together |
| WTN | Waste Transfer Note – the paper record DWT replaces for non-hazardous waste |
| WWC | When the waste is collected – lifecycle stage |
| WWR | When the waste is being dropped off / received – lifecycle stage |


## Appendix B: endpoint quick reference

| Stage | Method | Path |
|---|---|---|
| BWM | POST | `/movements/create` |
| BWM | PUT | `/movements/{id}/create` |
| BWM | DELETE | `/movements/create` |
| WWC | POST/PUT/GET | `/movements/static-collection` |
| WWC | POST/PUT/GET | `/movements/transit-collection` |
| WWR | POST | `/movements/drop-off` |
| WWR | POST | `/movements/{id}/drop-off` |
| WWR/AWR | POST | `/movements/receive` |
| WWR/AWR | PUT | `/movements/{id}/receive` |

## Appendix C: open questions log

| # | Question | Raised |
|---|---|---|
| 1 | How is the accept/reject/partial-accept decision at receipt represented in the `receive` request or response? Only a generic validation result is currently defined as output | 2026-08-13 |
| 2 | Are there time limits on deferred/retrospective collection or receipt recording? | 2026-08-13 |
| 3 | Can a Movement be deleted or cancelled once collection has started? | 2026-08-13 |
| 4 | What authentication mechanism does the API use (OAuth2/OIDC, API key, or other)? | 2026-08-13 |
| 5 | Is there a conformance or certification process for software providers before production access is granted? | 2026-08-13 |
