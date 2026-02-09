# HRMS - Advanced Human Resource Management System

A premium, full-stack Human Resource Management System designed for modern enterprises. This system features a state-driven Attendance Dashboard, Employee Management, and Real-time Analytics.

## 🚀 Features

- **Advanced Attendance Dashboard**: Purely state-driven UI for tracking daily attendance (Present/Late/Absent).
- **Bulk Actions**: Mark all employees at once with safety confirmation and override warnings.
- **Real-time Analytics**: Visualized attendance data using Recharts.
- **Conflict Handling**: Intelligent logic to handle individual vs bulk marking conflicts.
- **Report Generation**: Export employee attendance history as CSV.
- **High-End UI/UX**: Glassmorphism effects, smooth animations, and tactile feedback.
- **Smart Validation**: Prevents finalizing reports if any employee is unmarked.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Lucide Icons, Recharts, Vanilla CSS (Premium Custom Design)
- **Backend**: Python, Django REST Framework
- **Database**: SQLite (Development)
- **State Management**: Centralized React Hooks Core Logic

---

## 📦 Installation & Setup

### 1. Prerequisites
- Python 3.8+
- Node.js 14+ & npm

### 2. Backend Setup (Django)
Navigate to the backend directory:
```powershell
cd hrms-backend
# Create virtual environment
python -m venv venv
# Activate virtual environment
.\venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Run migrations
python manage.py migrate
# Seed initial data (optional)
python seed_data.py
```

### 3. Frontend Setup (React)
Navigate to the frontend directory:
```powershell
cd hrms-frontend
# Install dependencies
npm install
```

---

## 🏃 Running the Project

To run the project locally, you need two terminal windows open:

### Terminal 1: Backend
```powershell
cd hrms-backend
.\venv\Scripts\activate
python manage.py runserver
```

### Terminal 2: Frontend
```powershell
cd hrms-frontend
npm start
```
*Note: If port 3000 is occupied, it may prompt to run on 3001 or 3002.*

---

## 🏗️ Build Commands

### Frontend Production Build
To create an optimized production bundle:
```powershell
cd hrms-frontend
npm run build
```
This will create a `build/` folder ready for deployment.

### Backend Data Management
- **Clear Data**: `python clear_data.py` (Clears all records)
- **Seed Data**: `python seed_data.py` (Populates dummy employees)

---

## 📁 Project Structure

```text
HRMS/
├── hrms-backend/          # Django Project Root
│   ├── attendance/        # Attendance App Logic
│   ├── employees/         # Employee App Logic
│   ├── config/            # Django Settings
│   └── seed_data.py       # Initial Data Script
├── hrms-frontend/         # React Project Root
│   ├── src/
│   │   ├── dashboard.js   # Main Dashboard & Attendance Logic
│   │   ├── App.css        # Premium Styling Tokens
│   │   └── App.js         # Routing & Core App Shell
├── run_project.ps1        # PowerShell script to run both
└── README.md              # Documentation
```

---

## 🛡️ Best Practices Implemented
- **Optimistic UI**: Attendance updates locally before server confirmation.
- **State-Driven**: No manual DOM/CSS manipulation; UI reflects central truth.
- **Error Handling**: Graceful fallback when the Django server is offline.
- **DRY Logic**: Reusable utility functions for data processing.

---

## 📝 Assumptions
- **Local Environment**: The system is designed to run on a local machine or a private internal network.
- **Single Administrator**: The current logic assumes one HR administrator is marking attendance at a time.
- **Connectivity**: Requires active internet connectivity to load remote assets like UI avatars and premium typography from Google Fonts.
- **Browser**: Optimized for modern evergreen browsers (Chrome, Edge, Safari, Firefox).

---

## ⚠️ Limitations
- **User Authentication**: There is no integrated Login/Signup system; the dashboard is directly accessible (Prototype Mode).
- **Database Scale**: Uses SQLite by default. For large-scale production (1000+ employees), migrating to PostgreSQL/MySQL is recommended.
- **No Role-Based Access (RBAC)**: Currently, all users have the same administrative permissions.
- **Real-time Sync**: While it has optimistic updates, complete offline-first capability is not yet implemented.

---

Made with ❤️ for HR Productivity.
