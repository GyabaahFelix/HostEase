# UML Diagrams Specification
## Project: HostelEase (Online Hostel Allocation System)
### Document Version: 1.0.0
### Standard: Unified Modeling Language (UML 2.5)

This document contains professional UML designs for HostelEase, complete with explanations, Mermaid diagrams, and raw PlantUML code for addition into academic project reports.

---

## 1. Use Case Diagram

### 1.1 Purpose
The Use Case Diagram describes the functional requirements of the system from the perspective of external actors. It depicts the boundaries of the system, the actors interacting with it, and the specific use cases (functions) they execute, indicating the relationship between roles.

### 1.2 UML Component Relationships
*   **Student (Actor):** Can sign up, log in, browse hostels matching gender, submit an application, receive notifications, and make allocation payments.
*   **Hostel Administrator (Actor):** Reviews pending applications, matches rooms, registers hostels and rooms, and updates occupancy.
*   **System Administrator (Actor):** Exercises full administrative authority, supervises all assets, overrides parameters, and monitors financial revenue reports.

### 1.3 Mermaid Diagram
```mermaid
rect bg[#0F0F12]
graph TD
    %% Actors
    S(Student Actor)
    HA(Hostel Admin Actor)
    SA(System Admin Actor)

    %% System Boundary
    subgraph HostelEase Application
        UC1(Register Student Account)
        UC2(Authenticate Session)
        UC3(Browse Matching Hostels)
        UC4(Submit Housing Request)
        UC5(Review & Allocate Room)
        UC6(Settle Allocation Invoice)
        UC7(Manage Hostels & Rooms)
        UC8(Monitor Analytics & Revenue)
        UC9(Receive Notifications)
    end

    %% Student Connections
    S --> UC1
    S --> UC2
    S --> UC3
    S --> UC4
    S --> UC6
    S --> UC9

    %% Hostel Admin Connections
    HA --> UC2
    HA --> UC5
    HA --> UC7
    HA --> UC9

    %% System Admin Connections
    SA --> UC2
    SA --> UC7
    SA --> UC8
    SA --> UC9
```

### 1.4 PlantUML Source Code
```plantuml
@startuml HostelEase_Use_Case
left to right direction
skinparam BackgroundColor #0A0A0B
skinparam ArrowColor #6366f1
skinparam ActorBorderColor #cbd5e1
skinparam UseCaseBackgroundColor #0F0F12
skinparam UseCaseBorderColor #ffffff/10
skinparam UseCaseFontColor #cbd5e1

actor "Student" as student
actor "Hostel Administrator" as hostel_admin
actor "System Administrator" as system_admin

rectangle "HostelEase System" {
  usecase "Register Profile" as UC_Reg
  usecase "Login / Authenticate" as UC_Login
  usecase "Browse Eligible Hostels" as UC_Browse
  usecase "Apply for Accommodation" as UC_Apply
  usecase "Assign Room & Approve" as UC_Approve
  usecase "Pay Room Allocation Fee" as UC_Pay
  usecase "Manage Hostel & Rooms" as UC_Manage
  usecase "Monitor System Reports" as UC_Stats
  usecase "Receive Alerts" as UC_Alerts
}

student --> UC_Reg
student --> UC_Login
student --> UC_Browse
student --> UC_Apply
student --> UC_Pay
student --> UC_Alerts

hostel_admin --> UC_Login
hostel_admin --> UC_Approve
hostel_admin --> UC_Manage
hostel_admin --> UC_Alerts

system_admin --> UC_Login
system_admin --> UC_Manage
system_admin --> UC_Stats
system_admin --> UC_Alerts
@enduml
```

---

## 2. Class Diagram

### 2.1 Purpose
The Class Diagram illustrates the static architectural structure of HostelEase. It models the core domain classes, their internal attributes, method operations, visibility modifiers (public `+`, private `-`), and cardinality relationships (multiplicity).

### 2.2 Component Relationships
*   **User (Base)** has a 1-to-many relationship with **Notification** (One user receives many notification alerts).
*   **Student (Inherited from User)** submits 1-to-many **HostelApplication** records.
*   **Hostel** hosts 1-to-many **Room** entities.
*   **Room** is referenced in 0-to-many **HostelApplication** allocations.
*   **HostelApplication** links exactly one **Student**, one **Hostel**, and optionally one allocated **Room**.

### 2.3 Mermaid Diagram
```mermaid
classDiagram
    direction TB
    class User {
        +String id
        +String username
        +String email
        -String passwordHash
        +String role
        +String name
        +String matricNoOrStaffId
        +String gender
        +String phone
        +Date createdAt
        +login() Boolean
        +logout() Boolean
    }

    class Hostel {
        +String id
        +String name
        +String type
        +Number capacity
        +String description
        +String location
        +String imageUrl
        +createdAt Date
    }

    class Room {
        +String id
        +String hostelId
        +String roomNo
        +Number capacity
        +Number occupied
        +Number price
        +String status
        +updateOccupancy(count) Boolean
    }

    class HostelApplication {
        +String id
        +String studentId
        +String hostelId
        +String roomId
        +String academicYear
        +String status
        +String paymentStatus
        +String message
        +String adminComment
        +payAllocation() Boolean
        +updateStatus(newStatus) Boolean
    }

    class Notification {
        +String id
        +String userId
        +String title
        +String message
        +Boolean read
        +markRead() Boolean
    }

    User "1" --> "0..*" Notification : receives
    User <|-- Student : inherits
    User <|-- Administrator : inherits
    Student "1" --> "0..*" HostelApplication : submits
    Hostel "1" --> "1..*" Room : contains
    Room "0..1" --> "0..*" HostelApplication : allocated_to
```

### 2.4 PlantUML Source Code
```plantuml
@startuml HostelEase_Class_Diagram
skinparam BackgroundColor #0A0A0B
skinparam ClassBackgroundColor #0F0F12
skinparam ClassBorderColor #ffffff/10
skinparam ClassFontColor #cbd5e1
skinparam ClassHeaderBackgroundColor #6366f1
skinparam ArrowColor #6366f1

class User {
  +String id
  +String username
  +String email
  -String passwordHash
  +String role
  +String name
  +String matricNoOrStaffId
  +String gender
  +String phone
  +Date createdAt
  +login(): Boolean
  +logout(): Boolean
}

class Hostel {
  +String id
  +String name
  +String type
  +Number capacity
  +String description
  +String location
  +String imageUrl
  +Date createdAt
}

class Room {
  +String id
  +String hostelId
  +String roomNo
  +Number capacity
  +Number occupied
  +Number price
  +String status
  +updateOccupancy(count): Boolean
}

class HostelApplication {
  +String id
  +String studentId
  +String hostelId
  +String roomId
  +String academicYear
  +String status
  +String paymentStatus
  +String message
  +String adminComment
  +payAllocation(): Boolean
  +updateStatus(newStatus): Boolean
}

class Notification {
  +String id
  +String userId
  +String title
  +String message
  +Boolean read
  +markRead(): Boolean
}

User "1" --> "0..*" Notification : receives
Hostel "1" *-- "1..*" Room : contains
User "1" <-- "0..*" HostelApplication : submits
Room "0..1" -- "0..*" HostelApplication : allocated_to
@enduml
```

---

## 3. Activity Diagram

### 3.1 Purpose
The Activity Diagram models the dynamic operational flow of the hostel application and allocation process. It represents the workflow paths, decision points, conditional gates, fork/join operations, and final end states.

### 3.2 Workflow Logic
1.  **Student initiates** a room request.
2.  The system validates whether the student has **already submitted** an application for this session.
3.  If validated, the system filters and displays available hostels **matching the student's gender**.
4.  Student submits the request (state becomes `pending`).
5.  **Hostel Admin reviews** the request.
6.  If **Approved**, the Admin allocates an available room code.
7.  The system alerts the student of the allocation.
8.  The Student **completes card billing** to secure the room slot.
9.  The room's occupancy counter is incremented, and the reservation is locked.

### 3.3 Mermaid Diagram
```mermaid
rect bg[#0F0F12]
stateDiagram-v2
    [*] --> StartApplication
    StartApplication --> CheckExisting : Student opens application tab
    
    state CheckExisting <<choice>>
    CheckExisting --> [*] : Existing application found (Error)
    CheckExisting --> LoadEligibleHostels : No active application exists

    LoadEligibleHostels --> SelectHostel : Filter by gender match
    SelectHostel --> SubmitRequest : Inputs special requests/messages
    SubmitRequest --> PendingReview : Lodged in admin database

    state PendingReview <<state>>
    PendingReview --> AdminDecision : Admin reviews allocation request

    state AdminDecision <<choice>>
    AdminDecision --> RejectedState : Rejected
    AdminDecision --> AllocatedState : Approved (Room Assigned)

    RejectedState --> NotifyStudentReject : Send rejection notification
    NotifyStudentReject --> [*]

    AllocatedState --> PendingPayment : Notify Student of Room Assignment
    PendingPayment --> SubmitCardBilling : Student initiates payment checkout
    SubmitCardBilling --> ConfirmPayment : Bank authorization completes
    ConfirmPayment --> IncrementRoomOccupancy : Secure room slot
    IncrementRoomOccupancy --> FinalAllocationLocked : Mark Paid
    FinalAllocationLocked --> [*]
```

### 3.4 PlantUML Source Code
```plantuml
@startuml HostelEase_Activity_Diagram
skinparam BackgroundColor #0A0A0B
skinparam StartColor #10b981
skinparam EndColor #ef4444
skinparam StateBackgroundColor #0F0F12
skinparam StateBorderColor #ffffff/10
skinparam StateFontColor #cbd5e1
skinparam ArrowColor #6366f1

start
:Student navigates to Allocation Desk;
if (Has active application this year?) then (yes)
  :Display Active Block Error;
  stop
else (no)
  :Retrieve and match student gender;
  :Fetch Hostels matching Student Gender;
  :Student selects preferred Block;
  :Submit Application (Status: Pending);
  :Notify Hostel Administrator;
  
  if (Admin reviews & allocates room?) then (Approved)
    :Assign Room ID;
    :Set Status: Approved;
    :Notify Student of Approval;
    :Student processes card billing checkout;
    :Mark Application: Paid;
    :Increment Occupied count in Room;
    :Secure Room Allocation space;
  else (Rejected)
    :Set Status: Rejected;
    :Notify Student of Rejection;
  endif
endif
stop
@enduml
```

---

## 4. Sequence Diagram

### 4.1 Purpose
The Sequence Diagram displays the step-by-step runtime interaction and message exchange between system boundaries, controllers, database layers, and external actors over a temporal timeline.

### 4.2 Sequence Scenario: Allocation matching & payment checkout
1.  **Student Actor** initiates a room application.
2.  **HostelEase React SPA** sends a POST payload to `/api/applications`.
3.  **Express Application Controller** validates gender criteria against the **DB Ledger**.
4.  Upon validation, the request is recorded in the **DB Ledger**, and a confirmation is returned.
5.  **Hostel Administrator** fetches applications, assigns a room code, and updates status.
6.  The **SPA UI** notifies the student, who triggers payment.
7.  **Payment Processing Logic** settles the invoice, updates room counts, and locks the bed slot.

### 4.3 Mermaid Diagram
```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant SPA as React App (SPA)
    participant API as Express Server (API)
    participant DB as JSON Database Ledger
    actor Admin

    Student->>SPA: Selects hostel & click Submit
    SPA->>API: POST /api/applications {hostelId, academicYear}
    activate API
    API->>DB: Query student gender and active applications
    DB-->>API: Returns validation results (OK)
    API->>DB: Save new application (status: pending)
    API-->>SPA: Application submitted successfully
    deactivate API
    SPA-->>Student: Display pending status banner

    Admin->>SPA: Opens review panel
    SPA->>API: GET /api/applications (List pending)
    API->>DB: Fetch applications with student metrics
    DB-->>API: Returns populated list
    API-->>SPA: Render dashboard table
    Admin->>SPA: Selects room A101 & clicks Approve
    SPA->>API: PUT /api/applications/:id/status {status: approved, roomId}
    activate API
    API->>DB: Save status update & notify student
    API-->>SPA: Application approved
    deactivate API

    Student->>SPA: Initiates room checkout payment
    SPA->>API: POST /api/applications/:id/pay {billingInfo}
    activate API
    API->>DB: Set application paymentStatus = "paid"
    API->>DB: Increment Room Occupied counter (A101)
    API-->>SPA: Transaction completed, allocation secured
    deactivate API
    SPA-->>Student: Display physical allocation coupon
```

### 4.4 PlantUML Source Code
```plantuml
@startuml HostelEase_Sequence
autonumber
skinparam BackgroundColor #0A0A0B
skinparam ActorBorderColor #cbd5e1
skinparam ActorBackgroundColor #0F0F12
skinparam ParticipantBackgroundColor #0F0F12
skinparam ParticipantBorderColor #ffffff/10
skinparam ParticipantFontColor #cbd5e1
skinparam ArrowColor #6366f1
skinparam LifeLineBorderColor #6366f1

actor "Student" as student
participant "React Frontend (SPA)" as spa
participant "Express API Controller" as api
database "DB JSON Ledger" as db
actor "Hostel Admin" as admin

student -> spa : Clicks "Submit Request"
spa -> api : POST /api/applications\n(Payload: hostelId, academicYear)
activate api

api -> db : Validate gender matching & existing apps
activate db
db --> api : Verification success
deactivate db

api -> db : CreateApplication()
activate db
db --> api : Application logged (ID: app_xyz, status: pending)
deactivate db

api --> spa : Application registered
deactivate api
spa --> student : Render pending application screen

admin -> spa : Opens "Applications Desk"
spa -> api : GET /api/applications
activate api
api -> db : Retrieve all logs
db --> api : Populated list returned
api --> spa : Render list table
deactivate api

admin -> spa : Allocates Room A101 & Approves
spa -> api : PUT /api/applications/:id/status\n(Payload: status=approved, roomId=rm_101)
activate api
api -> db : UpdateApplicationStatus()
db --> api : Database saved
api --> spa : Review submitted
deactivate api

student -> spa : Performs payment checkout
spa -> api : POST /api/applications/:id/pay\n(Card credentials)
activate api
api -> db : MarkApplicationPaid() & IncrementRoomOccupancy()
db --> api : Counters updated successfully
api --> spa : Settle secured
deactivate api
spa --> student : Display secured room slip
@enduml
```

---

## 5. Component Diagram

### 5.1 Purpose
The Component Diagram details the modular structure of the HostelEase application. It illustrates how the software components (controllers, views, databases) are organized, specifying their interface boundaries and dependencies.

### 5.2 Component Layout and Interactions
*   **Web Browser Client Layer:** Comprises React Views (Dashboard, Forms, Maps, and Invoices) communicating over HTTPS with the backend.
*   **Application Server Component Layer:** Comprises the Router, Middleware validation, and controllers (Auth, Hostels, Rooms, and Applications).
*   **Database Engine Layer:** Handles the storage adapters, transaction logging, schema compliance, and JSON files on disk.

### 5.3 Mermaid Diagram
```mermaid
rect bg[#0F0F12]
graph TD
    subgraph Web Browser Client (Frontend)
        Views[React UI Components / Tabs]
        Context[React Context / Token Manager]
        Views -->|Request Session| Context
    end

    subgraph Express Application Server (Backend)
        Router[Express API Router]
        Middleware[Auth & RBAC Middleware]
        
        subgraph Controllers
            AuthCtrl[Auth Controller]
            HstCtrl[Hostel Controller]
            AppCtrl[Application Controller]
            StatsCtrl[Stats Controller]
        end

        Router --> Middleware
        Middleware --> Controllers
    end

    subgraph Data Layer (Persistence)
        DBEngine[Local Database Engine / File System]
    end

    %% Client to Server connection
    Views -->|HTTPS REST Requests| Router
    
    %% Controller to DB connection
    Controllers -->|CRUD Queries| DBEngine
```

### 5.4 PlantUML Source Code
```plantuml
@startuml HostelEase_Component_Diagram
skinparam BackgroundColor #0A0A0B
skinparam ComponentBackgroundColor #0F0F12
skinparam ComponentBorderColor #ffffff/10
skinparam ComponentFontColor #cbd5e1
skinparam InterfaceBackgroundColor #6366f1
skinparam ArrowColor #6366f1

package "Web Browser Client (React)" {
  [UI Components / Tabs] as ui
  [Context / State Manager] as context
  ui ..> context : uses
}

package "Express API Server" {
  [API Router] as router
  [Auth Middleware] as auth_mw
  
  package "Controllers" {
    [AuthController] as auth_ctrl
    [HostelController] as hst_ctrl
    [ApplicationController] as app_ctrl
    [StatsController] as stats_ctrl
  }
  
  router --> auth_mw
  auth_mw --> auth_ctrl
  auth_mw --> hst_ctrl
  auth_mw --> app_ctrl
  auth_mw --> stats_ctrl
}

database "DB Persistence Layer" {
  [DBEngine / JSON File Adapter] as db_engine
}

ui ----> router : HTTPS REST requests
auth_ctrl --> db_engine : writes
hst_ctrl --> db_engine : queries
app_ctrl --> db_engine : updates
stats_ctrl --> db_engine : reads
@enduml
```

---

## 6. Deployment Diagram

### 6.1 Purpose
The Deployment Diagram represents the physical deployment topology of the HostelEase software onto hardware nodes. It demonstrates how software modules map to execution environments, container setups, database servers, and reverse proxy architectures.

### 6.2 Deployment Topology and Protocols
*   **User Workstations:** Run standard web browsers accessing the system over HTTPS port 443.
*   **Cloud Run Container (PaaS Server Node):** Encapsulates the Node.js runtime container running the Express.js server, receiving requests on port 3000 behind an nginx reverse proxy.
*   **Virtual Storage Node:** Hosts the secure file-based JSON ledger database.

### 6.3 Mermaid Diagram
```mermaid
rect bg[#0F0F12]
graph TD
    subgraph Client Workstation
        Browser[Modern Web Browser]
    end

    subgraph Cloud Infrastructure (GCP / Cloud Run Container)
        Nginx[Nginx Reverse Proxy / SSL Gateway]
        
        subgraph Node.js Container Workspace [Port 3000]
            Server[Node.js / Express Server]
            StaticFiles[Compiled React Production Assets]
        end

        subgraph Persistent Persistent Volume Mount
            DBFiles[hostelease-db.json Store]
        end

        Nginx -->|Routes Traffic| Server
        Server -->|Launches & Serves| StaticFiles
        Server -->|Saves Records| DBFiles
    end

    Browser -->|HTTPS/TLS Port 443| Nginx
```

### 6.4 PlantUML Source Code
```plantuml
@startuml HostelEase_Deployment
skinparam BackgroundColor #0A0A0B
skinparam NodeBackgroundColor #0F0F12
skinparam NodeBorderColor #ffffff/10
skinparam NodeFontColor #cbd5e1
skinparam ArrowColor #6366f1

node "Client Device" {
  [Modern Web Browser] as browser
}

node "GCP Cloud Run (Container Service)" {
  node "Nginx Gateway (Reverse Proxy)" {
    [SSL Certificate / Port 443] as nginx
  }
  
  node "Node.js Environment [Port 3000]" {
    [Express API Application] as express_app
    [Bundled React SPA] as spa_build
  }
  
  node "Persistent Storage Mount" {
    database "hostelease-db.json" as db_json
  }
}

browser --> nginx : HTTPS / TLS
nginx --> express_app : Proxy Routing
express_app --> spa_build : serves
express_app --> db_json : Read / Write I/O File System
@enduml
```
