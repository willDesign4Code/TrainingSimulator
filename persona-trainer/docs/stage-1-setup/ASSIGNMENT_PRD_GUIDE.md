# Product Requirements Document (PRD)
## Feature: Category Assignment Management

---

### Overview

In the AI-assisted Learning Management System, managers and administrators need a streamlined way to assign learning categories to users. These assignments dictate what learning content or training modules users will see in their dashboards.  

This feature introduces the ability to **create, manage, and control the visibility of these assignments** within the **Assignment Tab** of the Admin Dashboard.

The goal is to make assignment creation intuitive, ensure visibility aligns with active/inactive states, and maintain a clear overview of all current assignments.

---

## User Stories

### Story 1: Creating a New Assignment
**As an** admin or manager  
**I want to** create a new category assignment  
**So that I can** assign users to a specific learning category.

#### Acceptance Criteria
- [ ] A "Create New Assignment" button is visible in the **Assignment Tab**.  
- [ ] Clicking the button opens a **popup modal** with fields to:
  - Enter the **Assignment Name** (required).
  - Select one or more **users** (multi-select dropdown or list).
  - Choose a **Category** (dropdown or autocomplete list).  
- [ ] The system prevents creating an assignment without:
  - A name.
  - At least one user selected.
  - A category chosen.
- [ ] Once saved, the assignment appears in the **Assignment Table** with status **Inactive** by default.  
- [ ] A success toast/notification confirms that the assignment was created.  

---

### Story 2: Viewing Assignments
**As an** admin or manager  
**I want to** view all existing assignments in a table format  
**So that I can** easily review what has been assigned and to whom.

#### Acceptance Criteria
- [ ] The **Assignment Tab** displays a **paginated table** of all assignments.  
- [ ] Each row includes:
  - Assignment Name  
  - Category  
  - Number of Assigned Users  
  - Status (Active/Inactive)  
  - Action buttons (Edit, Delete)  
- [ ] Pagination allows navigation between pages (default 10–20 items per page).  
- [ ] The table dynamically updates when new assignments are added, edited, or deleted.  

---

### Story 3: Editing an Assignment
**As an** admin or manager  
**I want to** edit an existing assignment  
**So that I can** update the users or category as needed.

#### Acceptance Criteria
- [ ] Clicking “Edit” on an assignment opens the same popup used for creation, pre-filled with current details.  
- [ ] Admins/managers can modify:
  - Assignment name  
  - Users assigned  
  - Category  
- [ ] If the assignment is currently **Active**, and all users are removed, the system automatically sets it to **Inactive**.  
- [ ] Saving changes updates the table immediately.  

---

### Story 4: Deleting an Assignment
**As an** admin or manager  
**I want to** delete an assignment  
**So that I can** remove obsolete or incorrectly created assignments.

#### Acceptance Criteria
- [ ] A “Delete” action is available in the table row dropdown or icon.  
- [ ] A confirmation modal appears before deletion.  
- [ ] On confirmation, the assignment is permanently removed from the system.  
- [ ] The table updates immediately to reflect the deletion.  

---

### Story 5: Managing Assignment Status (Active/Inactive)
**As an** admin or manager  
**I want to** set assignments as active or inactive  
**So that I can** control which assignments appear on user dashboards.

#### Acceptance Criteria
- [ ] The “Status” column in the table allows toggling between **Active** and **Inactive** (e.g., via a switch).  
- [ ] An assignment **cannot be made active** unless it has:
  - At least one user assigned.  
- [ ] When set to **Active**, the assignment:
  - Appears in all assigned users’ dashboards.  
- [ ] When set to **Inactive**, the assignment:
  - Is removed from users’ dashboards.  

---

### Story 6: User Dashboard Integration
**As a** user  
**I want to** see active assignments on my dashboard  
**So that I can** access the learning categories assigned to me.

#### Acceptance Criteria
- [ ] Active assignments appear in the user’s dashboard under a “My Assignments” or similar section.  
- [ ] Each assignment shows:
  - Assignment name  
  - Associated category  
  - (Optional) progress or completion status.  
- [ ] Inactive assignments do not appear at all.  

---

## Functional Requirements

| Function | Description |
|-----------|--------------|
| Assignment Creation Modal | Form for entering name, selecting category, and assigning users. |
| Assignment Table | Displays all assignments with sortable columns and pagination. |
| Edit/Delete Controls | Inline table actions for modifying or removing assignments. |
| Status Toggle | Switch to set assignment as Active/Inactive with validation. |
| User Dashboard Integration | Displays only Active assignments tied to the user. |

---

## Non-Functional Requirements

- **Performance:** Table should load within 1 second with up to 500 assignments.  
- **Scalability:** Support multiple concurrent admins making edits.  
- **Security:** Only authenticated admins/managers can access assignment features.  
- **Usability:** Popup and table interactions should be keyboard- and screen-reader-accessible.  

---

## Open Questions

1. Should assignments automatically deactivate if all users are removed?  
2. Should users receive a notification when a new assignment is made active for them?  
3. Do categories have predefined structures (e.g., learning topics, departments), or can admins create new ones?  
