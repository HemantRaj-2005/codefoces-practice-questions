# Codeforces Problem Tracker

A full-stack, production-ready manual practice tracker built with **Next.js 15 (App Router)**. This application features a premium dark glassmorphic UI design, secure session authentication, custom shadcn-style component configurations, and a CSV import system with automated duplicate detection based on Problem Link uniqueness.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database ORM**: Prisma 7
- **Database**: PostgreSQL
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Forms & Validation**: React Hook Form, Zod
- **Icons**: Lucide Icons
- **Theme**: next-themes (Forced Dark Mode)

---

## Key Features

1. **Personal Syllabus Layout**: Organize training sheets by Topics (e.g., Graphs, DP) and Subtopics (DFS, DSU) with customizable order indices.
2. **Dynamic Dashboard Metrics**: Responsive charts tracking completed versus total counts grouped by topic and rating distributions.
3. **CSV Problem Ingestion**: Batch upload problems using standard layouts. Automatically ignores pre-existing problem links to avoid duplicates.
4. **Optimistic Completion Checkboxes**: Immediate homepage checkbox updates with background sync and rollback safety.
5. **Autosaving Inline Notes**: Local debounce saves text notes for each problem to the database 1 second after typing stops.
6. **Encrypted Cookie Auth**: Session cookie authentication using JSON Web Tokens (JWT) signed by a server-side secret.
7. **Global Search & Multi-Faceted Filters**: Instantly find problems by name, tag, or pattern; filter by rating limits, completion state, and sort orders.

---

## Installation & Setup Guide

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org) (v18.17 or higher recommended)
- [pnpm](https://pnpm.io/) (v10 or higher recommended)
- A running PostgreSQL database instance

### 1. Clone & Install Dependencies

In the project root directory, install all required packages:
```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root by copying the template:
```bash
cp .env.example .env
```
Open `.env` and fill in your PostgreSQL URL, admin account credentials, and session cookie secret:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/db_name?schema=public"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="supersecretadminpassword123"
SESSION_SECRET="generate-a-random-32-plus-character-secret-key-here"
```

### 3. Setup Database Schema & Migrations

Run Prisma migrations to create tables on your PostgreSQL database:
```bash
pnpm prisma migrate dev --name init
```

This will automatically create tables for `Topic`, `SubTopic`, and `Problem` and compile the Prisma Client.

### 4. Seed the Database

Run the database seeder to populate default practice syllabus topics (Graphs, DP, Greedy, Math, Strings) and subtopics:
```bash
pnpm prisma db seed
```

### 5. Start the Development Server

Run the development server locally:
```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## CSV Upload Format

The CSV uploader accepts files containing exactly these 5 columns:

| Problem | Rating | Main Topic | Hidden Pattern | Link |
|---|---|---|---|---|
| Kefa and First Steps | 900 | DP | Greedy | https://codeforces.com/problemset/problem/580/A |
| Dynamic Range Sum | 1400 | Segment Tree | Segment Tree | https://codeforces.com/problemset/problem/123/B |

**Note**:
- **Link** is the unique identifier. If a problem link matches a problem already present in the database, it will be skipped automatically during upload.
- **Hidden Pattern** is optional and can be left blank.
- You can download/upload problems into any specific Subtopic in the admin dashboard.
