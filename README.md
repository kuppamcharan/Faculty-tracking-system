# Faculty Tracking System

A responsive web application for tracking faculty availability and campus location in real time. The system helps students find assigned faculty members on campus, helps faculty manage live location sharing during college hours, and gives administrators a central place to manage users and college branding.

## Project Overview

Faculty Tracking System is built as a React single-page application using Firebase Authentication and Cloud Firestore. It uses browser geolocation, campus boundary checks, and Leaflet maps to show live faculty positions inside a defined campus area.

The app supports three main roles:

- **Students** can log in and view active faculty assigned to their branch and year.
- **Faculty** can enable or pause live tracking, manage assigned classes, and view colleague locations.
- **Admins** can view user statistics, update college branding, and manage user roles.

## Key Features

- Email/password registration and login with Firebase Authentication
- Role-based routing for student, faculty, and admin dashboards
- Live faculty location updates stored in Firestore
- Campus-aware location status such as building name, walking on campus, or out of campus
- Leaflet map view with satellite and label tile layers
- Faculty class assignment management by branch, year, and section
- Student dashboard filtered to relevant assigned faculty
- Admin dashboard for user counts, live-location count, branding settings, and role updates
- Firebase Hosting configuration for single-page app deployment

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite |
| Routing | React Router |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Maps | Leaflet, React Leaflet |
| Deployment | Firebase Hosting |
| Quality | ESLint |

## Repository Structure

```text
faculty-tracker/
|-- public/
|   |-- favicon.svg
|   |-- icons.svg
|-- src/
|   |-- components/
|   |   |-- AdminDashboard.jsx
|   |   |-- Auth.jsx
|   |   |-- FacultyDashboard.jsx
|   |   |-- StudentDashboard.jsx
|   |-- App.jsx
|   |-- firebase.js
|   |-- index.css
|   |-- main.jsx
|-- firebase.json
|-- package.json
|-- package-lock.json
`-- vite.config.js
```

## Getting Started

### Prerequisites

- Node.js
- npm or another compatible package manager
- A Firebase project with Authentication, Firestore, and Hosting enabled

### Installation

```bash
git clone https://github.com/kuppamcharan/Faculty-tracking-system.git
cd Faculty-tracking-system
npm install
```

### Firebase Configuration

The app reads Firebase settings from environment variables instead of storing them directly in source code.

1. Copy the example file:

```bash
cp .env.example .env
```

2. Fill `.env` with the Firebase web app config from your Firebase project settings:

```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Do not commit `.env`. It is ignored by Git so local Firebase values stay out of the public repository.

Required Firebase services:

1. Enable **Authentication** with the Email/Password provider.
2. Create a **Cloud Firestore** database.
3. Enable **Firebase Hosting** if you want to deploy the web app.

Suggested Firestore collections:

| Collection | Purpose |
| --- | --- |
| `users` | Stores profile records, roles, student details, and faculty class assignments |
| `locations` | Stores live faculty location and current campus block |
| `settings/general` | Stores college name and logo URL for shared branding |

Example user document:

```json
{
  "uid": "firebase-auth-user-id",
  "email": "person@example.com",
  "name": "User Name",
  "role": "faculty",
  "empId": "F123",
  "type": "teaching",
  "assigned_classes": [
    {
      "branch": "CSE",
      "year": "3",
      "section": "A"
    }
  ]
}
```

To create the first admin account, register a normal user, then update that user's Firestore document:

```json
{
  "role": "admin"
}
```

After that, the user can log in and access `/admin`.
## Available Scripts

```bash
npm run dev
```

Starts the local Vite development server.

```bash
npm run build
```

Builds the production app into the `dist/` folder.

```bash
npm run preview
```

Serves the production build locally for preview.

```bash
npm run lint
```

Runs ESLint checks across the project.

## Deployment

The project includes Firebase Hosting configuration in [`firebase.json`](firebase.json). Build the app before deploying:

```bash
npm run build
firebase deploy
```

The hosting rewrite sends all routes to `index.html`, which allows direct navigation to routes such as `/admin`, `/faculty`, and `/student`.

## Security Notes

- Firebase web config values are not private secrets; Firestore security rules are what protect application data.
- Configure Firestore rules before production use so users can only access data allowed by their role.
- Consider adding an admin-only backend function for sensitive operations such as deleting Firebase Auth accounts.
- Location sharing should be clearly explained to users and enabled only with browser permission.

## Future Improvements

- Add production Firestore security rules and automated rule tests.
- Move campus zones into a separate GeoJSON file for easier maintenance.
- Add attendance reports and location history exports for administrators.
- Add password reset and email verification flows.
- Improve responsive table layouts for small mobile screens.
- Add automated CI checks for lint and production build.

## License

This repository currently does not declare a license. Add one before distributing or accepting external contributions.



