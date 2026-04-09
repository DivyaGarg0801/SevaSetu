import os
import secrets
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Provide a simple DB connection function
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=app.config['DB_HOST'],
            user=app.config['DB_USER'],
            password=app.config['DB_PASSWORD'],
            database=app.config['DB_NAME']
        )
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.before_request
def make_session_permanent():
    session.permanent = True

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/auth', methods=['GET'])
def auth():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('auth.html')

@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')

    if not name or not email or not password:
        flash('All fields are required.', 'danger')
        return redirect(url_for('auth'))

    hashed_pw = generate_password_hash(password)
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                flash('Email already registered.', 'danger')
                return redirect(url_for('auth'))
            
            cursor.execute("INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
                           (name, email, hashed_pw))
            conn.commit()
            flash('Registration successful! Please login.', 'success')
        except Error as e:
            flash('An error occurred during registration.', 'danger')
            print(e)
        finally:
            cursor.close()
            conn.close()
    return redirect(url_for('auth'))

@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')

    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            
            if user and check_password_hash(user['password_hash'], password):
                session['user_id'] = user['id']
                session['user_name'] = user['name']
                session['user_role'] = user['role']
                flash('Logged in successfully.', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Invalid email or password.', 'danger')
        except Error as e:
            print(e)
        finally:
            cursor.close()
            conn.close()
    return redirect(url_for('auth'))

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('home'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        flash('Please log in to access this page.', 'warning')
        return redirect(url_for('auth'))
    
    conn = get_db_connection()
    if not conn:
        return "Database error"
    
    cursor = conn.cursor(dictionary=True)
    if session.get('user_role') == 'admin':
        cursor.execute("""
            SELECT c.*, u.name as user_name 
            FROM complaints c 
            JOIN users u ON c.user_id = u.id 
            ORDER BY c.created_at DESC
        """)
        complaints = cursor.fetchall()
        cursor.close()
        conn.close()
        return render_template('admin_dashboard.html', complaints=complaints)
    else:
        cursor.execute("SELECT * FROM complaints WHERE user_id = %s ORDER BY created_at DESC", (session['user_id'],))
        complaints = cursor.fetchall()
        cursor.close()
        conn.close()
        return render_template('user_dashboard.html', complaints=complaints)

@app.route('/submit', methods=['GET', 'POST'])
def submit():
    if 'user_id' not in session:
        flash('Please log in to submit a complaint.', 'warning')
        return redirect(url_for('auth'))
        
    if session.get('user_role') == 'admin':
        flash('Admins are restricted from reporting issues. Please use a citizen account.', 'warning')
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        location = request.form.get('location')  # Should be literal coordinates from map or text
        
        # Handle image upload
        image_path = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(f"{secrets.token_hex(8)}_{file.filename}")
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                image_path = filename
                
        if not title or not description or not location:
            flash('Title, description and location are required.', 'danger')
            return redirect(url_for('submit'))
            
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO complaints (user_id, title, description, location, image_path) VALUES (%s, %s, %s, %s, %s)",
                    (session['user_id'], title, description, location, image_path)
                )
                conn.commit()
                flash('Complaint submitted successfully!', 'success')
                return redirect(url_for('dashboard'))
            except Error as e:
                print(e)
                flash('Database error occurred.', 'danger')
            finally:
                cursor.close()
                conn.close()
                
    return render_template('submit.html')

@app.route('/api/status/<int:complaint_id>', methods=['PUT'])
def update_status(complaint_id):
    if session.get('user_role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.json
    new_status = data.get('status')
    if new_status not in ['Reported', 'In Progress', 'Completed']:
        return jsonify({'error': 'Invalid status'}), 400
        
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE complaints SET status = %s WHERE id = %s", (new_status, complaint_id))
            conn.commit()
            return jsonify({'success': True, 'new_status': new_status})
        except Error as e:
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()
            conn.close()
            
    return jsonify({'error': 'Database connect error'}), 500

if __name__ == '__main__':
    # Ensure upload folder exists
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    app.run(debug=True, host='127.0.0.1', port=5000)
