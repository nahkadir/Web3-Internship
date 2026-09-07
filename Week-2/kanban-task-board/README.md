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
