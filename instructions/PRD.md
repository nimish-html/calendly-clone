# Product Requirements Document (PRD)
**Product Name:** Calendlier  

## 1. Overview
Calendlier is a web application designed to simplify meeting scheduling, emulating the core functionalities of Calendly. Users can set their availability, create event types, and share booking links that adapt to the time zones of invitees. The app integrates with Google Calendar to prevent double bookings and generates Google Meet links for scheduled meetings.

## 2. Objectives
- **Simplify Meeting Scheduling:** Allow users to create customizable event types and share booking links.
- **Time Zone Management:** Automatically adjust meeting times based on the invitee's time zone.
- **Calendar Integration:** Sync with Google Calendar to display events and prevent conflicts.
- **User Authentication:** Secure user data and personalize experiences through authentication.
- **Scalable Architecture:** Build a maintainable and scalable codebase using modern technologies.

## 3. Features

### 3.1 Events
- Create, edit, and delete event types.
- Set event duration and buffer times.
- Customize event descriptions and names.

### 3.2 Schedules (Availability)
- Define availability windows for each day of the week.
- Set recurring availability or specific date ranges.

### 3.3 Integration with Google Calendar
- Sync existing Google Calendar events to prevent double bookings.
- Automatically add scheduled meetings to the user's Google Calendar.

### 3.4 Time Zone Management
- Detect the invitee's time zone and adjust available slots accordingly.
- Allow users to set their default time zone.

### 3.5 Private Pages for Logged-in Users
- User dashboard displaying upcoming meetings and event types.
- Profile management for personal details and settings.

### 3.6 Generate Meeting Links in Google Meet
- Automatically generate a Google Meet link upon event booking.
- Include the meeting link in confirmation emails and calendar events.

### 3.7 Authentication for Sign-in
- Secure user accounts using Clerk for authentication.
- Support social sign-in options (e.g., Google Sign-In).

## 4. Tech Stack

### 4.1 Frontend
- **Framework:** Next.js 14 with React 18
- **UI Components:** Shadcn UI library
- **Styling:** Tailwind CSS

### 4.2 Backend
- **API Routes:** Next.js API routes
- **ORM:** Drizzle
- **Database:** Neon (PostgreSQL)

### 4.3 Authentication
- **Service:** Clerk

### 4.4 APIs and Integrations
- **Google Cloud API:** For Google Calendar and Google Meet integrations
- **Validation:** Zod for form and data validation

## 5. Implementation Plan

### Step 1: Project Setup
- Initialize a new Next.js project.
- Install and configure Tailwind CSS and Shadcn UI.
- Set up ESLint and Prettier for code formatting and linting.

### Step 2: Implement Authentication
- Integrate Clerk for user authentication.
- Set up sign-up, sign-in, and sign-out functionalities.
- Protect private routes using Clerk's middleware.

### Step 3: Database Schema Design
- Configure Drizzle ORM with Neon PostgreSQL.
- Define the database schema using the provided table structures.
- Run migrations to set up the database.

### Step 4: User Dashboard and Event Creation
- Create a dashboard page for logged-in users.
- Implement CRUD operations for event types.
- Use Zod for validating event creation and editing forms.

### Step 5: Schedule Availability Management
- Develop pages for users to set and manage their availability.
- Implement forms for adding, editing, and deleting availability slots.
- Validate availability inputs with Zod.

### Step 6: Event Booking and Time Zone Management
- Create public event booking pages.
- Implement time zone detection and adjustment for invitees.
- Display available time slots based on the invitee's time zone.

### Step 7: Integration with Google Calendar and Google Meet
- Set up Google Cloud API credentials.
- Implement OAuth 2.0 flow for accessing user calendars.
- Sync events with Google Calendar and generate Google Meet links.

### Step 8: Testing and Validation
- Write unit and integration tests for critical components.
- Ensure all forms and data inputs are validated correctly.
- Test time zone conversions and calendar integrations.

### Step 9: Deployment Setup
- Configure deployment settings for the hosting provider (e.g., Vercel).
- Set up environment variables securely.
- Test the deployed application for any deployment-specific issues.

### Step 10: Documentation and Final Touches
- Document API endpoints, database schema, and component structures.
- Optimize for performance and accessibility.
- Prepare a user guide for application features.

## 6. Implementation Details

### 6.1 Database Structure

#### 6.1.1 Event Table
- **Columns:**
  - `id` (Primary Key)
  - `name` (String)
  - `description` (Text)
  - `duration_in_minutes` (Integer)
  - `clerk_user_id` (Foreign Key to Clerk user)
  - `is_active` (Boolean)
  - `created_at` (Timestamp)
  - `updated_at` (Timestamp)

#### 6.1.2 Schedule Table
- **Columns:**
  - `id` (Primary Key)
  - `timezone` (String)
  - `clerk_user_id` (Foreign Key to Clerk user)
  - `created_at` (Timestamp)
  - `updated_at` (Timestamp)

#### 6.1.3 Schedule Availability Table
- **Columns:**
  - `id` (Primary Key)
  - `schedule_id` (Foreign Key to Schedule)
  - `start_time` (Time)
  - `end_time` (Time)
  - `day_of_week` (Integer, 0=Sunday to 6=Saturday)
  - `created_at` (Timestamp)
  - `updated_at` (Timestamp)

- **Relationships:**
  - One-to-Many from Schedule to Schedule Availability

### 6.2 API Endpoints

#### Authentication
- Handled by Clerk; minimal custom endpoints required.

#### Events
- `GET /api/events` - List all events for the authenticated user.
- `POST /api/events` - Create a new event type.
- `PUT /api/events/:id` - Update an existing event.
- `DELETE /api/events/:id` - Delete an event.

#### Schedule
- `GET /api/schedule` - Retrieve the user's schedule.
- `POST /api/schedule` - Create or update the user's schedule.

#### Availability
- `GET /api/availability` - Get availability slots.
- `POST /api/availability` - Add a new availability slot.
- `DELETE /api/availability/:id` - Remove an availability slot.

#### Booking
- `POST /api/bookings` - Book an event slot.
- Include Google Meet link generation and calendar event creation.

### 6.3 Frontend Components

#### Layout Components
- `Header` - Navigation bar with sign-in/out.
- `Footer` - Application footer with links.

#### Pages
- `/` - Landing page with marketing content.
- `/dashboard` - User dashboard with events and upcoming meetings.
- `/events` - Manage event types.
- `/schedule` - Set and manage availability.
- `/event/:id` - Public booking page for an event type.

#### Forms
- `EventForm` - Create and edit event types.
- `AvailabilityForm` - Add and edit availability slots.

### 6.4 Validation with Zod
- Define Zod schemas for all forms.
- Implement client-side and server-side validation.
- Ensure data integrity before database operations.

## 7. Final File Structure

```
calendlier/
├── README.md
├── .eslintrc.json
├── .gitignore
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── public/
│   ├── images/
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       └── DashboardWidget.tsx
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── components/
│   │   │       └── EventForm.tsx
│   │   ├── schedule/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       └── AvailabilityForm.tsx
│   │   ├── event/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── components/
│   │   │       └── BookingForm.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── TimeZoneSelector.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── api.ts
│   │   └── auth.ts
│   ├── pages/
│   │   └── api/
│   │       ├── events.ts
│   │       ├── schedule.ts
│   │       ├── availability.ts
│   │       └── bookings.ts
│   ├── styles/
│   │   └── globals.css
│   ├── utils/
│   │   ├── zodSchemas.ts
│   │   └── timeZoneUtils.ts
│   └── fonts/
│       ├── GeistMonoVF.woff
│       └── GeistVF.woff
```

## 8. Additional Notes

- **Environment Variables:**
  - Store sensitive data like API keys and database credentials in environment variables.
  - Use a `.env.local` file for local development.

- **Access Tokens and API Keys:**
  - Securely store and handle tokens required for Google API integrations.

- **Error Handling:**
  - Implement global error handling for API routes.
  - Provide user-friendly error messages on the frontend.

- **Performance Optimization:**
  - Use Next.js dynamic imports for code splitting.
  - Optimize images and assets.

- **Security Considerations:**
  - Sanitize user inputs to prevent SQL injection and XSS attacks.
  - Use HTTPS in production.

## 9. Conclusion
This PRD outlines the necessary steps and components to develop Calendlier, a Calendly clone application. By following this document, developers should have a clear roadmap and the implementation details required to build a functional and scalable meeting scheduling app.