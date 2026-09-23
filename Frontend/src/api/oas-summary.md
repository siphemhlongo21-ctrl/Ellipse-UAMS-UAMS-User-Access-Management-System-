# Ellipse API v1 - OpenAPI Summary

Generated from OpenAPI 3.0.4.

## Info

- **Title:** Ellipse API
- **Version:** v1
- **Description:** Ellipse User Access Management API. In Development, identity defaults to Security:DevAdUsername (DEV\ellipse.dev) with bootstrap admin roles. Use Authorize → AdUsername to override with header X-AD-Username.

## Global Security

```json
[{"AdUsername":[]}]
```

## Security Schemes

### AdUsername
- type: apiKey
- in: header
- name: X-AD-Username
- description: Active Directory username for testing, e.g. DEV\ellipse.dev. Leave empty to use the Development fallback identity.

## Feature keyword mentions (OAS text)

- **DeputyHead:** yes
- **Reports:** no
- **Notification:** no
- **Delegation:** no

## Paths

### POST `/api/Contractor`

- **tags:** Contractor

#### Parameters

_None_

#### Request Body Schema

- **Content-Type:** `application/json`
```
$ref: ContractorDetails

Expanded properties:
  - branch: string
  - businessJustification: string
  - companyName: string
  - department: string
  - emailAddress: string
  - endDate: string (date-time)
  - firstName: string
  - id: integer (int32)
  - identificationNumber: string
  - responsibleManager: string
  - startDate: string (date-time)
  - surname: string
```
- **Content-Type:** `text/json`
```
$ref: ContractorDetails

Expanded properties:
  - branch: string
  - businessJustification: string
  - companyName: string
  - department: string
  - emailAddress: string
  - endDate: string (date-time)
  - firstName: string
  - id: integer (int32)
  - identificationNumber: string
  - responsibleManager: string
  - startDate: string (date-time)
  - surname: string
```
- **Content-Type:** `application/*+json`
```
$ref: ContractorDetails

Expanded properties:
  - branch: string
  - businessJustification: string
  - companyName: string
  - department: string
  - emailAddress: string
  - endDate: string (date-time)
  - firstName: string
  - id: integer (int32)
  - identificationNumber: string
  - responsibleManager: string
  - startDate: string (date-time)
  - surname: string
```

#### Response 200 Schema

- description: OK
_No content body_

---

### PUT `/api/Contractor`

- **tags:** Contractor

#### Parameters

_None_

#### Request Body Schema

- **Content-Type:** `application/json`
```
$ref: ContractorDetails

Expanded properties:
  - branch: string
  - businessJustification: string
  - companyName: string
  - department: string
  - emailAddress: string
  - endDate: string (date-time)
  - firstName: string
  - id: integer (int32)
  - identificationNumber: string
  - responsibleManager: string
  - startDate: string (date-time)
  - surname: string
```
- **Content-Type:** `text/json`
```
$ref: ContractorDetails

Expanded properties:
  - branch: string
  - businessJustification: string
  - companyName: string
  - department: string
  - emailAddress: string
  - endDate: string (date-time)
  - firstName: string
  - id: integer (int32)
  - identificationNumber: string
  - responsibleManager: string
  - startDate: string (date-time)
  - surname: string
```
- **Content-Type:** `application/*+json`
```
$ref: ContractorDetails

Expanded properties:
  - branch: string
  - businessJustification: string
  - companyName: string
  - department: string
  - emailAddress: string
  - endDate: string (date-time)
  - firstName: string
  - id: integer (int32)
  - identificationNumber: string
  - responsibleManager: string
  - startDate: string (date-time)
  - surname: string
```

#### Response 200 Schema

- description: OK
_No content body_

---

### GET `/api/Contractor/{id}`

- **tags:** Contractor

#### Parameters

| name | in | required |
| --- | --- | --- |
| id | path | True |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
$ref: ContractorDetails

Expanded properties:
  - branch: string
  - businessJustification: string
  - companyName: string
  - department: string
  - emailAddress: string
  - endDate: string (date-time)
  - firstName: string
  - id: integer (int32)
  - identificationNumber: string
  - responsibleManager: string
  - startDate: string (date-time)
  - surname: string
```
- **Content-Type:** `application/json`
```
$ref: ContractorDetails

Expanded properties:
  - branch: string
  - businessJustification: string
  - companyName: string
  - department: string
  - emailAddress: string
  - endDate: string (date-time)
  - firstName: string
  - id: integer (int32)
  - identificationNumber: string
  - responsibleManager: string
  - startDate: string (date-time)
  - surname: string
```
- **Content-Type:** `text/json`
```
$ref: ContractorDetails

Expanded properties:
  - branch: string
  - businessJustification: string
  - companyName: string
  - department: string
  - emailAddress: string
  - endDate: string (date-time)
  - firstName: string
  - id: integer (int32)
  - identificationNumber: string
  - responsibleManager: string
  - startDate: string (date-time)
  - surname: string
```

---

### DELETE `/api/Contractor/{id}`

- **tags:** Contractor

#### Parameters

| name | in | required |
| --- | --- | --- |
| id | path | True |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
_No content body_

---

### POST `/api/DocumentAudit/CreateDocumentAudit`

- **tags:** DocumentAudit

#### Parameters

_None_

#### Request Body Schema

- **Content-Type:** `application/json`
```
$ref: DocumentAuditDetails

Expanded properties:
  - auditType: string
  - dateCreated: string (date-time)
  - documentData: string (byte)
  - documentId: integer (int32)
  - id: integer (int32)
  - oldDocumentData: string (byte)
```
- **Content-Type:** `text/json`
```
$ref: DocumentAuditDetails

Expanded properties:
  - auditType: string
  - dateCreated: string (date-time)
  - documentData: string (byte)
  - documentId: integer (int32)
  - id: integer (int32)
  - oldDocumentData: string (byte)
```
- **Content-Type:** `application/*+json`
```
$ref: DocumentAuditDetails

Expanded properties:
  - auditType: string
  - dateCreated: string (date-time)
  - documentData: string (byte)
  - documentId: integer (int32)
  - id: integer (int32)
  - oldDocumentData: string (byte)
```

#### Response 200 Schema

- description: OK
_No content body_

---

### GET `/api/DocumentAudit/GetAllDocumentAudits`

- **tags:** DocumentAudit

#### Parameters

_None_

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
array[$ref: DocumentAuditDetails]
```
- **Content-Type:** `application/json`
```
array[$ref: DocumentAuditDetails]
```
- **Content-Type:** `text/json`
```
array[$ref: DocumentAuditDetails]
```

---

### GET `/api/DocumentAudit/GetDocumentAuditById`

- **tags:** DocumentAudit

#### Parameters

| name | in | required |
| --- | --- | --- |
| id | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
$ref: DocumentAuditDetails

Expanded properties:
  - auditType: string
  - dateCreated: string (date-time)
  - documentData: string (byte)
  - documentId: integer (int32)
  - id: integer (int32)
  - oldDocumentData: string (byte)
```
- **Content-Type:** `application/json`
```
$ref: DocumentAuditDetails

Expanded properties:
  - auditType: string
  - dateCreated: string (date-time)
  - documentData: string (byte)
  - documentId: integer (int32)
  - id: integer (int32)
  - oldDocumentData: string (byte)
```
- **Content-Type:** `text/json`
```
$ref: DocumentAuditDetails

Expanded properties:
  - auditType: string
  - dateCreated: string (date-time)
  - documentData: string (byte)
  - documentId: integer (int32)
  - id: integer (int32)
  - oldDocumentData: string (byte)
```

---

### GET `/api/DocumentAudit/GetDocumentAuditsByDocument`

- **tags:** DocumentAudit

#### Parameters

| name | in | required |
| --- | --- | --- |
| documentId | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
array[$ref: DocumentAuditDetails]
```
- **Content-Type:** `application/json`
```
array[$ref: DocumentAuditDetails]
```
- **Content-Type:** `text/json`
```
array[$ref: DocumentAuditDetails]
```

---

### PUT `/api/Documents/ArchiveDocument`

- **tags:** Documents

#### Parameters

| name | in | required |
| --- | --- | --- |
| id | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### POST `/api/Documents/CreateDocument`

- **tags:** Documents

#### Parameters

_None_

#### Request Body Schema

- **Content-Type:** `application/json`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```
- **Content-Type:** `text/json`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```
- **Content-Type:** `application/*+json`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```
- **Content-Type:** `application/json`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```
- **Content-Type:** `text/json`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```

---

### DELETE `/api/Documents/DeleteDocument`

- **tags:** Documents

#### Parameters

| name | in | required |
| --- | --- | --- |
| id | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### GET `/api/Documents/DownloadDocument`

- **tags:** Documents

#### Parameters

| name | in | required |
| --- | --- | --- |
| id | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
_No content body_

---

### GET `/api/Documents/GetDocumentById`

- **tags:** Documents

#### Parameters

| name | in | required |
| --- | --- | --- |
| id | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```
- **Content-Type:** `application/json`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```
- **Content-Type:** `text/json`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```

---

### GET `/api/Documents/GetRequestDocument`

- **tags:** Documents

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
array[$ref: DocumentDetails]
```
- **Content-Type:** `application/json`
```
array[$ref: DocumentDetails]
```
- **Content-Type:** `text/json`
```
array[$ref: DocumentDetails]
```

---

### PUT `/api/Documents/UpdateDocument`

- **tags:** Documents

#### Parameters

_None_

#### Request Body Schema

- **Content-Type:** `application/json`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```
- **Content-Type:** `text/json`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```
- **Content-Type:** `application/*+json`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```
- **Content-Type:** `application/json`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```
- **Content-Type:** `text/json`
```
$ref: DocumentDetails

Expanded properties:
  - active: boolean
  - archived: boolean
  - archivedDate: string (date-time)
  - data: string (byte)
  - dateModified: string (date-time)
  - dateUploaded: string (date-time)
  - documentType: string
  - id: integer (int32)
  - requestId: integer (int32)
```

---

### GET `/api/Employee`

- **tags:** Employee

#### Parameters

| name | in | required |
| --- | --- | --- |
| email | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
_No content body_

---

### POST `/api/Employee`

- **tags:** Employee

#### Parameters

_None_

#### Request Body Schema

- **Content-Type:** `application/json`
```
$ref: EmployeeDetails

Expanded properties:
  - activeDirectoryUsername: string
  - branch: string
  - contactNumber: string
  - department: string
  - designation: string
  - emailAddress: string
  - firstName: string
  - postId: integer (int32)
  - serviceNumber: string
  - surname: string
```
- **Content-Type:** `text/json`
```
$ref: EmployeeDetails

Expanded properties:
  - activeDirectoryUsername: string
  - branch: string
  - contactNumber: string
  - department: string
  - designation: string
  - emailAddress: string
  - firstName: string
  - postId: integer (int32)
  - serviceNumber: string
  - surname: string
```
- **Content-Type:** `application/*+json`
```
$ref: EmployeeDetails

Expanded properties:
  - activeDirectoryUsername: string
  - branch: string
  - contactNumber: string
  - department: string
  - designation: string
  - emailAddress: string
  - firstName: string
  - postId: integer (int32)
  - serviceNumber: string
  - surname: string
```

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
$ref: EmployeeDetails

Expanded properties:
  - activeDirectoryUsername: string
  - branch: string
  - contactNumber: string
  - department: string
  - designation: string
  - emailAddress: string
  - firstName: string
  - postId: integer (int32)
  - serviceNumber: string
  - surname: string
```
- **Content-Type:** `application/json`
```
$ref: EmployeeDetails

Expanded properties:
  - activeDirectoryUsername: string
  - branch: string
  - contactNumber: string
  - department: string
  - designation: string
  - emailAddress: string
  - firstName: string
  - postId: integer (int32)
  - serviceNumber: string
  - surname: string
```
- **Content-Type:** `text/json`
```
$ref: EmployeeDetails

Expanded properties:
  - activeDirectoryUsername: string
  - branch: string
  - contactNumber: string
  - department: string
  - designation: string
  - emailAddress: string
  - firstName: string
  - postId: integer (int32)
  - serviceNumber: string
  - surname: string
```

---

### PUT `/api/Employee`

- **tags:** Employee

#### Parameters

_None_

#### Request Body Schema

- **Content-Type:** `application/json`
```
$ref: EmployeeDetails

Expanded properties:
  - activeDirectoryUsername: string
  - branch: string
  - contactNumber: string
  - department: string
  - designation: string
  - emailAddress: string
  - firstName: string
  - postId: integer (int32)
  - serviceNumber: string
  - surname: string
```
- **Content-Type:** `text/json`
```
$ref: EmployeeDetails

Expanded properties:
  - activeDirectoryUsername: string
  - branch: string
  - contactNumber: string
  - department: string
  - designation: string
  - emailAddress: string
  - firstName: string
  - postId: integer (int32)
  - serviceNumber: string
  - surname: string
```
- **Content-Type:** `application/*+json`
```
$ref: EmployeeDetails

Expanded properties:
  - activeDirectoryUsername: string
  - branch: string
  - contactNumber: string
  - department: string
  - designation: string
  - emailAddress: string
  - firstName: string
  - postId: integer (int32)
  - serviceNumber: string
  - surname: string
```

#### Response 200 Schema

- description: OK
_No content body_

---

### DELETE `/api/Employee`

- **tags:** Employee

#### Parameters

| name | in | required |
| --- | --- | --- |
| email | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
_No content body_

---

### POST `/api/RequestApproval/CreateApprovals`

- **tags:** RequestApproval

#### Parameters

_None_

#### Request Body Schema

- **Content-Type:** `application/json`
```
$ref: RequestApproverActionDetails

Expanded properties:
  - actionType: string
  - approverDate: string (date-time)
  - approverType: string
  - id: integer (int32)
  - name: string
  - postId: integer (int64)
  - requestId: integer (int32)
  - serviceNumber: integer (int64)
  - surname: string
```
- **Content-Type:** `text/json`
```
$ref: RequestApproverActionDetails

Expanded properties:
  - actionType: string
  - approverDate: string (date-time)
  - approverType: string
  - id: integer (int32)
  - name: string
  - postId: integer (int64)
  - requestId: integer (int32)
  - serviceNumber: integer (int64)
  - surname: string
```
- **Content-Type:** `application/*+json`
```
$ref: RequestApproverActionDetails

Expanded properties:
  - actionType: string
  - approverDate: string (date-time)
  - approverType: string
  - id: integer (int32)
  - name: string
  - postId: integer (int64)
  - requestId: integer (int32)
  - serviceNumber: integer (int64)
  - surname: string
```

#### Response 200 Schema

- description: OK
_No content body_

---

### GET `/api/RequestApproval/GetApprovalsForRequest`

- **tags:** RequestApproval

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
array[$ref: RequestApproverActionDetails]
```
- **Content-Type:** `application/json`
```
array[$ref: RequestApproverActionDetails]
```
- **Content-Type:** `text/json`
```
array[$ref: RequestApproverActionDetails]
```

---

### POST `/api/Requests/Cancel`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### POST `/api/Requests/CreateRequest`

- **tags:** Requests

#### Parameters

_None_

#### Request Body Schema

- **Content-Type:** `application/json`
```
$ref: NewRequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - contractId: integer (int32)
  - ellipsePosition: string
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - requestType: string
  - startDate: string (date-time)
  - submit: boolean
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - userAccessType: string
  - userType: string
```
- **Content-Type:** `text/json`
```
$ref: NewRequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - contractId: integer (int32)
  - ellipsePosition: string
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - requestType: string
  - startDate: string (date-time)
  - submit: boolean
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - userAccessType: string
  - userType: string
```
- **Content-Type:** `application/*+json`
```
$ref: NewRequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - contractId: integer (int32)
  - ellipsePosition: string
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - requestType: string
  - startDate: string (date-time)
  - submit: boolean
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - userAccessType: string
  - userType: string
```

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
$ref: RequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - businessNeedConfirmed: boolean
  - closureOutcome: string
  - contractId: integer (int32)
  - dateAccessGranted: string (date-time)
  - deputyHeadApproved: boolean
  - ellipsePosition: string
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - hcSystemsAdminApproved: boolean
  - ictManagerApproved: boolean
  - id: integer (int32)
  - implementationComments: string
  - lineManagerApproved: boolean
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - rejectionReason: string
  - requestNumber: string
  - requestType: string
  - requestedDate: string (date-time)
  - startDate: string (date-time)
  - status: string
  - submittedByUserId: integer (int32)
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - trainingVerified: boolean
  - userAccessType: string
  - userType: string
```
- **Content-Type:** `application/json`
```
$ref: RequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - businessNeedConfirmed: boolean
  - closureOutcome: string
  - contractId: integer (int32)
  - dateAccessGranted: string (date-time)
  - deputyHeadApproved: boolean
  - ellipsePosition: string
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - hcSystemsAdminApproved: boolean
  - ictManagerApproved: boolean
  - id: integer (int32)
  - implementationComments: string
  - lineManagerApproved: boolean
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - rejectionReason: string
  - requestNumber: string
  - requestType: string
  - requestedDate: string (date-time)
  - startDate: string (date-time)
  - status: string
  - submittedByUserId: integer (int32)
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - trainingVerified: boolean
  - userAccessType: string
  - userType: string
```
- **Content-Type:** `text/json`
```
$ref: RequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - businessNeedConfirmed: boolean
  - closureOutcome: string
  - contractId: integer (int32)
  - dateAccessGranted: string (date-time)
  - deputyHeadApproved: boolean
  - ellipsePosition: string
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - hcSystemsAdminApproved: boolean
  - ictManagerApproved: boolean
  - id: integer (int32)
  - implementationComments: string
  - lineManagerApproved: boolean
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - rejectionReason: string
  - requestNumber: string
  - requestType: string
  - requestedDate: string (date-time)
  - startDate: string (date-time)
  - status: string
  - submittedByUserId: integer (int32)
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - trainingVerified: boolean
  - userAccessType: string
  - userType: string
```

---

### GET `/api/Requests/GetRequest`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
$ref: RequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - businessNeedConfirmed: boolean
  - closureOutcome: string
  - contractId: integer (int32)
  - dateAccessGranted: string (date-time)
  - deputyHeadApproved: boolean
  - ellipsePosition: string
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - hcSystemsAdminApproved: boolean
  - ictManagerApproved: boolean
  - id: integer (int32)
  - implementationComments: string
  - lineManagerApproved: boolean
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - rejectionReason: string
  - requestNumber: string
  - requestType: string
  - requestedDate: string (date-time)
  - startDate: string (date-time)
  - status: string
  - submittedByUserId: integer (int32)
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - trainingVerified: boolean
  - userAccessType: string
  - userType: string
```
- **Content-Type:** `application/json`
```
$ref: RequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - businessNeedConfirmed: boolean
  - closureOutcome: string
  - contractId: integer (int32)
  - dateAccessGranted: string (date-time)
  - deputyHeadApproved: boolean
  - ellipsePosition: string
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - hcSystemsAdminApproved: boolean
  - ictManagerApproved: boolean
  - id: integer (int32)
  - implementationComments: string
  - lineManagerApproved: boolean
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - rejectionReason: string
  - requestNumber: string
  - requestType: string
  - requestedDate: string (date-time)
  - startDate: string (date-time)
  - status: string
  - submittedByUserId: integer (int32)
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - trainingVerified: boolean
  - userAccessType: string
  - userType: string
```
- **Content-Type:** `text/json`
```
$ref: RequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - businessNeedConfirmed: boolean
  - closureOutcome: string
  - contractId: integer (int32)
  - dateAccessGranted: string (date-time)
  - deputyHeadApproved: boolean
  - ellipsePosition: string
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - hcSystemsAdminApproved: boolean
  - ictManagerApproved: boolean
  - id: integer (int32)
  - implementationComments: string
  - lineManagerApproved: boolean
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - rejectionReason: string
  - requestNumber: string
  - requestType: string
  - requestedDate: string (date-time)
  - startDate: string (date-time)
  - status: string
  - submittedByUserId: integer (int32)
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - trainingVerified: boolean
  - userAccessType: string
  - userType: string
```

---

### GET `/api/Requests/GetRequests`

- **tags:** Requests

#### Parameters

_None_

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
array[$ref: RequestDetails]
```
- **Content-Type:** `application/json`
```
array[$ref: RequestDetails]
```
- **Content-Type:** `text/json`
```
array[$ref: RequestDetails]
```

---

### POST `/api/Requests/HcImplement`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |

#### Request Body Schema

- **Content-Type:** `application/json`
```
$ref: ImplementRequestDetails

Expanded properties:
  - closureOutcome: string
  - dateAccessGranted: string (date-time)
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - implementationComments: string
```
- **Content-Type:** `text/json`
```
$ref: ImplementRequestDetails

Expanded properties:
  - closureOutcome: string
  - dateAccessGranted: string (date-time)
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - implementationComments: string
```
- **Content-Type:** `application/*+json`
```
$ref: ImplementRequestDetails

Expanded properties:
  - closureOutcome: string
  - dateAccessGranted: string (date-time)
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - implementationComments: string
```

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### POST `/api/Requests/HcReject`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |
| rejectionReason | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### POST `/api/Requests/IctApprove`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### POST `/api/Requests/IctReject`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |
| rejectionReason | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### POST `/api/Requests/LineManagerApprove`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### POST `/api/Requests/LineManagerReject`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |
| rejectionReason | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### POST `/api/Requests/ResubmitAmendment`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### POST `/api/Requests/ReturnForAmendment`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |

#### Request Body Schema

- **Content-Type:** `application/json`
```
$ref: ReturnForAmendmentDetails

Expanded properties:
  - amendmentType: string
  - documentsRequested: string
  - reason: string
```
- **Content-Type:** `text/json`
```
$ref: ReturnForAmendmentDetails

Expanded properties:
  - amendmentType: string
  - documentsRequested: string
  - reason: string
```
- **Content-Type:** `application/*+json`
```
$ref: ReturnForAmendmentDetails

Expanded properties:
  - amendmentType: string
  - documentsRequested: string
  - reason: string
```

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### GET `/api/Requests/SearchRequest`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| searchString | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
array[$ref: RequestDetails]
```
- **Content-Type:** `application/json`
```
array[$ref: RequestDetails]
```
- **Content-Type:** `text/json`
```
array[$ref: RequestDetails]
```

---

### POST `/api/Requests/Submit`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### POST `/api/Requests/TrainingUnverify`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |
| rejectionReason | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### POST `/api/Requests/TrainingVerify`

- **tags:** Requests

#### Parameters

| name | in | required |
| --- | --- | --- |
| requestId | query | False |
| trainingDate | query | False |
| verifiedBy | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
boolean
```
- **Content-Type:** `application/json`
```
boolean
```
- **Content-Type:** `text/json`
```
boolean
```

---

### PUT `/api/Requests/UpdateRequest`

- **tags:** Requests

#### Parameters

_None_

#### Request Body Schema

- **Content-Type:** `application/json`
```
$ref: RequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - businessNeedConfirmed: boolean
  - closureOutcome: string
  - contractId: integer (int32)
  - dateAccessGranted: string (date-time)
  - deputyHeadApproved: boolean
  - ellipsePosition: string
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - hcSystemsAdminApproved: boolean
  - ictManagerApproved: boolean
  - id: integer (int32)
  - implementationComments: string
  - lineManagerApproved: boolean
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - rejectionReason: string
  - requestNumber: string
  - requestType: string
  - requestedDate: string (date-time)
  - startDate: string (date-time)
  - status: string
  - submittedByUserId: integer (int32)
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - trainingVerified: boolean
  - userAccessType: string
  - userType: string
```
- **Content-Type:** `text/json`
```
$ref: RequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - businessNeedConfirmed: boolean
  - closureOutcome: string
  - contractId: integer (int32)
  - dateAccessGranted: string (date-time)
  - deputyHeadApproved: boolean
  - ellipsePosition: string
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - hcSystemsAdminApproved: boolean
  - ictManagerApproved: boolean
  - id: integer (int32)
  - implementationComments: string
  - lineManagerApproved: boolean
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - rejectionReason: string
  - requestNumber: string
  - requestType: string
  - requestedDate: string (date-time)
  - startDate: string (date-time)
  - status: string
  - submittedByUserId: integer (int32)
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - trainingVerified: boolean
  - userAccessType: string
  - userType: string
```
- **Content-Type:** `application/*+json`
```
$ref: RequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - businessNeedConfirmed: boolean
  - closureOutcome: string
  - contractId: integer (int32)
  - dateAccessGranted: string (date-time)
  - deputyHeadApproved: boolean
  - ellipsePosition: string
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - hcSystemsAdminApproved: boolean
  - ictManagerApproved: boolean
  - id: integer (int32)
  - implementationComments: string
  - lineManagerApproved: boolean
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - rejectionReason: string
  - requestNumber: string
  - requestType: string
  - requestedDate: string (date-time)
  - startDate: string (date-time)
  - status: string
  - submittedByUserId: integer (int32)
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - trainingVerified: boolean
  - userAccessType: string
  - userType: string
```

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
$ref: RequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - businessNeedConfirmed: boolean
  - closureOutcome: string
  - contractId: integer (int32)
  - dateAccessGranted: string (date-time)
  - deputyHeadApproved: boolean
  - ellipsePosition: string
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - hcSystemsAdminApproved: boolean
  - ictManagerApproved: boolean
  - id: integer (int32)
  - implementationComments: string
  - lineManagerApproved: boolean
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - rejectionReason: string
  - requestNumber: string
  - requestType: string
  - requestedDate: string (date-time)
  - startDate: string (date-time)
  - status: string
  - submittedByUserId: integer (int32)
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - trainingVerified: boolean
  - userAccessType: string
  - userType: string
```
- **Content-Type:** `application/json`
```
$ref: RequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - businessNeedConfirmed: boolean
  - closureOutcome: string
  - contractId: integer (int32)
  - dateAccessGranted: string (date-time)
  - deputyHeadApproved: boolean
  - ellipsePosition: string
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - hcSystemsAdminApproved: boolean
  - ictManagerApproved: boolean
  - id: integer (int32)
  - implementationComments: string
  - lineManagerApproved: boolean
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - rejectionReason: string
  - requestNumber: string
  - requestType: string
  - requestedDate: string (date-time)
  - startDate: string (date-time)
  - status: string
  - submittedByUserId: integer (int32)
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - trainingVerified: boolean
  - userAccessType: string
  - userType: string
```
- **Content-Type:** `text/json`
```
$ref: RequestDetails

Expanded properties:
  - additionalUserAccess: string
  - businessJustification: string
  - businessNeedConfirmed: boolean
  - closureOutcome: string
  - contractId: integer (int32)
  - dateAccessGranted: string (date-time)
  - deputyHeadApproved: boolean
  - ellipsePosition: string
  - ellipseUserId: integer (int64)
  - ellipseUserUpdateDate: string (date-time)
  - employeeEmail: string
  - endDate: string (date-time)
  - environment: string
  - environmentId: integer (int32)
  - hcSystemsAdminApproved: boolean
  - ictManagerApproved: boolean
  - id: integer (int32)
  - implementationComments: string
  - lineManagerApproved: boolean
  - menuAccess: string
  - permanentPostId: integer (int32)
  - positionToCopy: string
  - rejectionReason: string
  - requestNumber: string
  - requestType: string
  - requestedDate: string (date-time)
  - startDate: string (date-time)
  - status: string
  - submittedByUserId: integer (int32)
  - temporaryPosition: string
  - temporaryPostId: integer (int32)
  - trainingVerified: boolean
  - userAccessType: string
  - userType: string
```

---

### POST `/api/Roles/AssignRole`

- **tags:** Roles

#### Parameters

_None_

#### Request Body Schema

- **Content-Type:** `application/json`
```
$ref: AssignRoleRequest

Expanded properties:
  - activeDirectoryUsername: string
  - appUserId: integer (int32)
  - effectiveFrom: string (date-time)
  - effectiveTo: string (date-time)
  - roleCode: string
```
- **Content-Type:** `text/json`
```
$ref: AssignRoleRequest

Expanded properties:
  - activeDirectoryUsername: string
  - appUserId: integer (int32)
  - effectiveFrom: string (date-time)
  - effectiveTo: string (date-time)
  - roleCode: string
```
- **Content-Type:** `application/*+json`
```
$ref: AssignRoleRequest

Expanded properties:
  - activeDirectoryUsername: string
  - appUserId: integer (int32)
  - effectiveFrom: string (date-time)
  - effectiveTo: string (date-time)
  - roleCode: string
```

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
$ref: UserRoleDetails

Expanded properties:
  - activeDirectoryUsername: string
  - appUserId: integer (int32)
  - assignedAt: string (date-time)
  - assignedByUserId: integer (int32)
  - effectiveFrom: string (date-time)
  - effectiveTo: string (date-time)
  - roleCode: string
  - roleId: integer (int32)
  - roleName: string
```
- **Content-Type:** `application/json`
```
$ref: UserRoleDetails

Expanded properties:
  - activeDirectoryUsername: string
  - appUserId: integer (int32)
  - assignedAt: string (date-time)
  - assignedByUserId: integer (int32)
  - effectiveFrom: string (date-time)
  - effectiveTo: string (date-time)
  - roleCode: string
  - roleId: integer (int32)
  - roleName: string
```
- **Content-Type:** `text/json`
```
$ref: UserRoleDetails

Expanded properties:
  - activeDirectoryUsername: string
  - appUserId: integer (int32)
  - assignedAt: string (date-time)
  - assignedByUserId: integer (int32)
  - effectiveFrom: string (date-time)
  - effectiveTo: string (date-time)
  - roleCode: string
  - roleId: integer (int32)
  - roleName: string
```

---

### GET `/api/Roles/GetRoles`

- **tags:** Roles

#### Parameters

_None_

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
array[$ref: RoleDetails]
```
- **Content-Type:** `application/json`
```
array[$ref: RoleDetails]
```
- **Content-Type:** `text/json`
```
array[$ref: RoleDetails]
```

---

### GET `/api/Roles/GetUser`

- **tags:** Roles

#### Parameters

| name | in | required |
| --- | --- | --- |
| appUserId | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
$ref: AppUserSummary

Expanded properties:
  - activeDirectoryUsername: string
  - displayName: string
  - email: string
  - employeeEmail: string
  - id: integer (int32)
  - isActive: boolean
  - roles: array[string]
```
- **Content-Type:** `application/json`
```
$ref: AppUserSummary

Expanded properties:
  - activeDirectoryUsername: string
  - displayName: string
  - email: string
  - employeeEmail: string
  - id: integer (int32)
  - isActive: boolean
  - roles: array[string]
```
- **Content-Type:** `text/json`
```
$ref: AppUserSummary

Expanded properties:
  - activeDirectoryUsername: string
  - displayName: string
  - email: string
  - employeeEmail: string
  - id: integer (int32)
  - isActive: boolean
  - roles: array[string]
```

---

### GET `/api/Roles/GetUserRoles`

- **tags:** Roles

#### Parameters

| name | in | required |
| --- | --- | --- |
| appUserId | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
array[$ref: UserRoleDetails]
```
- **Content-Type:** `application/json`
```
array[$ref: UserRoleDetails]
```
- **Content-Type:** `text/json`
```
array[$ref: UserRoleDetails]
```

---

### GET `/api/Roles/GetUsers`

- **tags:** Roles

#### Parameters

_None_

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
- **Content-Type:** `text/plain`
```
array[$ref: AppUserSummary]
```
- **Content-Type:** `application/json`
```
array[$ref: AppUserSummary]
```
- **Content-Type:** `text/json`
```
array[$ref: AppUserSummary]
```

---

### DELETE `/api/Roles/RevokeRole`

- **tags:** Roles

#### Parameters

| name | in | required |
| --- | --- | --- |
| appUserId | query | False |
| roleCode | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
_No content body_

---

### PUT `/api/Roles/SetUserActive`

- **tags:** Roles

#### Parameters

| name | in | required |
| --- | --- | --- |
| appUserId | query | False |
| isActive | query | False |

#### Request Body Schema

_None_

#### Response 200 Schema

- description: OK
_No content body_

---

## Components / Schemas

Total schemas: 13

### AppUserSummary

- type: object
- **key properties:**
  - `activeDirectoryUsername`: string
  - `displayName`: string
  - `email`: string
  - `employeeEmail`: string
  - `id`: integer (int32)
  - `isActive`: boolean
  - `roles`: array[string]

### AssignRoleRequest

- type: object
- **key properties:**
  - `activeDirectoryUsername`: string
  - `appUserId`: integer (int32)
  - `effectiveFrom`: string (date-time)
  - `effectiveTo`: string (date-time)
  - `roleCode`: string

### ContractorDetails

- type: object
- **key properties:**
  - `branch`: string
  - `businessJustification`: string
  - `companyName`: string
  - `department`: string
  - `emailAddress`: string
  - `endDate`: string (date-time)
  - `firstName`: string
  - `id`: integer (int32)
  - `identificationNumber`: string
  - `responsibleManager`: string
  - `startDate`: string (date-time)
  - `surname`: string

### DocumentAuditDetails

- type: object
- **key properties:**
  - `auditType`: string
  - `dateCreated`: string (date-time)
  - `documentData`: string (byte)
  - `documentId`: integer (int32)
  - `id`: integer (int32)
  - `oldDocumentData`: string (byte)

### DocumentDetails

- type: object
- **key properties:**
  - `active`: boolean
  - `archived`: boolean
  - `archivedDate`: string (date-time)
  - `data`: string (byte)
  - `dateModified`: string (date-time)
  - `dateUploaded`: string (date-time)
  - `documentType`: string
  - `id`: integer (int32)
  - `requestId`: integer (int32)

### EmployeeDetails

- type: object
- **key properties:**
  - `activeDirectoryUsername`: string
  - `branch`: string
  - `contactNumber`: string
  - `department`: string
  - `designation`: string
  - `emailAddress`: string
  - `firstName`: string
  - `postId`: integer (int32)
  - `serviceNumber`: string
  - `surname`: string

### ImplementRequestDetails

- type: object
- **key properties:**
  - `closureOutcome`: string
  - `dateAccessGranted`: string (date-time)
  - `ellipseUserId`: integer (int64)
  - `ellipseUserUpdateDate`: string (date-time)
  - `implementationComments`: string

### NewRequestDetails

- type: object
- **key properties:**
  - `additionalUserAccess`: string
  - `businessJustification`: string
  - `contractId`: integer (int32)
  - `ellipsePosition`: string
  - `employeeEmail`: string
  - `endDate`: string (date-time)
  - `environment`: string
  - `environmentId`: integer (int32)
  - `menuAccess`: string
  - `permanentPostId`: integer (int32)
  - `positionToCopy`: string
  - `requestType`: string
  - `startDate`: string (date-time)
  - `submit`: boolean
  - `temporaryPosition`: string
  - `temporaryPostId`: integer (int32)
  - `userAccessType`: string
  - `userType`: string

### RequestApproverActionDetails

- type: object
- **key properties:**
  - `actionType`: string
  - `approverDate`: string (date-time)
  - `approverType`: string
  - `id`: integer (int32)
  - `name`: string
  - `postId`: integer (int64)
  - `requestId`: integer (int32)
  - `serviceNumber`: integer (int64)
  - `surname`: string

### RequestDetails

- type: object
- **key properties:**
  - `additionalUserAccess`: string
  - `businessJustification`: string
  - `businessNeedConfirmed`: boolean
  - `closureOutcome`: string
  - `contractId`: integer (int32)
  - `dateAccessGranted`: string (date-time)
  - `deputyHeadApproved`: boolean
  - `ellipsePosition`: string
  - `ellipseUserId`: integer (int64)
  - `ellipseUserUpdateDate`: string (date-time)
  - `employeeEmail`: string
  - `endDate`: string (date-time)
  - `environment`: string
  - `environmentId`: integer (int32)
  - `hcSystemsAdminApproved`: boolean
  - `ictManagerApproved`: boolean
  - `id`: integer (int32)
  - `implementationComments`: string
  - `lineManagerApproved`: boolean
  - `menuAccess`: string
  - `permanentPostId`: integer (int32)
  - `positionToCopy`: string
  - `rejectionReason`: string
  - `requestNumber`: string
  - `requestType`: string
  - `requestedDate`: string (date-time)
  - `startDate`: string (date-time)
  - `status`: string
  - `submittedByUserId`: integer (int32)
  - `temporaryPosition`: string
  - `temporaryPostId`: integer (int32)
  - `trainingVerified`: boolean
  - `userAccessType`: string
  - `userType`: string

### ReturnForAmendmentDetails

- type: object
- **key properties:**
  - `amendmentType`: string
  - `documentsRequested`: string
  - `reason`: string

### RoleDetails

- type: object
- **key properties:**
  - `code`: string
  - `description`: string
  - `id`: integer (int32)
  - `name`: string
  - `permissions`: array[string]

### UserRoleDetails

- type: object
- **key properties:**
  - `activeDirectoryUsername`: string
  - `appUserId`: integer (int32)
  - `assignedAt`: string (date-time)
  - `assignedByUserId`: integer (int32)
  - `effectiveFrom`: string (date-time)
  - `effectiveTo`: string (date-time)
  - `roleCode`: string
  - `roleId`: integer (int32)
  - `roleName`: string

