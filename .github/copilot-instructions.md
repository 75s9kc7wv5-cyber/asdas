# GitHub Copilot Instructions for "Sim of World" Project

## Project Overview
This is a web-based strategy and simulation game ("Sim of World") built with a **Node.js (Express)** backend and a **Vanilla JavaScript/HTML** frontend. The data is stored in a **MySQL** database.

## Architecture & Structure
- **Monolithic Backend:** The core logic, API endpoints, and database interactions are concentrated in `src/server.js` (6000+ lines).
- **Frontend:** Static HTML, CSS, and client-side JavaScript files reside in the `public/` directory.
- **Database Scripts:** The `scripts/` directory contains standalone Node.js scripts for database migrations, schema checks, and data fixes.
- **Assets:** User uploads (images) are processed and stored in `public/uploads/`.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL (using `mysql2` driver)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Utilities:** `sharp` (image processing), `multer` (file uploads), `axios` (HTTP requests)

## Critical Developer Workflows

### Running the Application
- Start the server: `npm start` (runs `node src/server.js`)
- The server runs on port **3000** by default.
- Access the frontend at `http://localhost:3000`.

### Database Management
- **Connection:** Database credentials (`simuser`, `password`, `simworld`) are currently hardcoded in `src/server.js` and individual scripts.
- **Schema Updates:**
  - Some tables are created automatically on server startup in `src/server.js`.
  - Complex migrations or checks are often found in `scripts/`.
  - To run a maintenance script: `node scripts/<script_name>.js`.

## Coding Conventions & Patterns

### Backend (`src/server.js`)
- **Module System:** Uses CommonJS (`require`).
- **Database Access:** Uses raw SQL queries via `db.query()`.
  - *Example:* `db.query('SELECT * FROM users WHERE id = ?', [userId], callback)`
- **Routing:** All routes are defined directly in `server.js`.
- **Error Handling:** Basic error logging to console. Ensure callbacks handle `err` parameters.

### Frontend (`public/`)
- **Interaction:** Frontend pages use `fetch` or `XMLHttpRequest` to communicate with the backend API.
- **Structure:** Separate HTML files for different game modules (e.g., `bank.html`, `hospital-list.html`).

### Specific Implementation Details
- **Game Logic:** Logic for systems like Hospitals (upgrades, treatments) and Banks (loans, accounts) is implemented directly in the API endpoints in `server.js`.
- **Math Formulas:** Game balance formulas (costs, timers) are embedded in the code. Refer to `README.md` for the mathematical models if available, or check the specific route handler.

## Common Tasks
- **Adding a new feature:**
  1. Create the HTML interface in `public/`.
  2. Add the client-side logic in a `<script>` tag or separate JS file.
  3. Add the corresponding API endpoints in `src/server.js`.
  4. If a new table is needed, add a creation script in `scripts/` or the startup logic in `server.js`.

- **Debugging:**
  - Check the terminal output for server-side errors.
  - Use browser console for frontend errors.
  - `server.err` file may contain error logs.
