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
- **Validation and error handling:** User input is checked so invalid information can be handled without deliberately crashing the application.
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
