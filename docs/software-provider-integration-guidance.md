# Digital Waste Tracking: API integration guidance

**Status:** draft outline, v0.1

**Owner:** Dave Oliver

This is a working skeleton for a guidance document to help software providers integrate their systems with the Defra API for recording waste movements. Development and implementation will take place in an agile environment and we welcome the input of software providers to help us develop and refine the integration of the service. 

Section headings and structure are stable; most section bodies are placeholders to be filled in as the API design firms up. [Appendix C](#appendix-c-open-questions-log) includes a list of gaps so far.

## Contents

- [1. Introduction](#1-introduction)
- [2. Service overview](#2-service-overview)
  - [2.1 Actors](#21-actors)
  - [2.2 Core entities](#22-core-entities)
  - [2.3 Lifecycle stages](#23-lifecycle-stages)
  - [2.4 Recording modes](#24-recording-modes)
- [3. API reference](#3-api-reference)
  - [3.1 Create movement](#31-create-movement)
  - [3.2 Record collection](#32-record-collection)
  - [3.3 Record drop-off](#33-record-drop-off)
  - [3.4 Record receipt](#34-record-receipt)
  - [3.5 General conventions](#35-general-conventions)
- [4. Business rules and data reconciliation](#4-business-rules-and-data-reconciliation)
  - [4.1 Collection cardinality](#41-collection-cardinality)
  - [4.2 Movement-to-transfer cardinality](#42-movement-to-transfer-cardinality)
  - [4.3 Timing rules](#43-timing-rules)
- [5. Testing and conformance](#5-testing-and-conformance)
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

![DWT events](./images/dwt-movement-transfer-events.drawio)



### 2.1 Actors
- **Producer** – the organisation whose waste is being moved
- **Broker** – arranges the movement on behalf of a producer or receiver
- **Carrier** – the organisation licensed to transport the waste; may operate through a **Driver** as the field-level user recording events in real time
- **Receiver** – the site accepting the waste for treatment, disposal or recovery

### 2.2 Core entities
- **Waste Movement** – the primary record of an intended waste movement, identified by a **Waste Movement ID**, created before the waste moves
- **Waste Transfer** – the record created at drop-off, identified by a **Waste Transfer ID**; a single Transfer can bundle one or more Movement IDs together

### 2.3 Lifecycle stages
The API is organised around five stages, matching the Mural board:

| Stage | What happens |
|---|---|
| Creation | Movement is created; estimated details are declared |
| Collection | Carrier/driver records each collection against a Movement ID |
| Drop-off | Driver records drop-off (generates a Transfer ID); receiver inspects and records receipt |
| Receipt | Any deferred or retrospective records are completed; producer can check the fate of their waste |

### 2.4 Recording modes
Collection and receipt can each be recorded in real time or deferred/retrospectively. Software providers need to support both, including handling offline capture in field/driver apps.

## 3. API reference

Structured by lifecycle stage rather than by resource, so it reads in the same order a movement actually happens.

**[API specs](https://github.com/DEFRA/digital-waste-tracking-api-docs/blob/main/docs/api/openapi.yaml)**

### 3.1 Create movement

| | |
|---|---|
| **Endpoints** | `POST /movements/create`, `PUT /movements/{id}/create`, `DELETE /movements/create` |
| **Input** | Waste classification, hazardous details, POPs details, producer details, estimated collection details, estimated receiver details, estimated carrier details, broker details |
| **Output** | Validation result, Waste Movement ID |

### 3.2 Record collection

| | |
|---|---|
| **Endpoints** | `POST/PUT/GET /movements/static-collection`, `POST/PUT/GET /movements/transit-collection` (treated as equivalent for integration purposes) |
| **Input** | Waste Movement ID, collection dateTime, carrier details |
| **Output** | Validation result |

Each physical collection is recorded as a separate entry – there's no requirement to model consolidation where multiple loads are later combined.

### 3.3 Record drop-off

| | |
|---|---|
| **Endpoints** | `POST /movements/drop-off`, `POST /movements/{id}/drop-off` |
| **Input** | Drop-off dateTime, drop-off address, one or more Movement IDs, carrier details |
| **Output** | Validation result, Waste Transfer ID |

A drop-off can link multiple Movement IDs to a single Transfer ID.

### 3.4 Record receipt

| | |
|---|---|
| **Endpoints** | `POST /movements/receive`, `PUT /movements/{id}/receive` |
| **Input** | Waste Transfer ID, waste classification, hazardous details, POPs details, receiver details, carrier details, broker details |
| **Output** | Validation result |

See [section 7.1](#71-estimated-vs-actual-declarations) for how this reconciles against the estimated details captured at creation.

### 3.5 General conventions

- Environments and base URLs (sandbox/production) – *TBC*
- API versioning and deprecation policy – *TBC*
- Standard error response shape and status codes – *TBC*
- Idempotency behaviour on retries – *TBC*
- Rate limits and pagination – *TBC*

## 4. Business rules and data reconciliation

### 4.1 Collection cardinality
One collection entry per physical collection event, even where loads are later combined at drop-off.

### 4.2 Movement-to-transfer cardinality
Many Movement IDs can be linked to a single Transfer ID at drop-off; a Transfer ID always originates from exactly one drop-off event.

### 4.3 Timing rules
- Time limits, if any, for deferred/retrospective collection and receipt recording – *TBC*
- Whether a Movement can be deleted/cancelled after collection has started – *TBC*

## 5. Testing and conformance

- Sandbox scenarios covering each of the four endpoint groups in section 6
- Reference test data, including chained Movement ID → Transfer ID scenarios and hazardous/POPs edge cases
- Conformance or certification process ahead of production access – *TBC*

## Appendix A: glossary

| Term | Meaning |
|---|---|
| DWT | Digital Waste Tracking – the digital service this API supports |
| EWC | European Waste Catalogue – the code list used to classify waste type |
| HWCN | Hazardous Waste Consignment Note – the paper record DWT replaces for hazardous waste |
| POPs | Persistent organic pollutants – chemicals subject to additional handling and reporting rules |
| Waste Movement ID | Identifier issued when a movement is created, before waste moves |
| Waste Transfer ID | Identifier issued at drop-off; can link multiple Movement IDs together |
| WTN | Waste Transfer Note – the paper record DWT replaces for non-hazardous waste |


## Appendix B: endpoint quick reference

| Method | Path |
|---|---|
| POST | `/movements/create` |
| PUT | `/movements/{id}/create` |
| DELETE | `/movements/create` |
| POST/PUT/GET | `/movements/static-collection` |
| POST/PUT/GET | `/movements/transit-collection` |
| POST | `/movements/drop-off` |
| POST | `/movements/{id}/drop-off` |
| POST | `/movements/receive` |
| PUT | `/movements/{id}/receive` |


## Appendix C: open questions log

| # | Question | Raised |
|---|---|---|
| 1 | How is the accept/reject/partial-accept decision at receipt represented in the `receive` request or response? Only a generic validation result is currently defined as output | 2026-08-13 |
| 2 | Are there time limits on deferred/retrospective collection or receipt recording? | 2026-08-13 |
| 3 | Can a Movement be deleted or cancelled once collection has started? | 2026-08-13 |
| 4 | What authentication mechanism does the API use (OAuth2/OIDC, API key, or other)? | 2026-08-13 |
| 5 | Is there a conformance or certification process for software providers before production access is granted? | 2026-08-13 |
| 6 | Can we add step-by-step guidance for a sample API integration? | 2026-08-18 |
| 7 | What's the process for onboarding of software providers and how will they gain test credentials? | 2026-08-18 |
| 8 | Do we require more detailed business rules? | 2026-08-18 |
