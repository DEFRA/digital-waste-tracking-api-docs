# Digital Waste Tracking: API integration guidance

**Status:** draft outline, v0.1

**Owner:** Dave Oliver

 
## Contents

- [1. Introduction](#1-introduction)
- [2. Service overview](#2-service-overview)
  - [2.1 Lifecycle stages](#21-lifecycle-stages)
  - [2.2 Actors](#22-actors)
  - [2.3 Core identifiers](#23-core-identifiers)
- [3. API reference](#3-api-reference)
  - [3.1 Create movement](#31-create-movement)
  - [3.2 Record collection](#32-record-collection)
  - [3.3 Record delivery](#33-record-delivery)
  - [3.4 Record receipt](#34-record-receipt)
- [4. Business rules and data reconciliation](#4-business-rules-and-data-reconciliation)
  - [4.1 Collection cardinality](#41-collection-cardinality)
  - [4.2 Movement-to-delivery cardinality](#42-movement-to-delivery-cardinality)
- [5. Testing and conformance](#5-testing-and-conformance)
- [Appendix A: glossary](#appendix-a-glossary)
- [Appendix B: endpoint quick reference](#appendix-b-endpoint-quick-reference)


---

## 1. Introduction

**Purpose of document:** This document provides guidance for software providers building producer, broker, carrier/driver or receiver-facing systems that will interact with Defra's dedicated API to record waste movements. 

**Service background:** Digital Waste Tracking (DWT) is a UK cross-government programme to build a single digital service for tracking waste movements, ultimately replacing paper-based waste transfer notes (WTNs). Its main aims are to reduce waste crime and misclassification, improve data on how waste moves domestically to support the transition to a circular economy, and cut the administrative burden of the current fragmented, paper-based system.

**Current status:** The current focus of the DWT development team is to reach the first 'development milestone' of the service (Aug/Sep 2026) - to test API interactions in a sandbox environment and use the findings to better refine the service for rollout. The scope of this document is therefore focused on the integration API only, rather than the overall DWT service, which will follow. While the overall concept and rollout timetable are approved, some coding and naming elements may evolve as the development progresses.

![DWT events](./images/dwt-api-delivery-roadmap-milestone-1.png)

**[API roadmap – full view](./images/dwt-api-delivery-roadmap.png)**

<br>

## 2. Service overview

![DWT events](./images/dwt-movement-delivery-events.png)

### 2.1 Lifecycle stages
The API is organised around four stages:

| Stage | What happens |
|---|---|
| Creation | Movement created; estimated details declared; Movement ID generated |
| Collection | Carrier/driver records the collection against a Movement ID |
| Delivery | Driver records delivery and declares the Movement ID in scope; Delivery ID generated |
| Receipt | Receiving site records acceptance of the waste against the Delivery ID |

### 2.2 Actors
- **Producer / Controller (EA term)** – the organisation whose waste is being moved
- **Broker / Controller (EA term)** – arranges the movement on behalf of a producer or receiver
- **Carrier / Transporter (EA term)** – the organisation licensed to transport the waste; may operate through a **Driver** as the field-level user recording events in real time
- **Receiver** – the site accepting the waste for treatment, disposal or recovery

### 2.3 Core identifiers
- **Waste Movement ID** – `movementId` is the primary record of an intended waste movement, created before the waste moves
- **Waste Delivery ID** – `deliveryId` is the record created at delivery; a single Delivery ID can bundle one or more Movement IDs together

<br>

## 3. API reference

You can see the current API spec at: [Digital Waste Tracking OpenAPI specification](https://github.com/DEFRA/digital-waste-tracking-api-docs/blob/main/docs/api/openapi-beta-1.md).

The spec will update with each milestone in the development process – expect some shapes to shift before go-live. 

### 3.1 Create movement

| | |
|---|---|
| **Endpoints** | `POST /movements/create` |
| **Input** | Waste classification, producer details, estimated collection details, estimated receiver details, estimated carrier details, broker details |
| **Output** | Validation result, Waste Movement ID |



### 3.2 Record collection

| | |
|---|---|
| **Endpoints** | `POST /movements/{id}/collection` |
| **Input** | Waste Movement ID, collection dateTime, carrier details, collection address |
| **Output** | Validation result |


### 3.3 Record delivery

| | |
|---|---|
| **Endpoints** | `POST /movements/delivery` |
| **Input** | Delivery dateTime, delivery address, one or more Movement IDs, carrier details |
| **Output** | Validation result, Waste Delivery ID |

### 3.4 Record receipt

| | |
|---|---|
| **Endpoints** | `POST /movements/{id}/receive` |
| **Input** | Waste Transfer ID, waste item details, receiver details, carrier details, broker details |
| **Output** | Validation result |


<br>

## 4. Business rules and data reconciliation

### 4.1 Collection cardinality
One collection entry per physical collection event, even where loads are later combined at delivery.

### 4.2 Movement-to-delivery cardinality
Many Movement IDs can be linked to a single Transfer ID at delivery; a Transfer ID always originates from exactly one delivery event.

<br>

## 5. Testing and conformance

Sandbox scenarios covering each of the four endpoint groups in [section 3](#3-api-reference) will be updated in our [Scenarios repo](./collections).

<br>

## Appendix A: glossary

| Term | Meaning |
|---|---|
| DWT | Digital Waste Tracking – the digital service this API supports |
| EA | Environment Agency|
| EWC | European Waste Catalogue – the code list used to classify waste type |
| HWCN | Hazardous Waste Consignment Note – the paper record DWT replaces for hazardous waste |
| POPs | Persistent organic pollutants – chemicals subject to additional handling and reporting rules |
| Waste Movement ID | Identifier issued when a movement is created, before waste moves |
| Waste Delivery ID | Identifier issued at delivery; can link multiple Movement IDs together |
| WTN | Waste Transfer Note – the paper record DWT replaces for non-hazardous waste |


## Appendix B: endpoint quick reference

| Method | Path |
|---|---|
| POST | `/movements/create` |
| POST | `/movements/{id}/collection` |
| POST | `/movements/delivery` |
| POST | `/movements/{id}/receive` |

