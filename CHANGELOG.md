# Release Notes

## Client Management & Project Tracking System

**Module:** XISD6329 – Work Integrated Learning  
**Organisation:** Web App Solutions  
**Developer:** Mogammad Suhail Allie  
**Repository:** https://github.com/Suhail-Allie/client-management-project-tracking-system

These release notes describe how the project developed from its original Figma prototype and Task 1 frontend into the implemented system documented for Task 2. They focus on changes that were added to the original prototype, including the main functionality and the features that extend the system beyond a static interface.

---

## Original prototype – planning and design stage

The original prototype established the proposed structure and user experience for a centralised client and project management system. It included the planned areas for login, dashboard, clients, projects, milestones, documents, invoices, reports, notifications, user management and profile settings.

The prototype also established the main user roles: Administrator, Developer, Finance Manager and Client. At this stage, the screens and workflows represented the intended system rather than a fully connected application.

## Task 1 – website frontend foundation

The prototype was developed into a multi-page website frontend using HTML5, CSS3 and JavaScript.

### Updates introduced

- Created the main website pages for the dashboard, client management, client details, projects, project details, milestones, documents, invoices, reports, notifications, user management and profile/settings.
- Added the website navigation and page structure.
- Added responsive layout and navigation behaviour.
- Added frontend interactions, including search and filtering.
- Added form validation on the frontend.
- Added report-related functions, including PDF printing and CSV export.
- Organised the website assets, CSS and JavaScript into a project structure.
- Created and maintained the GitHub repository and project README.
- Introduced a basic Node.js test suite for checking required website files, HTML structure, internal links and JavaScript syntax.
- Added a GitHub Actions workflow to run the frontend checks when changes were pushed to the repository.

### Result of this stage

Task 1 provided a working frontend foundation and a clearer structure for the later backend and Android development. Most information at this stage was presented through the frontend; the complete backend, database persistence, authentication and mobile application were still part of the later implementation work.

## Task 2 – final implementation milestone

Task 2 extended the project beyond the frontend prototype by introducing the backend, database integration, authentication, document storage, Android application and additional automated checks.

### Website and backend updates

- Connected the website to a Node.js and Express REST API for the implemented system functions.
- Added backend routes and authentication middleware for protected operations.
- Implemented API support for the main system areas, including clients, projects, milestones, documents, invoices, payments, notifications and settings.
- Deployed the backend API to Render.
- Added application, database and authentication health endpoints to help verify the hosted service.

### Database updates

- Implemented a PostgreSQL database through Supabase.
- Added nine core tables: `profiles`, `clients`, `projects`, `milestones`, `documents`, `invoices`, `payments`, `notifications` and `user_settings`.
- Added identifiers, relationships, constraints and indexes to organise and support access to the stored records.
- Enabled Row Level Security on the nine core tables.
- Populated each core table with at least ten records for the required test data.

### Authentication and security updates

- Added registration and email/password authentication using Supabase Auth.
- Added protected API access and role-aware checks for the implemented functionality.
- Configured Google Single Sign-On through Supabase.
- Configured the Android authentication callback URI: `com.webappsolutions.clientmanagement://login-callback`.
- Kept server-side service credentials in the backend environment rather than placing them in the frontend or Android application.

### Android application updates

- Developed the Android application using Kotlin, Android Studio, Jetpack Compose and Material 3.
- Added the implemented login, dashboard, projects, notifications and settings areas.
- Integrated API communication using Retrofit and OkHttp.
- Tested the core Android functionality on a physical Android device.

The Android application provides mobile access to selected core functionality. It is not described as having every administrative feature available in the web application.

### Document management and storage updates

- Implemented actual file uploads to a private Supabase Storage bucket named `project-documents`.
- Stored document metadata, including the file name, project, storage path, file type, size, description, visibility and uploader, in PostgreSQL.
- Added file type and file size checks, with a documented maximum upload size of 10 MB.
- Added temporary signed download URLs so that files can be downloaded without making the storage bucket public.
- Added cleanup handling to attempt removal of an uploaded storage object when its database metadata insert fails.
- Added document upload, download and deletion functionality to the web document workflow.

### User settings and usability updates

- Added application settings functionality.
- Added theme switching and verified the settings/theme behaviour during testing.
- Included validation and error handling to reduce the risk of invalid input causing application failures.
- Prepared a user support guide covering the main workflows and basic troubleshooting.

### Testing and DevOps updates

- Retained and used the frontend automated test suite; the documented local run completed with 10 tests passing and no failures.
- Expanded GitHub Actions to include three jobs:
  1. Frontend automated tests.
  2. Backend JavaScript syntax checks.
  3. Android tests and debug build.
- Recorded a successful GitHub Actions run for the three configured jobs.
- Added Azure DevOps User Stories and supporting Tasks to document the main implementation areas.
- Created the `Task 2 - Completed Work Items` query to display completed work.

---

## Innovative features added beyond the original prototype

The following features represent the main additions that moved the project beyond a static design and frontend demonstration:

1. **Shared backend for the web and Android clients** – both applications communicate with a common Node.js and Express REST API, which provides a central point for application operations.
2. **Integrated authentication and protected access** – Supabase Auth supports registration and email/password login, with Google Single Sign-On configured and protected API operations requiring authentication.
3. **Relational database with access controls** – PostgreSQL stores the system records in nine related tables, with Row Level Security enabled on the core tables.
4. **Private project-document storage** – uploaded files are stored in a private Supabase Storage bucket, while PostgreSQL stores their metadata. Temporary signed URLs are used for downloads.
5. **Cross-platform mobile access** – the Android application provides selected project functionality through Kotlin and Jetpack Compose while using the same backend as the website.
6. **Multi-part continuous integration workflow** – GitHub Actions checks the frontend, backend JavaScript syntax and Android tests/build rather than only running the original frontend checks.
7. **Hosted API health checks** – the deployed backend exposes health endpoints for checking the application and its connected services.

## Verification notes

The Task 2 implementation report records the following verification outcomes:

- Frontend automated tests: 10 passed, 0 failed.
- Android debug build: successful.
- GitHub Actions: frontend, backend syntax and Android jobs passed in the documented run.
- Hosted application health check: healthy response recorded.
- Hosted database health check: PostgreSQL connection response recorded.
- Physical Android device: core authentication, Projects, Notifications and Settings functionality verified.
- Document storage: upload, download and delete workflow recorded as verified.

These notes describe the verification recorded in the Task 2 submission. They do not claim that the app has already been published on Google Play.

## Publication status

Google Play publication preparation is a separate Task 3 activity. The signed release build, store listing assets and Google Play Console evidence must be added once those steps have actually been completed. A debug build is not the same as a signed release artifact prepared for Google Play.
