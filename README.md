# Client Management & Project Tracking System

**Module:** XISD6329 – Work Integrated Learning  
**Organisation:** Web App Solutions  
**Developer:** Mogammad Suhail Allie  
**Student Number:** ST10455559  
**Academic Year:** 2026

**GitHub Repository:** [Client Management & Project Tracking System](https://github.com/Suhail-Allie/client-management-project-tracking-system)

**Original Figma Prototype:** [View Figma Design](https://www.figma.com/make/VrOgp6DmVXeABOlRKGIwq7/System-creation-request?t=HrdYtSWpg4tODwnU-1&preview-route=%2Flogin)

---

## 1. Project Overview

The Client Management & Project Tracking System was developed for Web App Solutions as part of the XISD6329 Work Integrated Learning project.

The system was created to provide a central platform for managing client information, projects, milestones, documents, invoices, payments, reports, notifications and system users.

The project originally started during XISD5319, where the requirements, system structure and initial Figma prototype were prepared. During XISD6329, the project progressed from the planning and prototype stage into the actual development and implementation of a website, Android application, REST API and relational database.

The final solution consists of a web application and an Android application that communicate with a shared backend API and PostgreSQL database.

The main purpose is to reduce the need for managing important client and project information across separate platforms and manual processes.

## 2. Problem Statement

Web App Solutions identified difficulties with managing client and project information using disconnected communication platforms, documents and manual methods.

Some of the main problems included:

- Client information being spread across different locations.
- Difficulty tracking project progress and milestones.
- Project documents being stored separately.
- Difficulty monitoring invoices and payments.
- Limited access to organised project information and reporting.

The system addresses these problems by bringing the main management functions into one central platform.

## 3. Project Objectives

The main objectives of the project were to:

- Develop the original Figma prototype into a working website.
- Develop an Android application to provide mobile access to important system functions.
- Create a shared backend API for the website and Android application.
- Implement a relational PostgreSQL database.
- Introduce secure authentication and role-aware access control.
- Implement project and milestone management.
- Provide document upload and storage functionality.
- Support invoice and payment management.
- Introduce automated testing and continuous integration.
- Use GitHub for source-code management.
- Use Azure DevOps to support project lifecycle management.
- Prepare technical documentation and user support information.

## 4. Main Application Features

### 4.1 Web Application

The website provides the main management interface and supports the more detailed administrative functions.

The implemented website areas include:

- Login and authentication.
- Dashboard and project overview.
- Client management.
- Client details.
- Project management.
- Project details.
- Milestone management.
- Document management.
- Invoice management.
- Payment information.
- Reports and analytics.
- Notifications.
- User management.
- Profile and settings.
- Search and filtering.
- Frontend form validation.
- PDF report printing.
- CSV report export.

### 4.2 Android Application

The Android application was developed using Kotlin, Android Studio and Jetpack Compose.

The main implemented areas include:

- Login and authentication.
- Dashboard.
- Project listing.
- Notifications.
- User settings.
- Theme preferences.

The Android application communicates with the same REST API used by the website. This allows mobile users to access selected project information and application functions through a mobile interface.

The Android application focuses on the core mobile functionality implemented for this project rather than duplicating every administrative feature of the website.

### 4.3 User Roles

The system was designed around four main user roles:

| Role | Main responsibilities |
|---|---|
| Administrator | Overall system and user management |
| Developer | Assigned projects, milestones and project documents |
| Finance Manager | Invoices, payments and financial information |
| Client | Access to their own projects and related information |

Role-aware access checks are implemented for protected functionality so that users can access information relevant to their responsibilities.

## 5. Design Considerations

The website and Android application were designed around the needs of the different users.

The website provides the main administrative interface, while the Android application provides a simplified layout suitable for mobile devices.

The following considerations were taken into account:

**Usability:** Main functions are organised into separate sections to make navigation easier.

**Consistency:** Both applications communicate with the same backend and database.

**Responsive design:** The website uses responsive layouts, while the Android application uses a mobile-specific interface.

**User experience:** The interfaces are designed to make project information and important application functions easy to access.

**Security:** Authentication, protected API routes and Row Level Security help control access to system information.

**Validation:** User input is checked to help prevent invalid information from being submitted.

**Document privacy:** Uploaded project files are stored in a private storage bucket and downloaded using temporary signed URLs.

## 6. System Architecture

The system uses a client-server architecture.

The website and Android application communicate with the Node.js and Express REST API. The backend then communicates with PostgreSQL and the Supabase services.

The general architecture is:

```text
             WEB APPLICATION
                    |
                    |
                    v
             REST API
          Node.js / Express
                    |
          +---------+----------+
          |         |          |
          v         v          v
      PostgreSQL  Supabase   Supabase
       Database     Auth     Storage
          ^
          |
          |
      ANDROID
     APPLICATION

      Backend hosted on Render
```

The website and Android application do not directly access the database using server-side credentials. Requests are handled through the backend API and the relevant Supabase services.

This allows the applications to use shared system functionality and data.

## 7. Technologies Used

| Area | Technology |
|---|---|
| Website structure | HTML5 |
| Website styling | CSS3 |
| Website functionality | JavaScript |
| Android application | Kotlin |
| Android UI | Jetpack Compose |
| Android design system | Material 3 |
| Android development | Android Studio |
| Android API communication | Retrofit and OkHttp |
| Backend | Node.js |
| Backend framework | Express.js |
| API | REST API |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| File storage | Supabase Storage |
| Version control | Git and GitHub |
| Automated testing | Node.js Test Runner |
| Continuous Integration | GitHub Actions |
| Project management | Azure DevOps |
| Backend hosting | Render |
| UI/UX design | Figma |
| Build system | Gradle |

## 8. Database Implementation

The system uses PostgreSQL through Supabase.

The database contains nine main tables:

| Database Table | Records |
|---|---:|
| profiles | 10 |
| clients | 11 |
| projects | 10 |
| milestones | 10 |
| documents | 10 |
| invoices | 10 |
| payments | 10 |
| notifications | 10 |
| user_settings | 10 |

The database uses UUIDs for the main records and relationships between related entities.

Indexes and constraints are used to support the database structure and data relationships.

Row Level Security (RLS) is enabled on all nine core tables.

The database stores structured system information, while uploaded project files are stored separately through Supabase Storage.

## 9. Authentication and Security

Authentication is handled through Supabase Auth.

The system supports:

- User registration.
- Email and password authentication.
- Protected application access.
- Google Sign-In configuration.
- Role-aware access checks.
- Database Row Level Security.

Google Single Sign-On is configured through Supabase.

The Android application uses the following authentication callback URI:

```text
com.webappsolutions.clientmanagement://login-callback
```

Server-side credentials are kept outside the frontend applications and must remain private.

Passwords, Supabase service-role keys, database credentials, JWT secrets and Google OAuth client secrets must never be committed to GitHub.

## 10. REST API and Backend

The backend was developed using Node.js and Express.

The REST API provides the communication layer between the web application, Android application and backend services.

The API supports the main system areas, including:

- Clients.
- Projects.
- Milestones.
- Documents.
- Invoices.
- Payments.
- Notifications.
- User settings.
- Authentication and protected operations.

The backend is hosted through Render.

### Hosted API

**Base URL:**

https://client-management-api-14cs.onrender.com

The following health endpoints are available:

| Endpoint | Purpose |
|---|---|
| `/api/v1/health` | Application health |
| `/api/v1/health/db` | PostgreSQL database connection |
| `/api/v1/health/auth` | Authentication configuration |

The health endpoints are useful for checking whether the deployed backend and connected services are operating correctly.

## 11. Document Management and Storage

One of the important additions to the original prototype was the implementation of actual document storage.

The system uses two services:

**PostgreSQL:** Stores document information, including the file name, project, storage path, file type, size, description, visibility and uploader.

**Supabase Storage:** Stores the actual uploaded document files.

The private storage bucket is called:

```text
project-documents
```

The document management functionality includes:

- File uploads.
- File validation.
- Project association.
- Document descriptions.
- Visibility settings.
- File downloads.
- Document deletion.

The maximum documented file size is 10 MB.

Supported file types include:

- PDF
- DOC
- DOCX
- XLS
- XLSX
- ZIP
- PNG
- JPG
- JPEG

Downloads use temporary signed URLs, which means the storage bucket does not need to be publicly accessible.

## 12. GitHub and Version Control

GitHub is used to store and manage the project's source code.

Repository:

https://github.com/Suhail-Allie/client-management-project-tracking-system

GitHub was used throughout development to:

- Maintain the project source code.
- Track changes through commits.
- Maintain the main development branch.
- Store the website and backend code.
- Store the Kotlin Android application.
- Maintain automated testing files.
- Configure GitHub Actions.

The repository contains the source code required to review and continue development of the system.

## 13. GitHub Actions and Continuous Integration

GitHub Actions is used to automate checks whenever changes are pushed to the main branch or when a pull request targets the main branch.

The Task 2 workflow contains three jobs.

### Frontend Automated Tests

Runs the Node.js automated frontend test suite.

The tests check:

- Required website files.
- HTML page structure.
- Internal links.
- CSS and JavaScript files.
- JavaScript syntax.

The final documented local test run completed with:

**10 tests passed and 0 failures.**

### Backend Syntax Checks

Checks JavaScript files within the backend source directory using:

```bash
node --check
```

This helps identify syntax errors in the backend code.

### Android Tests and Build

The workflow uses JDK 17 and runs:

```bash
./gradlew test assembleDebug
```

This checks the Android tests and creates a debug build.

The documented GitHub Actions run completed successfully across all three jobs.

GitHub Actions helped provide a separate environment for checking the project instead of relying only on the development computer.

## 14. Testing and Verification

Testing was carried out throughout the project.

The Task 2 testing documentation recorded the following results:

| Test | Description | Result |
|---|---|---|
| T01 | Frontend automated test suite | Passed |
| T02 | JavaScript syntax validation | Passed |
| T03 | Android debug build | Passed |
| T04 | Android tests through CI | Passed |
| T05 | Backend syntax checks through CI | Passed |
| T06 | GitHub Actions frontend tests | Passed |
| T07 | Hosted API health | Passed |
| T08 | Hosted database health | Passed |
| T09 | Authentication and protected access | Passed |
| T10 | Android physical-device functionality | Passed |
| T11 | Document storage workflow | Passed |
| T12 | Theme and settings functionality | Passed |

The Android application was tested on a physical Android device.

The main Android areas verified included authentication, Projects, Notifications and Settings.

### Development issue encountered

One issue during local Android testing involved the Windows Java environment and a malformed PATH configuration.

The Gradle unit-test process initially failed because of the environment configuration. I investigated the Java installations and corrected the local configuration.

The Android debug build was successful, and the Android tests and build were also verified through GitHub Actions.

This helped demonstrate the importance of testing in different environments.

## 15. Azure DevOps

Azure DevOps was used to document the project implementation through a project called:

**Client Management Project Tracking System**

The project contains User Stories and supporting Tasks covering the main system areas.

The completed work was organised using the Closed status, and a saved query was created called:

```text
Task 2 - Completed Work Items
```

The Azure DevOps project was created after much of the development work had already been completed. It was therefore used to document the completed implementation rather than claiming that all development activities had originally been tracked there from the beginning.

## 16. User Support and Documentation

A User Support & Help Guide was prepared to help users understand how to use the system.

The guide covers:

- System overview.
- Getting started.
- Login and authentication.
- Dashboard navigation.
- Clients and projects.
- Milestones and project tracking.
- Document management.
- Invoices and payments.
- Notifications.
- User settings.
- Logout.
- Invalid input handling.
- Security and safe use.
- Troubleshooting.
- Support and escalation.

Technical documentation was also prepared to explain the system architecture, database, authentication, storage, API, Android application, testing and deployment.

## 17. Project Structure

The repository is organised into separate areas for the website, backend, Android application, automated tests and GitHub Actions.

The main project structure is:

```text
client-management-project-tracking-system/
│
├── web/
│   ├── assets/
│   │   ├── icons/
│   │   └── images/
│   │
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   └── app.js
│   │
│   ├── pages/
│   │   ├── dashboard.html
│   │   ├── clients.html
│   │   ├── client-details.html
│   │   ├── projects.html
│   │   ├── project-details.html
│   │   ├── milestones.html
│   │   ├── documents.html
│   │   ├── invoices.html
│   │   ├── reports.html
│   │   ├── notifications.html
│   │   ├── users.html
│   │   └── profile.html
│   │
│   └── index.html
│
├── backend/
│   └── src/
│       ├── routes/
│       ├── middleware/
│       └── configuration and server files
│
├── Android/
│   └── app/
│       └── src/
│           └── main/
│
├── tests/
│   └── site.test.js
│
├── .github/
│   └── workflows/
│
├── package.json
├── CHANGELOG.md
└── README.md
```

The complete Kotlin source code is maintained in the `Android/` directory.

## 18. Installation and Setup

### 18.1 Requirements

The following software and services are required to work with the project:

- Git.
- Node.js and npm.
- Android Studio.
- Kotlin and Android SDK.
- Gradle.
- Access to the configured Supabase project.
- Access to the configured backend environment.

### 18.2 Clone the Repository

Run the following command:

```bash
git clone https://github.com/Suhail-Allie/client-management-project-tracking-system.git
```

Move into the project directory:

```bash
cd client-management-project-tracking-system
```

### 18.3 Web Application

The website files are stored in the `web/` directory.

Open the project using Visual Studio Code or another suitable development environment.

The website can be served using a local development server, such as the Live Server extension in Visual Studio Code.

Open:

```text
web/index.html
```

The web application must be configured to communicate with the intended backend API.

### 18.4 Backend

The backend source code is located in the `backend/` directory.

Install the backend dependencies using npm from the backend directory:

```bash
cd backend
npm install
```

Configure the environment variables required by the backend for the database and Supabase services.

Use the start or development script defined in the backend's `package.json` to run the API.

Do not commit local environment files or secrets to GitHub.

### 18.5 Android Application

Open Android Studio.

Select **Open Project** and choose the `Android/` directory.

Allow Gradle to sync and resolve the project dependencies.

Configure the application to use the correct API base URL.

The application can then be built and run on a physical Android device.

### 18.6 Frontend Automated Tests

From the root project directory, run:

```bash
npm test
```

This executes the automated frontend test suite.

### 18.7 Android Tests and Build

Open a terminal inside the `Android/` directory.

For Windows PowerShell:

```powershell
.\gradlew.bat test assembleDebug
```

For Linux or macOS:

```bash
./gradlew test assembleDebug
```

GitHub Actions also runs the configured Android tests and build automatically.

## 19. Android Release Build and Publication Preparation

The Android application has been configured with the following application details:

| Setting | Value |
|---|---|
| Application ID | `com.webappsolutions.clientmanagement` |
| Namespace | `com.webappsolutions.clientmanagement` |
| Compile SDK | 36 |
| Target SDK | 36 |
| Minimum SDK | 26 |
| Version Code | 1 |
| Version Name | 1.0 |

A signed Android App Bundle (`.aab`) and signed release APK (`.apk`) were successfully generated using Android Studio and the release build variant.

The signing keystore is stored outside the GitHub repository and should remain private.

The generated release files provide evidence that the application can be prepared as a signed Android release build.

**Google Play publication status:** The application was not uploaded to Google Play Console or publicly published. Google Play developer registration was not completed because of the additional registration cost.

No Google Play publication is claimed in this project.

## 20. Screenshots

Screenshots are included to demonstrate the website, Android application and supporting project functionality.

The following screenshot folder should be maintained in the repository:

```text
docs/
└── screenshots/
    ├── web-login.png
    ├── web-dashboard.png
    ├── web-clients.png
    ├── web-projects.png
    ├── web-milestones.png
    ├── web-documents.png
    ├── android-dashboard.jpg
    ├── android-settings.jpg
    ├── supabase-storage.png
    ├── github-actions.png
    └── azure-devops.png
```

### Web Application

![Web application dashboard](docs/screenshots/web-dashboard.png)

*Figure 1: Main website dashboard.*

![Client management](docs/screenshots/web-clients.png)

*Figure 2: Client management interface.*

![Project management](docs/screenshots/web-projects.png)

*Figure 3: Project management interface.*

![Milestone management](docs/screenshots/web-milestones.png)

*Figure 4: Project milestone tracking.*

![Document management](docs/screenshots/web-documents.png)

*Figure 5: Document management.*

### Android Application

![Android dashboard](docs/screenshots/android-dashboard.jpg)

*Figure 6: Android application dashboard on a physical device.*

![Android settings](docs/screenshots/android-settings.jpg)

*Figure 7: Android application settings.*

### Supporting Services

![Supabase storage](docs/screenshots/supabase-storage.png)

*Figure 8: Private Supabase document storage.*

![GitHub Actions](docs/screenshots/github-actions.png)

*Figure 9: GitHub Actions automated workflow.*

![Azure DevOps](docs/screenshots/azure-devops.png)

*Figure 10: Azure DevOps project board.*

## 21. Demonstration Video

A demonstration video was prepared to show the main functionality of the Client Management & Project Tracking System.

The presentation covers the website, Android application, backend/API, supporting services and project management evidence.

The video includes a voice-over explaining the system and its functionality.

**Demonstration Video:** [Watch the project demonstration]

## 22. Release Notes

The release notes are maintained separately in:

[CHANGELOG.md](CHANGELOG.md)

The release notes document the development of the application from the original Figma prototype and Task 1 frontend into the Task 2 implementation.

The main additions include:

- Shared Node.js and Express REST API.
- PostgreSQL database integration.
- Supabase authentication.
- Google Sign-In configuration.
- Android application developed using Kotlin and Jetpack Compose.
- Private Supabase document storage.
- Document upload, download and deletion.
- Project and milestone management.
- Application settings and theme switching.
- Expanded GitHub Actions workflow.
- Render backend deployment.
- Azure DevOps project management evidence.
- User help and technical documentation.

The most important additions beyond the original prototype were the shared backend, persistent relational database, authentication, private document storage, Android application and automated testing workflow.

## 23. References and Technical Documentation

The following official resources were used as technical references during development:

- Android Developers. [Jetpack Compose](https://developer.android.com/compose).
- Android Developers. [Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3).
- Express.js. [Express Documentation](https://expressjs.com/).
- GitHub. [GitHub Actions Documentation](https://docs.github.com/en/actions).
- Node.js. [Node.js Documentation](https://nodejs.org/docs/latest/api/).
- PostgreSQL. [PostgreSQL Documentation](https://www.postgresql.org/docs/).
- Render. [Render Documentation](https://render.com/docs).
- Supabase. [Supabase Documentation](https://supabase.com/docs).
- Square. [Retrofit](https://github.com/square/retrofit).

---

## 24. Project Status

The XISD6329 Client Management & Project Tracking System progressed from an initial planning and design prototype into a web and Android solution supported by a shared backend and PostgreSQL database.

The project includes authentication, project management, document storage, automated testing, CI configuration, backend hosting and supporting documentation.

The implementation and testing evidence is documented in the Work Integrated Learning submission.

**Project:** Client Management & Project Tracking System  
**Organisation:** Web App Solutions  
**Module:** XISD6329 – Work Integrated Learning  
**Developer:** Mogammad Suhail Allie  
**Student Number:** ST10455559

