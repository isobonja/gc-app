import sqlite3
import bcrypt
import logging
from datetime import timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_cors import CORS

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)
app.secret_key = 'S9sAxmnN2n@iS9g(u#N$lSQZOb3o%6'

# Uncomment the following line to enable session expiration after a set time
#app.permanent_session_lifetime = timedelta(days=7)

@app.route('/login', methods=['GET', 'POST'])
def login():
    print("Login endpoint reached")
    #global username
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        # Query the database for the user
        conn = get_db_conn()
        user_info = conn.execute('SELECT password_hash, user_id FROM users WHERE username = ?', (username,)).fetchone()
        db_pw = user_info[0] if user_info else None
        user_id = user_info[1] if user_info else None
        logger.info(f"Fetched user info for {username}: {user_info}")

        if db_pw is None:
            logger.warning("Incorrect username")
            return jsonify({'success': False, 'message': 'Incorrect username'}), 401
            
        if not bcrypt.checkpw(password.encode('utf-8'), db_pw):
            logger.warning("Incorrect password")
            return jsonify({'success': False, 'message': 'Incorrect password'}), 401
        
        session['username'] = username  # Store username in session
        # *** Use user_id for any database queries instead of username; only use username for display purposes
        session['user_id'] = user_id  # Store user_id in session; more secure than username
        logger.info("Valid Login")
        
        # Uncomment along with the app.permanent_session_lifetime line above to enable session expiration
        #session.permanent = True
        
        recent_list = conn.execute('''
            SELECT gl.list_id
            FROM grocery_lists gl
            JOIN grocery_list_users glu ON gl.list_id = glu.list_id
            WHERE glu.user_id = ?
            ORDER BY gl.update_date DESC
            LIMIT 1
        ''', (user_id,)).fetchone()
        
        current_list_id = recent_list[0] if recent_list else None
        session['current_list_id'] = current_list_id
        
        conn.close()
        
        logger.info(f"User {username} (id={user_id}) logged in. Current list: {current_list_id}")
        
        return jsonify({'success': True, 'username': username, 'currentListId': current_list_id}), 200
            
@app.route('/logout', methods=['POST'])
def logout():
    #session.pop('user_id', None)
    session.clear() # Clear all session data
    logger.info("User logged out")
    return jsonify({"success": True, "message": "Logged out successfully"})

@app.route('/categories')
def get_categories():
    conn = get_db_conn()
    categories = conn.execute('SELECT name, category_id FROM categories').fetchall()
    conn.close()
    categories_list = [{'name': c[0], 'category_id': c[1]} for c in categories]
    logger.info(f"categories_list: {categories_list}")
    return jsonify(categories=categories_list)

@app.route('/dashboard/home', methods=['GET'])
def dashboard():
    # Fetch items from the database
    # Return items as JSON list of dictionaries
    # Each dictionary contains keys 'name', 'category', 'quantity'
    
    #global list_id
    #list_id = 1 # TEMPORARY: will need to get list_id from login/dashboard somehow 
    
    if request.method == 'GET':
        list_id = request.args.get('list_id', type=int)
        
        if list_id is None:
            # Will need to check database for user's list_id based on user_id from login
            # *** CURRENTLY GET MOST RECENTLY UPDATED LIST ID FROM LOGIN PROCESS; DONT NEED TO DO IT HERE ***
            pass
        
        conn = get_db_conn()
        items = conn.execute('''
            SELECT i.name, c.name AS category, gli.quantity, i.item_id
            FROM grocery_list_items gli
            JOIN items i ON gli.item_id = i.item_id
            JOIN categories c ON i.category_id = c.category_id
            WHERE gli.list_id = ?
        ''', (list_id,)).fetchall()
        
        #categories = conn.execute('SELECT name, category_id FROM categories').fetchall()
        
        logger.info(f"Fetched items: {items}")
        #logger.info(f"Fetched categories: {categories}")
        
        conn.close()
        
        items_list = [{'name': item[0], 'category': item[1], 'quantity': item[2], 'item_id': item[3]} for item in items]
        logger.info(f"items_list: {items_list}")
        #categories_list = [{'name': cat[0], 'category_id': cat[1]} for cat in categories]
        #logger.info(f"categories_list: {categories_list}")
        #return jsonify(items=items_list, categories=categories_list)
        return jsonify(items=items_list)

@app.route('/dashboard/add_item', methods=['POST'])
def add_item():
    #global list_id
    
    if request.method == 'POST':
        conn = get_db_conn()
        
        data = request.get_json()
        list_id = data.get('currentListId')
        item_name = data.get('itemName')
        category_name = data.get('categoryName')
        quantity = data.get('quantity', 1)
        item_id = data.get('itemId')  # Can be None if new item
        
        logger.info(f"Adding item: {item_name}, category: {category_name}, quantity: {quantity}, item_id: {item_id}")
        
        if not item_name or not category_name:
            return jsonify({'error': 'Item name and category are required'}), 400
        
        category_id = conn.execute('SELECT category_id FROM categories WHERE name = ?', (category_name,)).fetchone()
        
        # Look for item id if exists, otherwise create new item in items table
        #item_id = conn.execute('SELECT item_id FROM items WHERE name = ?', (item_name,)).fetchone()
        if item_id is None:
            # Check if an item with the same name already exists
            existing_item = conn.execute(
                'SELECT item_id FROM items WHERE name = ?',
                (item_name,)
            ).fetchone()
            
            if existing_item:
                # Use the existing item_id
                item_id = existing_item[0]
            else:
                # Insert new item since it doesn't exist
                conn.execute(
                    'INSERT INTO items (name, category_id) VALUES (?, ?)',
                    (item_name, category_id[0])
                )
                item_id = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        
        # Insert item into grocery_list_items table
        try:
            conn.execute('INSERT INTO grocery_list_items (list_id, item_id, quantity) VALUES (?, ?, ?)', (list_id, item_id, quantity))
            conn.commit()
            logger.info(f"Item {item_name} added successfully")
            return jsonify({'success': True}), 201
        except sqlite3.IntegrityError as e:
            logger.error(f"Failed to add item: {e}")
            return jsonify({'error': 'Item already exists in the list'}), 400
        finally:
            conn.close()

@app.route('/dashboard/delete_item', methods=['POST'])
def delete_item():
    #global list_id
    
    if request.method == 'POST':
        conn = get_db_conn()
        
        data = request.get_json()
        list_id = data.get('currentListId')
        item_id = data.get('item_id')
        
        logger.info(f"Deleting item from list {list_id} with ID: {item_id}")
        
        if not item_id:
            return jsonify({'error': 'Item ID is required'}), 400
        
        # Delete item from grocery_list_items table
        conn.execute('DELETE FROM grocery_list_items WHERE list_id = ? AND item_id = ?', (list_id, item_id))
        conn.commit()
        conn.close()
        
        logger.info(f"Item with ID {item_id} deleted successfully")
        return jsonify({'success': True}), 200


@app.route('/dashboard/get_item_suggestions', methods=['GET'])
def get_item_suggestions():
    # Retrieve (item_id, name) from items table for all items 
    # whose name matches the query string (case insensitive, partial match)
    if request.method == 'GET':
        #data = request.get_json() # GET requests don't have a body, so use args instead
        query = request.args.get('query', '').lower()
        
        conn = get_db_conn()
        #items = conn.execute('SELECT item_id, name FROM items WHERE name LIKE ?', (f'%{query}%',)).fetchall()
        items = conn.execute(
            '''
            SELECT item_id, name, category_id
            FROM items
            WHERE name LIKE ?            -- starts with query
            AND name != ?              -- exclude exact matches
            ''',
            (f'{query}%', query)
        ).fetchall()
        conn.close()
        
        items_list = [{'item_id': item[0], 'name': item[1], 'category_id': item[2]} for item in items]
        logger.info(f"Item suggestions for query '{query}': {items_list}")
        return jsonify(items=items_list)

def get_db_conn():
    return sqlite3.connect('grocery.db')

if __name__ == '__main__':
    app.run(debug=True)