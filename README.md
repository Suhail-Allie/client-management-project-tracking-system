# Client Management & Project Tracking System

**Module:** XISD6329 – Work Integrated Learning  
**Organisation:** Web App Solutions  
**Developer:** Mogammad Suhail Allie  
**Student number:** ST10455559  
**Repository:** [GitHub – Client Management & Project Tracking System](https://github.com/Suhail-Allie/client-management-project-tracking-system)  
**Original design prototype:** [Figma](https://www.figma.com/make/VrOgp6DmVXeABOlRKGIwq7/System-creation-request?t=HrdYtSWpg4tODwnU-1&preview-route=%2Flogin)

> This project develops the original planning and Figma prototype into a web-based client and project management system, supported by an Android application, a shared REST API and a PostgreSQL database.

## 1. Project overview and purpose

The Client Management & Project Tracking System was developed for Web App Solutions as part of the XISD6329 Work Integrated Learning project. The project addresses the difficulty of managing client information, project progress, milestones, documents, invoices, payments and communication across separate platforms and manual processes.

The purpose of the system is to bring these activities together in one central platform. The website provides the main management interface, while the Android application gives users mobile access to selected core functions. Both clients use the same backend API and central database so that they work with a shared source of information.

The project began with requirements, sitemaps and wireframes prepared during the planning and design stages. The later implementation converted that foundation into a functioning web and Android solution.

## 2. Main features

### Web application

The web application provides the broader management interface. Its main areas include:

- Dashboard and project overview.
- Client management and client details.
- Project management and project details.
- Milestone and project-progress tracking.
- Document management, including file upload, download and deletion.
- Invoice and payment information.
- Reports and analytics.
- Notifications.
- User management, profile and settings.
- Search, filtering and form validation.

### Android application

The Android application was developed using Kotlin and Jetpack Compose. The implemented areas documented for this version are:

- Login and authentication.
- Dashboard.
- Projects.
- Notifications.
- Settings, including theme preferences.

The Android application communicates with the shared REST API. The mobile application is intended to provide quick access to important project information rather than duplicate every administrative function available on the website.

### Shared system services

- Registration and email/password authentication through Supabase Auth.
- Google Sign-In configuration through Supabase, including the Android callback URI.
- Protected API functionality and role-aware access checks.
- PostgreSQL data storage.
- Private project-document storage through Supabase Storage.
- Hosted backend API on Render.

## 3. Design considerations

The system was designed around the different responsibilities of its intended users. The planned roles are Administrator, Developer, Finance Manager and Client. Access to information and functions is intended to reflect each user's responsibilities.

The website is the main interface for detailed administration, while the Android application uses a simpler mobile layout for selected functions. The web interface uses HTML, CSS and JavaScript, and the Android interface uses Jetpack Compose and Material 3.

The implementation also considers the following:

- **Consistency:** The website and Android application use the same backend API and database.
- **Usability:** Main functions are organised into separate areas so users can find the information they need.
- **Responsive access:** The website is designed to adapt to different screen sizes, while the Android application provides a mobile-specific interface.
- **Validation and error handling:** The user interface includes validation and error handling intended to prevent invalid inputs from causing the application to crash.
- **Security:** Authentication, protected API routes, role-aware checks and database Row Level Security help control access.
- **Document privacy:** Project files are stored in a private bucket and downloads use temporary signed URLs instead of making the bucket public.

## 4. System architecture

The application follows a client-server structure. The web application and Android application send requests to the Node.js and Express REST API. The backend communicates with PostgreSQL and the Supabase services.

```text
Web Application  ---------\
                           \
                            >  Node.js / Express REST API  -----> PostgreSQL
                           /                 |
Android Application -----/                  +-----> Supabase Auth
                                              +-----> Supabase Storage

                           Backend hosted on Render
```

The client applications do not need direct access to server-side database credentials. The API handles requests and protected operations, while the database stores structured application information and Supabase Storage holds the actual uploaded files.

## 5. Technologies used

| Area | Technology |
|---|---|
| Web application | HTML5, CSS3, JavaScript |
| Android application | Kotlin, Android Studio, Jetpack Compose, Material 3 |
| Android API communication | Retrofit, OkHttp and JSON serialization |
| Backend | Node.js and Express.js |
| API | REST API |
| Database | PostgreSQL through Supabase |
| Authentication | Supabase Auth, email/password and Google Sign-In configuration |
| File storage | Supabase Storage |
| Version control | Git and GitHub |
| Continuous integration | GitHub Actions |
| Project management | Azure DevOps Boards / Kanban |
| Backend hosting | Render |
| Android build system | Gradle |

## 6. Database structure

The PostgreSQL database contains nine main tables:

| Table | Records documented for Task 2 |
|---|---:|
| `profiles` | 10 |
| `clients` | 11 |
| `projects` | 10 |
| `milestones` | 10 |
| `documents` | 10 |
| `invoices` | 10 |
| `payments` | 10 |
| `notifications` | 10 |
| `user_settings` | 10 |

The tables use identifiers and relationships to connect related records. Row Level Security (RLS) is enabled on the nine core tables. The actual file contents are stored in the private `project-documents` Supabase Storage bucket, while PostgreSQL stores document metadata such as the file name, project, storage path, file type, size, description, visibility and uploader.

## 7. Authentication and security

The system uses Supabase Auth for user registration and email/password authentication. Google Sign-In is configured through Supabase. The Android application uses the following callback URI:

```text
com.webappsolutions.clientmanagement://login-callback
```

Protected API routes require an authenticated user, and role-aware checks are used for protected functionality. Database Row Level Security is enabled on the core tables. Server-side credentials must remain in the backend environment and must never be committed to the repository or embedded in the web or Android client.

The `project-documents` bucket is private. The document workflow checks file type, size, project and permissions before upload. The documented maximum upload size is 10 MB. Supported file types include PDF, DOC, DOCX, XLS, XLSX, ZIP, PNG, JPG and JPEG. Downloads use temporary signed URLs.

## 8. REST API and deployment

The backend is hosted on Render. The deployed API base URL is:

```text
https://client-management-api-14cs.onrender.com
```

The following health endpoints are available for checking the hosted service:

| Purpose | Endpoint |
|---|---|
| Application health | [Application health](https://client-management-api-14cs.onrender.com/api/v1/health) |
| Database health | [Database health](https://client-management-api-14cs.onrender.com/api/v1/health/db) |
| Authentication configuration health | [Authentication health](https://client-management-api-14cs.onrender.com/api/v1/health/auth) |

The API supports the main system areas, including clients, projects, milestones, documents, invoices, payments, notifications and settings.

## 9. GitHub and continuous integration

GitHub is used to store the project's source code and maintain its version history. Changes are committed to the repository so that the development work can be tracked.

GitHub Actions is configured to run checks when changes are pushed to `main` or when a pull request targets `main`. The Task 2 workflow contains three jobs:

1. **Frontend automated tests** – runs the Node.js test suite.
2. **Backend syntax checks** – checks JavaScript files in `backend/src` using `node --check`.
3. **Android tests and build** – uses JDK 17 and runs the Gradle tests and debug build.

The documented frontend test run completed with 10 tests passing and no failures. The Task 2 report also records a successful GitHub Actions run for the frontend, backend syntax and Android jobs.

The root frontend test command is:

```bash
npm test
```

The Android CI build command is:

```bash
cd Android
./gradlew test assembleDebug
```

On Windows PowerShell, use:

```powershell
cd Android
.\gradlew.bat test assembleDebug
```

## 10. Project structure

The repository contains the web application, backend, Android source code, automated tests and GitHub Actions workflow. The main areas are organised as follows:

```text
client-management-project-tracking-system/
|
|-- web/                       Web application files
|-- backend/
|   `-- src/                   Node.js / Express API source
|-- Android/                   Kotlin Android application
|-- tests/
|   `-- site.test.js           Frontend automated tests
|-- .github/
|   `-- workflows/             GitHub Actions workflow
|-- package.json               Root test command
`-- README.md
```

The complete Kotlin source code is maintained in the `Android/` directory of the GitHub repository.

## 11. Running and testing the project

### Requirements

- Git.
- Node.js and npm.
- Android Studio and a compatible Android SDK.
- JDK 17 for the documented Android CI configuration.
- Access to the configured Supabase project for database, authentication and storage services.

### Get the source code

```bash
git clone https://github.com/Suhail-Allie/client-management-project-tracking-system.git
cd client-management-project-tracking-system
```

### Web application

Serve the `web/` directory using a local static web server or the development server used for the project, then open the website in a browser. The web application must be configured to use the intended API base URL.

### Backend

Install the backend dependencies from the `backend/` directory and configure the required environment variables for the database and Supabase services. Use the start or development script defined in the backend's `package.json` to run the API.

Keep local environment files and all secrets out of GitHub. Do not place database passwords, service-role keys, JWT secrets or OAuth client secrets in the README or frontend source code.

### Android application

Open the `Android/` directory in Android Studio, allow Gradle to sync, and configure the application to use the intended API base URL. Build and run the application on a physical Android device for device testing.

### Automated tests

Run the frontend tests from the repository root:

```bash
npm test
```

Run the Android tests and debug build from the `Android/` directory:

```bash
./gradlew test assembleDebug
```

GitHub Actions runs the configured frontend, backend syntax and Android checks automatically for the relevant repository events.

## 12. Screenshots

Screenshots should be committed to the repository so that they display when someone visits this README. Create a `docs/screenshots/` folder and add the corresponding image files before submitting the final version.

Suggested screenshots:

![Web application dashboard](docs/screenshots/web-dashboard.png)

*Figure 1: Web application dashboard.*

![Web application project management](docs/screenshots/web-projects.png)

*Figure 2: Web application project management.*

![Android application on a physical device](docs/screenshots/android-dashboard.jpg)

*Figure 3: Android application running on a physical device.*

![Android settings screen](docs/screenshots/android-settings.jpg)

*Figure 4: Android application settings.*

![Document management screen](docs/screenshots/document-management.png)

*Figure 5: Project document management.*

## 13. Demonstration video

The project demonstration should show the website and Android application, explain the main features, and include a voice-over. It should also demonstrate the hosted API and relevant database/authentication information without exposing passwords, tokens or secret keys.

**Video link:** [Add the unlisted demonstration video URL here](ADD_VIDEO_URL_HERE)

Replace the placeholder with the final accessible video URL before submitting Part 3.

## 14. User support and documentation

A User Support & Help Guide was prepared for Task 2. It explains the system overview, getting started, dashboard, clients and projects, milestones, documents, invoices and payments, notifications, settings, logout, invalid input handling, security, troubleshooting and support escalation.

The Task 2 implementation report also contains technical information about the application architecture, database, authentication, document storage, API, Android application, testing and deployment.

## 15. Azure DevOps

Azure DevOps was used to document the implementation work through a project called **Client Management Project Tracking System**. User Stories and supporting Tasks were created for the main system areas, and a saved query named **Task 2 - Completed Work Items** was used to display completed work.

The Azure DevOps project was set up after much of the development had already taken place. It was therefore used to record the completed implementation rather than presented as if the entire development process had originally been tracked there from the beginning.

## 16. Release notes – changes since the original prototype

### Task 2 final implementation (submission milestone)

This version moves the project beyond the original Figma design and Task 1 frontend prototype. The main additions and improvements documented for Task 2 are:

- Developed the website into an application connected to the backend REST API for implemented system functions.
- Added a Node.js and Express backend to handle application requests and protected operations.
- Implemented a PostgreSQL database with nine related tables for profiles, clients, projects, milestones, documents, invoices, payments, notifications and user settings.
- Added Supabase Auth for registration and email/password login, with Google Sign-In configured through Supabase.
- Added role-aware access checks and enabled Row Level Security on the nine core database tables.
- Developed the Android application using Kotlin, Jetpack Compose and Material 3, with login, dashboard, projects, notifications and settings.
- Added private document uploads to Supabase Storage, including document metadata in PostgreSQL, file validation and temporary signed download URLs.
- Added a hosted backend deployment on Render and health endpoints for the application, database and authentication configuration.
- Expanded GitHub Actions to run frontend tests, backend JavaScript syntax checks, and Android tests and builds.
- Added application settings and theme switching, plus user support and technical documentation.
- Added Azure DevOps User Stories, supporting Tasks and a completed-work query to document project work.

### Innovative features added beyond the prototype

The main additions that moved the project beyond a static prototype were the shared backend used by the website and Android client, authenticated API access, a relational database, private document storage with signed downloads, Google Sign-In configuration, and automated checks across the frontend, backend and Android project.

## 17. Google Play publication preparation

The Android source code is maintained in the GitHub repository. The final Google Play publication evidence must be added after the release build has been signed and the app has been prepared or uploaded in Google Play Console.

For the final WIL submission, include the signed release APK or appropriate release artifact, publication screenshots and a screenshot showing the application uploaded to a Google Play Console testing track or published, as applicable. A debug APK alone should not be described as a signed Play Store release.

**Publication evidence:** Add the signed release build and Google Play Console screenshots once completed. Do not upload signing keys, passwords or private credentials to GitHub.

## 18. References and technical documentation

- Android Developers – [Jetpack Compose](https://developer.android.com/compose)
- Android Developers – [Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3)
- Express – [Express documentation](https://expressjs.com/)
- GitHub – [GitHub Actions documentation](https://docs.github.com/en/actions)
- Node.js – [Node.js documentation](https://nodejs.org/docs/latest/api/)
- PostgreSQL – [PostgreSQL documentation](https://www.postgresql.org/docs/)
- Render – [Render documentation](https://render.com/docs)
- Supabase – [Supabase documentation](https://supabase.com/docs)
- Square – [Retrofit](https://github.com/square/retrofit)

---

**Note:** This README describes the implementation documented for the XISD6329 Task 2 submission. Before the final Task 3 submission, replace the video placeholder, add the actual screenshot files, and update the Google Play publication section with evidence of the release preparation that has genuinely been completed.
