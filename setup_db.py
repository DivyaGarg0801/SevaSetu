import os
import mysql.connector
from werkzeug.security import generate_password_hash
from config import Config

def setup_database():
    try:
        print(f"Connecting to MySQL at {Config.DB_HOST} with user {Config.DB_USER}...")
        conn = mysql.connector.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD
        )
        cursor = conn.cursor()
        
        print("Reading schema.sql...")
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
            
        print("Executing schema.sql...")
        # Execute each statement separated by semicolon
        for result in cursor.execute(schema_sql, multi=True):
            if result.with_rows:
                result.fetchall()

        conn.commit()
        
        # Connect to the created database
        conn.database = Config.DB_NAME
        
        # Create default admin
        admin_email = 'admin@sevasetu.com'
        admin_password = 'root'
        
        cursor.execute("SELECT id FROM users WHERE email = %s", (admin_email,))
        if not cursor.fetchone():
            hashed_pw = generate_password_hash(admin_password)
            cursor.execute(
                "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
                ('System Admin', admin_email, hashed_pw, 'admin')
            )
            conn.commit()
            print(f"Default admin created: {admin_email} / {admin_password}")
        else:
            print("Default admin already exists.")

        # Ensure upload directory exists
        if not os.path.exists(Config.UPLOAD_FOLDER):
            os.makedirs(Config.UPLOAD_FOLDER)
            print(f"Created upload directory at {Config.UPLOAD_FOLDER}")

        print("\n✅ Database setup completed successfully.")

    except mysql.connector.Error as err:
        print(f"❌ Database Error: {err}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()

if __name__ == '__main__':
    setup_database()
