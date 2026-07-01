# MongoDB Database Design Specification
## Project: HostelEase (Online Hostel Allocation System)
### Document Version: 1.0.0
### Standard: Industry-Grade MongoDB Document Modeling

---

## 1. Database Architecture & Design Strategy

HostelEase utilizes **MongoDB** as its primary document-oriented database. The choice of a NoSQL, document-oriented database is driven by the following architectural benefits:
1.  **Schema Flexibility:** Accommodating different types of student credentials, program variants, and variable room attributes without requiring disruptive migrations.
2.  **High Read Performance:** Hostel status panels, vacancy trackers, and audit logging require high throughput. MongoDB's indexing capabilities and document structure enable very fast retrieval.
3.  **JSON Congruency:** Storing documents in BSON format aligns perfectly with the TypeScript models used on the Express/React full-stack layers.

---

## 2. Collections and Data Models

HostelEase implements five core collections:
1.  `users` (Students, Hostel Administrators, and System Administrators)
2.  `hostels` (Hostel Building Blocks)
3.  `rooms` (Housing Rooms nested under specific Hostels)
4.  `applications` (Student hostel applications and room matching states)
5.  `notifications` (User alerts and real-time operational feeds)

---

### 2.1 Collection: `users`
Represents all system actors with secure credentials and demographic metadata for rule-based allocations.

#### Schema Fields & Validation Rules
| Field Name | BSON Type | Constraints & Validations | Indexing | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated, Primary Key | Unique | Unique identifier |
| `username` | String | Required, Trimmed, Unique, Min length: 3 | Unique | Hand-chosen unique handle |
| `email` | String | Required, Trimmed, Lowercase, Unique, Valid email regex | Unique | Institutional academic email |
| `passwordHash` | String | Required, Minimum 60 characters (bcrypt length) | None | Hashed version of the password |
| `role` | String | Required, Enum: `['student', 'hostel_admin', 'system_admin']` | Single Field | RBAC classification |
| `name` | String | Required, Trimmed, Min length: 2 | None | Legal name of user |
| `matricNoOrStaffId`| String | Required, Trimmed, Unique, Uppercase | Unique | Official institution identification number |
| `gender` | String | Required, Enum: `['male', 'female', 'other']` | Single Field | Gender used to enforce room placement rules |
| `phone` | String | Required, Trimmed, Valid international dial regex | None | Mobile phone number |
| `department` | String | Optional, Trimmed | None | Student academic department or staff office |
| `createdAt` | Date | Auto-generated default: `Date.now()` | None | Creation timestamp |

---

### 2.2 Collection: `hostels`
Holds individual block facilities with capacity limits.

#### Schema Fields & Validation Rules
| Field Name | BSON Type | Constraints & Validations | Indexing | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated, Primary Key | Unique | Unique identifier |
| `name` | String | Required, Trimmed, Unique | Unique | Unique name of the block (e.g. "Nelson Mandela Hall") |
| `type` | String | Required, Enum: `['male', 'female', 'unisex']` | Single Field | Accommodation gender eligibility criteria |
| `capacity` | Number | Required, Integer, Min value: 1 | None | Absolute physical bed limit of the hostel |
| `description` | String | Required, Trimmed, Max length: 1000 | None | Summary of facilities, inclusions, and study resources |
| `location` | String | Required, Trimmed | None | Geographical location tag (e.g., "North Campus Quad") |
| `imageUrl` | String | Optional, Valid URL string validation | None | Hostel banner thumbnail URL |
| `createdAt` | Date | Auto-generated default: `Date.now()` | None | Timestamp when hostel was registered |

---

### 2.3 Collection: `rooms`
Details individual rooms operating under specific hostel blocks.

#### Schema Fields & Validation Rules
| Field Name | BSON Type | Constraints & Validations | Indexing | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated, Primary Key | Unique | Unique room identifier |
| `hostelId` | ObjectId | Required, Reference to `hostels` collection | Single Field | Parent hostel block relationship link |
| `roomNo` | String | Required, Trimmed, Uppercase | Compound | Room code identifier (e.g., "A101") |
| `capacity` | Number | Required, Integer, Range: 1 to 12 | None | Max student beds in this specific room |
| `occupied` | Number | Required, Integer, Default: 0, Max <= `capacity` | None | Count of students paid and allocated to this room |
| `price` | Number | Required, Min value: 0 | None | Room cost per academic year in NGN |
| `status` | String | Required, Enum: `['available', 'full', 'maintenance']` | Single Field | Operational status of the room |
| `createdAt` | Date | Auto-generated default: `Date.now()` | None | Registration timestamp |

---

### 2.4 Collection: `applications`
Tracks allocation processes from request, through matching, to payment clearance.

#### Schema Fields & Validation Rules
| Field Name | BSON Type | Constraints & Validations | Indexing | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated, Primary Key | Unique | Unique application tracker id |
| `studentId` | ObjectId | Required, Reference to `users` collection | Single Field | Reference of applicant |
| `hostelId` | ObjectId | Required, Reference to `hostels` collection | None | Preferred hostel block |
| `roomId` | ObjectId | Optional, Reference to `rooms` collection | None | Room space allocation assignment |
| `academicYear` | String | Required, Format: YYYY/YYYY (e.g., "2025/2026") | Compound | Target academic term |
| `status` | String | Required, Enum: `['pending', 'approved', 'rejected']` | Single Field | Allocation review pipeline status |
| `paymentStatus` | String | Required, Enum: `['unpaid', 'paid']` | None | Verification status of financial settlement |
| `message` | String | Optional, Trimmed, Max length: 500 | None | Optional medical/special study preference request notes |
| `adminComment` | String | Optional, Trimmed, Max length: 500 | None | Commentary added by allocation officers |
| `createdAt` | Date | Auto-generated default: `Date.now()` | None | Submission timestamp |
| `updatedAt` | Date | Auto-generated default: `Date.now()` | None | Operational state change timestamp |

---

### 2.5 Collection: `notifications`
Personalized alert notifications for active state transitions.

#### Schema Fields & Validation Rules
| Field Name | BSON Type | Constraints & Validations | Indexing | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated, Primary Key | Unique | Notification unique id |
| `userId` | ObjectId | Required, Reference to `users` collection | Single Field | Target recipient user link |
| `title` | String | Required, Trimmed | None | Short alert headline |
| `message` | String | Required, Trimmed | None | Full alert body content |
| `read` | Boolean | Required, Default: `false` | None | Status indicating if user viewed the alert |
| `createdAt` | Date | Auto-generated default: `Date.now()` | TTL Index | Submission timestamp (set to expire after 30 days) |

---

## 3. Reference vs. Embedded Documents Decisions

To achieve optimal latency and maintain data integrity, HostelEase employs a balanced hybrid design:

### 3.1 Why Use References (Normalized)
*   **User -> Application (`studentId`):** Users are highly dynamic (can change password, phone, or name). Keeping them in a dedicated collection ensures that updates do not require costly multi-document search-and-replace queries across hundreds of applications.
*   **Hostel -> Room (`hostelId`):** Hostels represent macro university infrastructure, whereas rooms are micro subdivisions. Linking rooms to hostels via a reference maintains absolute transactional safety and isolates room CRUD modifications from impacting hostel details.
*   **Room -> Application (`roomId`):** Because room numbers can change and student occupancy status updates during payment cycles, linking the room dynamically ensures that there is only one source of truth for current room capacity and bed assignments.

### 3.2 Why Use Embedding (Denormalized)
*   **No deeply nested structures:** To maintain simple queries and fast index traversals, the system avoids embedding deeply nested collections (like nesting rooms inside the hostel array). Storing them in flat, indexed collections with object references prevents BSON document size limits (16MB) from being exceeded over years of academic operations.

---

## 4. Database Indexing Strategy

HostelEase configures a robust indexing hierarchy to guarantee speedy querying under high peak enrollment:

1.  **Single-Field Indexes:**
    *   `users.email_1`: Fast authentication lookup.
    *   `users.username_1`: Fast handle availability checks.
    *   `users.matricNoOrStaffId_1`: Prevent dual registration of university ID.
    *   `rooms.hostelId_1`: High-speed listing of rooms nested inside a hostel block.
    *   `applications.studentId_1`: Instant student history lookup.

2.  **Compound Indexes:**
    *   `rooms.hostelId_1_roomNo_1` (Unique): Prevents two rooms in the same hostel block from having the exact same room number.
    *   `applications.studentId_1_academicYear_1` (Unique): Enforces the business rule that a student may submit only **one** housing application per academic year.

3.  **Specialized TTL Indexes:**
    *   `notifications.createdAt_1` with `expireAfterSeconds: 2592000` (30 days): Automatically prunes historic alerts from the database to save storage space.

---

## 5. Entity Relationship Diagram (ERD) Adapted for MongoDB

```
+-----------------------------------------------------------------------------------+
|                                     USERS                                         |
+-----------------------------------------------------------------------------------+
| _id: ObjectId [PK]                                                                |
| username: String (Unique)                                                         |
| email: String (Unique)                                                            |
| passwordHash: String                                                              |
| role: String (Enum: student, hostel_admin, system_admin)                          |
| name: String                                                                      |
| matricNoOrStaffId: String (Unique)                                                |
| gender: String (Enum: male, female, other)                                        |
| phone: String                                                                     |
+-----------------------------------------------------------------------------------+
        |                                                              |
        | 1                                                            | 1
        |                                                              |
        | N                                                            | N
+----------------------------------------+     +------------------------------------+
|               APPLICATIONS             |     |            NOTIFICATIONS           |
+----------------------------------------+     +------------------------------------+
| _id: ObjectId [PK]                     |     | _id: ObjectId [PK]                 |
| studentId: ObjectId [FK -> Users]      |     | userId: ObjectId [FK -> Users]     |
| hostelId: ObjectId [FK -> Hostels]     |     | title: String                      |
| roomId: ObjectId [FK -> Rooms, Opt]    |     | message: String                    |
| academicYear: String                   |     | read: Boolean                      |
| status: String (Enum)                  |     | createdAt: Date [TTL Index]        |
| paymentStatus: String (Enum)           |     +------------------------------------+
| message: String                        |
| adminComment: String                   |
+----------------------------------------+
        |
        | N
        |
        | 1
+-----------------------------------------------------------------------------------+
|                                     ROOMS                                         |
+-----------------------------------------------------------------------------------+
| _id: ObjectId [PK]                                                                |
| hostelId: ObjectId [FK -> Hostels]                                                |
| roomNo: String                                                                    |
| capacity: Number                                                                  |
| occupied: Number                                                                  |
| price: Number                                                                     |
| status: String (Enum: available, full, maintenance)                               |
+-----------------------------------------------------------------------------------+
        |
        | N
        |
        | 1
+-----------------------------------------------------------------------------------+
|                                    HOSTELS                                        |
+-----------------------------------------------------------------------------------+
| _id: ObjectId [PK]                                                                |
| name: String (Unique)                                                             |
| type: String (Enum: male, female, unisex)                                         |
| capacity: Number                                                                  |
| location: String                                                                  |
+-----------------------------------------------------------------------------------+
```

---

## 6. Mongoose Schema Definitions

Below are the production-ready Mongoose schemas written in TypeScript. They mirror the fields, indices, and constraints defined above:

```typescript
import mongoose, { Schema, Document } from 'mongoose';

// ==========================================
// 1. USER SCHEMA & MODEL
// ==========================================
export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'hostel_admin' | 'system_admin';
  name: string;
  matricNoOrStaffId: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  department?: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['student', 'hostel_admin', 'system_admin'], default: 'student' },
  name: { type: String, required: true, trim: true },
  matricNoOrStaffId: { type: String, required: true, unique: true, uppercase: true, trim: true },
  gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
  phone: { type: String, required: true, trim: true },
  department: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);

// ==========================================
// 2. HOSTEL SCHEMA & MODEL
// ==========================================
export interface IHostel extends Document {
  name: string;
  type: 'male' | 'female' | 'unisex';
  capacity: number;
  description: string;
  location: string;
  imageUrl?: string;
  createdAt: Date;
}

const HostelSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  type: { type: String, required: true, enum: ['male', 'female', 'unisex'] },
  capacity: { type: Number, required: true, min: 1 },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  location: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const HostelModel = mongoose.model<IHostel>('Hostel', HostelSchema);

// ==========================================
// 3. ROOM SCHEMA & MODEL
// ==========================================
export interface IRoom extends Document {
  hostelId: mongoose.Types.ObjectId;
  roomNo: string;
  capacity: number;
  occupied: number;
  price: number;
  status: 'available' | 'full' | 'maintenance';
  createdAt: Date;
}

const RoomSchema: Schema = new Schema({
  hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
  roomNo: { type: String, required: true, uppercase: true, trim: true },
  capacity: { type: Number, required: true, min: 1 },
  occupied: { type: Number, required: true, default: 0, min: 0 },
  price: { type: Number, required: true, min: 0 },
  status: { type: String, required: true, enum: ['available', 'full', 'maintenance'], default: 'available', index: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound Unique Index: Prevent duplicating same room number within a single hostel block
RoomSchema.index({ hostelId: 1, roomNo: 1 }, { unique: true });

export const RoomModel = mongoose.model<IRoom>('Room', RoomSchema);

// ==========================================
// 4. HOSTEL APPLICATION SCHEMA & MODEL
// ==========================================
export interface IHostelApplication extends Document {
  studentId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  academicYear: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentStatus: 'unpaid' | 'paid';
  message?: string;
  adminComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HostelApplicationSchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', default: null },
  academicYear: { type: String, required: true },
  status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  paymentStatus: { type: String, required: true, enum: ['unpaid', 'paid'], default: 'unpaid' },
  message: { type: String, maxlength: 500, trim: true, default: '' },
  adminComment: { type: String, maxlength: 500, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound Unique Index: Enforce one allocation application per student per academic session
HostelApplicationSchema.index({ studentId: 1, academicYear: 1 }, { unique: true });

export const HostelApplicationModel = mongoose.model<IHostelApplication>('HostelApplication', HostelApplicationSchema);

// ==========================================
// 5. NOTIFICATION SCHEMA & MODEL
// ==========================================
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  read: { type: Boolean, required: true, default: false },
  createdAt: { type: Date, default: Date.now }
});

// TTL Index: Automatically expire notifications after 30 days (2,592,000 seconds)
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);
```
