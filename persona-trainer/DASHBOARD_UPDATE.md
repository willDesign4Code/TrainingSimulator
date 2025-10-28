# Product Requirements Document (PRD)
## Feature: User Dashboard

---

### Overview

The **User Dashboard** is the central hub where users access their assigned learning content. It provides two main views:  
1. **My Assigned Categories** – a visual card-based layout of assigned learning categories.  
2. **My Training Scenarios** – a tabular view of all training scenarios the user can access.

The dashboard is designed to be intuitive, searchable, and persistent — remembering the user’s preferences for sorting, filtering, and active tab between sessions.

---

## User Stories

### Story 1: Dashboard Tab Navigation
**As a** user  
**I want to** switch between “My Assigned Categories” and “My Training Scenarios” tabs  
**So that I can** easily view my assigned learning categories or individual training scenarios.

#### Acceptance Criteria
- [ ] The dashboard has two horizontal tabs:  
  - “My Assigned Categories” (default)  
  - “My Training Scenarios”  
- [ ] The active tab persists across sessions (e.g., via local storage).  
- [ ] Switching tabs updates the content area dynamically without a full page reload.  

---

### Story 2: My Assigned Categories View
**As a** user  
**I want to** view all categories assigned to me as cards  
**So that I can quickly see my available training areas and track progress.

#### Acceptance Criteria
- [ ] The “My Assigned Categories” tab displays all categories assigned to the logged-in user.  
- [ ] Each **category card** displays:
  - Category **title**  
  - Category **details/description**  
  - **Number of topics** and **scenarios** within the category  
  - **Date last updated**  
  - A **progress bar** showing the percentage of scenarios completed  
  - A **“View Category”** button that links to the dedicated Category Page  
- [ ] Cards are responsive and arranged in a grid layout.  
- [ ] Categories can be **sorted** by:
  - Date Added (to the user)
  - Date Created (when the category was created)
  - Date Last Updated  
- [ ] The **search bar** filters visible cards based on title, description, topic names, or scenario names.  
- [ ] Sorting and search selections persist across sessions.  
- [ ] A **filter toggle** allows users to hide completed categories (i.e., categories where all scenarios are completed).  

---

### Story 3: Category Page View
**As a** user  
**I want to** explore a category to see its topics and scenarios  
**So that I can choose a specific scenario to train on.

#### Acceptance Criteria
- [ ] Clicking “View Category” navigates to a dedicated **Category Page** (retaining the left navigation menu).  
- [ ] The Category Page displays:
  - Category name and description at the top.  
  - Topics as **collapsible/expandable sections**.  
  - Scenarios listed within each topic.  
- [ ] Each scenario displays:
  - Scenario title  
  - Status (**Not Started** or **Completed**)  
  - **Last updated** date  
  - Action button:
    - “Start Training” if Not Started  
    - “Retake Training” if Completed  
- [ ] Clicking **Start Training** launches the existing AI training popup modal.  
- [ ] When the user clicks “End Session” within a training, the scenario status automatically updates to **Completed**.  
- [ ] Scenario progress updates reflected in both:
  - The Category progress bar  
  - The Training Scenarios tab  

---

### Story 4: My Training Scenarios View
**As a** user  
**I want to** see all scenarios I can train on in a table format  
**So that I can quickly start or retake training sessions.

#### Acceptance Criteria
- [ ] The “My Training Scenarios” tab displays all scenarios assigned to the user in a table format.  
- [ ] Each row contains:
  - Scenario Name  
  - Category Name  
  - Topic Name  
  - Status (Not Started / Completed)  
  - Last Updated  
  - Action Button (Start Training / Retake Training)  
- [ ] The **search bar** filters scenarios by title, category, topic, or description.  
- [ ] Users can **sort** by:
  - Date Added  
  - Date Created  
  - Last Updated  
- [ ] Users can **filter by Category** using a dropdown populated with their assigned categories.  
- [ ] A **filter toggle** allows users to hide completed trainings.  
- [ ] The table includes **client-side pagination** (e.g., 10–20 rows per page).  
- [ ] Sorting, filtering, and search preferences persist across sessions.  
- [ ] Clicking “Start Training” or “Retake Training” launches the existing AI training popup.  
- [ ] Upon completion (End Session), scenario status updates to **Completed**.  
- [ ] Starting training always begins a **new session**, not a continuation of a previous one.  

---

## Functional Requirements

| Function | Description |
|-----------|--------------|
| Tab Navigation | Persistent tab system for “My Assigned Categories” and “My Training Scenarios”. |
| Category Cards | Card grid layout with title, details, topic/scenario counts, last updated date, progress bar, and “View Category” button. |
| Sorting & Searching | Consistent components for sorting and searching across tabs. Persist across sessions. |
| Category Page | Displays collapsible topics and scenarios with “Start Training” or “Retake Training” buttons. |
| Training Popup | Launches existing AI training simulation modal. Updates scenario status on “End Session.” |
| Scenario Table | Tabular view with sortable columns, category filter, completed filter, and client-side pagination. |
| Progress Tracking | Tracks and displays scenario completion percentages in both Category cards and Scenario Table. |

---

## Non-Functional Requirements

- **Performance:** Dashboard loads within 2 seconds with up to 100 categories and 1,000 scenarios.  
- **Scalability:** Must support thousands of users with personalized data views.  
- **Usability:** Responsive design, keyboard-accessible navigation, and screen-reader compatibility.  
- **Persistence:** Sorting, filtering, and active tab states stored locally to maintain user preferences between sessions.  
- **Consistency:** Shared UI components for search, sort, and filter across both tabs for a cohesive user experience.  
- **Data Integrity:** Scenario completion status updates in real time and syncs with user progress records.  

---

## Open Questions

1. Should completed trainings display a visual indicator (e.g., faded row or “Completed” badge) when shown in lists?  
2. Should the progress bar on the category card display the exact percentage number or only a visual bar?  
3. Should scenarios within a category be sorted automatically (e.g., alphabetically or by last updated)?  

---

