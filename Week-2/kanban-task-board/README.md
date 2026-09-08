# Kanban Task Board - Day 1

## Project setup

- Set up frontend and backend applications with a clean, scalable folder structure
- Configured the database and environment variables
- Established frontend-backend communication
- Initialized Git with a proper initial repository structure

## Database design

- Created User model — ID, name, email, password, created/updated timestamps
- Created Task model — ID, title, description, status, priority, owner ID, created/updated timestamps
- Defined the one-to-many relationship between users and their tasks

## Authentication

- Implemented user registration and login
- Passwords are hashed before storage — never stored as plain text
- Added token/session generation on login and a working logout flow
- Added validation for inputs, duplicate email handling, and invalid credential handling

## Protected routes

- Built authentication middleware to guard task-related endpoints
- Only authenticated users can access their own task data
- Unauthenticated requests return proper error responses instead of data
- Verified one user cannot access another user's tasks

## Basic Kanban board UI

- Built the three columns — To Do, In Progress, Done
- Created a basic task-card component showing title and priority
- Added a navigation/header showing the logged-in user's info
- Added a logout action
- Drag-and-drop intentionally deferred to a later day

## Authentication testing

- Verified new user registration works end-to-end
- Verified existing users can log in
- Confirmed incorrect credentials are rejected
- Confirmed passwords are stored securely (hashed, not plain text)
- Confirmed unauthenticated users are blocked from protected APIs
- Confirmed authenticated users can access their own resources only
- Confirmed cross-user task access is prevented

The foundation is in place: working frontend and backend, database and models, full auth flow (register/login/logout), protected routes with middleware and a basic Kanban UI.

# Kanban Task Board - Day 2

## Task creation

- Built a task creation form `CreateTaskModal.tsx` with title, description, status, priority, and due date fields
- Required-field validation on title, with inline error messaging
- New tasks default to status "To Do" (enforced server-side via the `Task` schema default)
- Tasks are saved to the database and automatically associated with the authenticated user via `owner`
- Success and error feedback shown via a toast notification `Toast.tsx`

## Database updates

- Extended the Task model `server/models/Task.js` with `dueDate` and `assignedUser` fields

## Displaying tasks on the board

- Replaced mock data with a real fetch to `GET /api/tasks` on page load
- Tasks render in their correct column (To Do / In Progress / Done) based on status
- Each task card `TaskCard.tsx` shows title, priority, description preview, and due date when available
- Empty columns display a "No tasks yet" message instead of appearing broken
- Loading state shown while the initial fetch is in progress

## Updating tasks

- Built an edit form `EditTaskModal.tsx`, pre-filled with the task's current values
- Users can update title, description, priority, due date, and status
- Ownership is enforced server-side, a user can only update their own tasks
- Changes are reflected immediately in the UI and persist after a page refresh

## Deleting tasks

- Added a delete action to each task card, visible on hover
- A confirmation prompt is required before deletion
- Ownership is enforced server-side, same pattern as update

## Moving tasks between columns

- Status changes are handled through the same edit form used for Task 3, via its status dropdown
- Updating status through `updateTask` moves the task to its new column, updates the database, and persists after refresh
- Drag-and-drop was deferred as a future enhancement

## Task API

Completed the full REST surface for tasks (`server/routes/taskRoutes.js`, `server/controllers/taskController.js`), all behind the `protect` middleware (`server/middleware/authMiddleware.js`):

- `POST /api/tasks` — create
- `GET /api/tasks` — list the authenticated user's tasks
- `GET /api/tasks/:id` — fetch one task, ownership-checked
- `PUT /api/tasks/:id` — update, ownership-checked
- `DELETE /api/tasks/:id` — delete, ownership-checked
- Input validation, proper status codes (200/201/400/403/404/500), and consistent error responses across all five endpoints

## Day 2 testing

- Verified task creation via the UI form and confirmed the task appears in the correct column
- Verified tasks fetched from the API display correctly on page load
- Verified editing a task updates its fields and reflects immediately on the board
- Verified task deletion removes the task from both the database and the UI
- Verified status changes move a task between columns and persist after refresh
- Verified cross-user protection on update and delete — a second user receives `403` when attempting to modify another user's task, and the task remains unchanged
- Verified invalid/incomplete task data is rejected with an appropriate error response
- Verified unauthenticated requests to all task endpoints are blocked

Day 2 is complete: authenticated users can create, view, edit, delete, and move tasks between columns, with all changes persisted to the database and protected by ownership checks throughout.
