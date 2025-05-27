import sqlite3
from contextlib import contextmanager

DB_PATH = "bookbuddy.db"

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_database():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY
            )
        ''')
        
        # Create user_library table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_library (
                email TEXT,
                book_title TEXT,
                book_author TEXT,
                comment TEXT,
                rating INTEGER CHECK(rating >= 0 AND rating <= 5),
                added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (email, book_title, book_author),
                FOREIGN KEY (email) REFERENCES users(email)
            )
        ''')
        
        conn.commit()
        
        # CHANGE !! Add some test data
        add_test_data()

def add_test_data():
    """Add some sample reviews for demonstration"""
    test_users = ["alice@example.com", "bob@example.com", "charlie@example.com"]
    
    # Register test users
    for email in test_users:
        register_user(email)
    
    # Add some books with reviews
    test_reviews = [
        ("alice@example.com", "Classical Mythology", "Mark P. O. Morford", 
         "Excellent introduction to Greek and Roman mythology. Very comprehensive!", 5),
        ("bob@example.com", "Classical Mythology", "Mark P. O. Morford", 
         "Good book but a bit dense for beginners.", 3),
        ("charlie@example.com", "The Kitchen God's Wife", "Amy Tan", 
         "Beautiful storytelling. Amy Tan at her best!", 5),
        ("alice@example.com", "The Kitchen God's Wife", "Amy Tan", 
         "Emotionally powerful and well-written.", 4),
    ]
    
    with get_db() as conn:
        cursor = conn.cursor()
        for email, title, author, comment, rating in test_reviews:
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO user_library (email, book_title, book_author, comment, rating) 
                    VALUES (?, ?, ?, ?, ?)
                ''', (email, title, author, comment, rating))
            except:
                pass
        conn.commit()

def register_user(email):
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO users (email) VALUES (?)", (email,))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False

def add_book_to_library(email, book_title, book_author):
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO user_library (email, book_title, book_author, comment, rating) 
                VALUES (?, ?, ?, NULL, NULL)
            ''', (email, book_title, book_author))  # CHANGE !! Use NULL instead of empty string and 0
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False

def get_user_library(email):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT book_title, book_author, comment, rating, added_date 
            FROM user_library 
            WHERE email = ?
            ORDER BY added_date DESC
        ''', (email,))
        return [dict(row) for row in cursor.fetchall()]

def update_book_in_library(email, book_title, book_author, comment, rating):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE user_library 
            SET comment = ?, rating = ?
            WHERE email = ? AND book_title = ? AND book_author = ?
        ''', (comment, rating, email, book_title, book_author))
        conn.commit()
        return cursor.rowcount > 0

def remove_book_from_library(email, book_title, book_author):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            DELETE FROM user_library 
            WHERE email = ? AND book_title = ? AND book_author = ?
        ''', (email, book_title, book_author))
        conn.commit()
        return cursor.rowcount > 0

# CHANGE !! New functions for public reviews
def get_book_reviews(book_title, book_author, exclude_email=None):
    with get_db() as conn:
        cursor = conn.cursor()
        if exclude_email:
            cursor.execute('''
                SELECT email, comment, rating 
                FROM user_library 
                WHERE book_title = ? AND book_author = ? 
                AND email != ?
                AND (rating IS NOT NULL OR comment IS NOT NULL)
                ORDER BY added_date DESC
            ''', (book_title, book_author, exclude_email))
        else:
            cursor.execute('''
                SELECT email, comment, rating 
                FROM user_library 
                WHERE book_title = ? AND book_author = ?
                AND (rating IS NOT NULL OR comment IS NOT NULL)
                ORDER BY added_date DESC
            ''', (book_title, book_author))
        return [dict(row) for row in cursor.fetchall()]

def get_book_average_rating(book_title, book_author):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT AVG(rating) as avg_rating, COUNT(rating) as rating_count
            FROM user_library 
            WHERE book_title = ? AND book_author = ? 
            AND rating IS NOT NULL AND rating > 0
        ''', (book_title, book_author))
        result = cursor.fetchone()
        return {
            "avg_rating": round(result[0], 1) if result[0] else 0,
            "rating_count": result[1] or 0
        }

def check_book_in_library(email, book_title, book_author):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 1 FROM user_library 
            WHERE email = ? AND book_title = ? AND book_author = ?
        ''', (email, book_title, book_author))
        return cursor.fetchone() is not None