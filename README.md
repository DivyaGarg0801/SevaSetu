# SevaSetu: Public Services Complaint System

SevaSetu is a modern, responsive web application built to empower citizens to easily report local infrastructure issues and enable authorities to manage and resolve them efficiently.

## Prerequisites
- Python 3.x
- MySQL Server

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd SevaSetu
   ```

2. **Configure Database Settings:**
   - Copy `.env.example` to a new file named `.env`.
   - Open `.env` and configure your local MySQL credentials (`DB_PASSWORD`, etc.). *For the default setup, it uses password `root`.*

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize the Database:**
   - Ensure your MySQL server is running.
   - Run the setup script to automatically create the database, tables, default admin user, and upload directories.
   ```bash
   python setup_db.py
   ```
   *(Default Admin created: `admin@sevasetu.com` / `root`)*

5. **Run the Application:**
   ```bash
   python app.py
   ```
   - Navigate to `http://127.0.0.1:5000/` in your browser.
