# 🕒 Employee Attendance System

A full-featured **Employee Attendance System** built with **Django**, **React.js**, and **PostgreSQL**. It provides role-based access for **Admin**, **Manager**, and **Staff** users, with a focus on attendance tracking, leave management, and department-wise insights.

---

## Features

### Shared Features (All Roles)
- ✅ Clock In / Clock Out
- 📅 View attendance calendar (🟩On-Time, 🟦Late, 🟧Leave)
- 📝 View leave taken by type (e.g., Sick, Casual, Annual)
- 📤 Submit leave requests
- ❌ Cancel leave requests before approval/rejection
- 📚 View leave request history
- 🔐 Change password

### Manager Features
- 📊 View departmental attendance summary (Total Employees, On-Time, Late, Leave)
- 🗓️ View daily attendance details for their department
- ✔️ Approve or ❌ Reject leave requests from staff

### Admin Features
- 🌍 View attendance and leave records across all departments
- 👥 View leave request history (who requested, who approved)
- ➕ Add new employees
- ✏️ Edit employee data (except username, email, password)
- 🗑️ Delete employees (Admin accounts cannot be deleted)

---

## Tech Stack

- **Backend**: Django (Django REST Framework)
- **Frontend**: React.js
- **Database**: PostgreSQL

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/employee-attendance-system.git
```

### 2. Setup PostgreSQL Database
- Setup PostgreSQL and update the following values in **settings.py**:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_database_name',
        'USER': 'your_database_user',
        'PASSWORD': 'your_database_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

### 3. Backend Setup (Django)
```bash
cd backend
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 4. Frontend Setup (React)
```bash
cd frontend
npm install
npm start
```

---

## Usage Instructions

- Create a superuser – this will automatically have the Admin role.
- Login to the system as Admin.
- Add employees and assign them roles (Manager or Staff).
- Users can then:
  - Clock in/out
  - View attendance/leave records
  - Submit and track leave requests
  - Change their password

---

## Screenshots



