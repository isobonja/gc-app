import sqlite3
import datetime
import json

# 1. Connect to the database (creates the .db file if it doesn't exist)
conn = sqlite3.connect('grocery.db')
cursor = conn.cursor()

# cursor.execute('''
#         DROP TABLE categories;
#                ''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
)
''')

categories = [
    ('Fruits',),
    ('Vegetables',),
    ('Canned Goods',),
    ('Dairy',),
    ('Meat',),
    ('Fish/Seafood',),
    ('Deli',),
    ('Condiments/Spices',),
    ('Snacks',),
    ('Bread/Bakery',),
    ('Beverages',),
    ('Pasta/Rice/Cereal',),
    ('Baking',),
    ('Frozen',),
    ('Personal Care',),
    ('Cleaning/Household Items',),
    ('Pet Care',)
]
cursor.executemany('INSERT INTO categories (name) VALUES (?)', categories)

cursor.execute('''
        SELECT * FROM categories
               ''')

print(cursor.fetchall())

conn.commit()
conn.close()