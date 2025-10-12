import sqlite3
import datetime
import json
import bcrypt

# 1. Connect to the database (creates the .db file if it doesn't exist)
conn = sqlite3.connect('grocery.db')
cursor = conn.cursor()

cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories (category_id)
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS grocery_lists (
    list_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS grocery_list_users (
    list_id INTEGER,
    user_id INTEGER,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'temporary')) DEFAULT 'viewer',
    PRIMARY KEY (list_id, user_id),
    FOREIGN KEY (list_id) REFERENCES grocery_lists (list_id),
    FOREIGN KEY (user_id) REFERENCES users (user_id)
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS grocery_list_items (
    list_id INTEGER,
    item_id INTEGER,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (list_id, item_id),
    FOREIGN KEY (list_id) REFERENCES grocery_lists (list_id),
    FOREIGN KEY (item_id) REFERENCES items (item_id)
)
''')

users = [
    ('Vivo', 'a'),
    ('Zach', 'b')
]

# How to insert new user
for n, p in users:
    hashed_p = bcrypt.hashpw(p.encode('utf-8'), bcrypt.gensalt())
    cursor.execute('''
        INSERT INTO users (username, password_hash)
        VALUES (?, ?)
    ''', (n, hashed_p))

#cursor.executemany('INSERT INTO users (name, pass) VALUES (?, ?)', users)

# How to insert category
categories = [
    ('dairy',),
    ('meat',),
    ('fish/seafood',),
    ('fruits',),
    ('vegetables',),
    ('canned/pantry',),
    ('bread/bakery',),
    ('pasta/grains',),
    ('deli',),
    ('condiments/spices',),
    ('snacks',),
    ('beverages',),
    ('baking',),
    ('frozen',),
    ('prepared foods',),
    ('personal care',),
    ('cleaning/household items',),
    ('pet care',)
]

cursor.executemany('INSERT INTO categories (name) VALUES (?)', categories)

# ***** NEED TO TEST INSERTING STUFF INTO THE OTHER TABLES


# To add new item (name, category_id)
# On site, when adding new item, if it doesnt already exist in items table,
# then the item will be added with name and category (category chosen from drop down)

test_items = [
    ('eggs', 'dairy'), 
    ('milk', 'dairy'), 
    ('shampoo', 'personal care'), 
    ('chicken breasts', 'meat')
]

for item, category in test_items:
    cursor.execute('''
        INSERT INTO items (name, category_id)
        SELECT ?, category_id
        FROM categories
        WHERE name = ?
                   ''', (item, category))



# Add new grocery list

grocery_lists = [
    #('test_list1', ['Jay', 'Eddie'])
    ('test_list1', ['Vivo'], 'owner')
]

for new_list in grocery_lists:
    # Create new grocery list
    cursor.execute('''
        INSERT INTO grocery_lists (name, creation_date, update_date)
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ''', (new_list[0],))
    
    # Add users that are a part of grocery list to grocery_list_users table
    list_id = cursor.lastrowid
    
    cursor.execute('''
        SELECT user_id FROM users WHERE username IN ({})             
    '''.format(','.join(['?'] * len(new_list[1]))), new_list[1])
    
    user_ids = [row[0] for row in cursor.fetchall()]
    
    for user_id in user_ids:
        cursor.execute('''
            INSERT INTO grocery_list_users (list_id, user_id, role)
            VALUES (?, ?, ?)               
        ''', (list_id, user_id, new_list[2]))
        
#list_id, item_id, quantity
items_to_list = [
    (1, 1, 1),
    (1, 3, 2)
]

for list_id, item_id, quantity in items_to_list:
    cursor.execute('''
        INSERT INTO grocery_list_items (list_id, item_id, quantity)
        VALUES (?, ?, ?)
    ''', (list_id, item_id, quantity))
    



# items = [
#     ('Milk', 'Dairy'),
#     ('Eggs', 'Dairy'),
#     ('Shampoo', 'Personal Care')
# ]
# cursor.executemany('INSERT INTO items (name, category) VALUES (?, ?)', items)

# categories = [
#     ('Dairy',),
#     ('Personal Care',),
#     ('Produce',),
#     ('Snacks',)
# ]
# cursor.executemany('INSERT INTO categories (name) VALUES (?)', categories)

# list_items = {'items': ['Milk', 'Eggs']}
# creation_date = update_date = datetime.datetime.now().strftime('%Y-%m-%d')
# cursor.execute('''
# INSERT INTO grocery_lists (roommate_id, roommate_id2, items, creation_date, update_date)
# VALUES (?, ?, ?, ?, ?)
# ''', (1, None, json.dumps(list_items), creation_date, update_date))

# 4. Commit the changes and close the connection
conn.commit()
conn.close()

print("Database created and populated successfully!")