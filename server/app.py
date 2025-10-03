from datetime import timedelta, datetime, timezone
import datetime
import sqlite3
import bcrypt
import logging
from flask import Flask, request, jsonify, session
from flask_cors import CORS

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)
app.secret_key = 'S9sAxmnN2n@iS9g(u#N$lSQZOb3o%6'

# Uncomment the following line to enable session expiration after a set time
app.config['SESSION_PERMANENT'] = False
app.permanent_session_lifetime = timedelta(days=7)

@app.route('/login', methods=['POST'])
def login():
    logger.info("Login endpoint reached")

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    keep_logged_in = data.get('keepLoggedIn', False)

    # Query the database for the user
    conn = get_db_conn()
    user_info = conn.execute('SELECT password_hash, user_id FROM users WHERE username = ?', (username,)).fetchone()
    db_pw = user_info[0] if user_info else None
    user_id = user_info[1] if user_info else None
    logger.info(f"Fetched user info for {username}: {user_info}")

    if db_pw is None:
        logger.warning("Incorrect username")
        return jsonify({'success': False, 'error': 'Incorrect username'})
        
    if not bcrypt.checkpw(password.encode('utf-8'), db_pw):
        logger.warning("Incorrect password")
        return jsonify({'success': False, 'error': 'Incorrect password'})
    
    session['username'] = username  # Store username in session
    # *** Use user_id for any database queries instead of username; only use username for display purposes
    session['user_id'] = user_id  # Store user_id in session; more secure than username
    logger.info("Valid Login")
    
    # Uncomment along with the app.permanent_session_lifetime line above to enable session expiration
    if keep_logged_in:
        session.permanent = True
    else:
        session.permanent = False
    
    # Will need to be tied to an option I will add in the future to allow user to immediately get redirected to 
    # their most recently edited list instead of the Dashboard page
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
    
    # If no list exists for user, currentListId will be null
    # Frontend should handle this case by prompting user to create a new list
    return jsonify({'success': True, 'username': username, 'currentListId': current_list_id}), 200

@app.route('/register', methods=['POST'])
def register():
    logger.info("Register endpoint reached")

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password are required'}), 400

    conn = get_db_conn()
    
    # Check if username already exists
    existing_user = conn.execute('SELECT user_id FROM users WHERE username = ?', (username,)).fetchone()
    if existing_user:
        logger.warning(f"Username {username} already exists")
        conn.close()
        return jsonify({'success': False, 'error': 'Username already exists'}), 409

    # Hash the password
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    # Insert new user into the database
    conn.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', (username, hashed_pw))
    conn.commit()
    conn.close()

    logger.info(f"User {username} registered successfully")
    return jsonify({'success': True, 'message': 'User registered successfully'}), 201

@app.route('/logout', methods=['POST'])
def logout():
    session.clear() # Clear all session data
    logger.info("User logged out")
    return jsonify({"success": True, "message": "Logged out successfully"})

@app.route("/me", methods=["GET"])
def me():
    if "username" in session and "user_id" in session:
        return jsonify({
            "loggedIn": True,
            "username": session["username"],
            "currentListId": session.get("current_list_id")
        }), 200
    else:
        return jsonify({"loggedIn": False}), 200

@app.route('/categories', methods=['GET'])
def get_categories():
    conn = get_db_conn()
    categories = conn.execute('SELECT name, category_id FROM categories').fetchall()
    conn.close()
    categories_list = [{'name': c[0], 'category_id': c[1]} for c in categories]
    return jsonify({'success': True, 'categories': categories_list})

@app.route('/dashboard/create_list', methods=['POST'])
def create_list():
    logger.info("Create list endpoint reached")
    
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in'}), 401
    
    data = request.get_json()
    list_name = data.get('listName', 'New List')
    other_users = data.get('otherUsers', [])
    
    user_id = session['user_id']
    
    conn = get_db_conn()
    
    # Insert new list into grocery_lists table
    cursor = conn.cursor()
    cursor.execute('INSERT INTO grocery_lists (name, creation_date, update_date) VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', (list_name,))
    list_id = cursor.lastrowid
    
    # Add current user to grocery_list_users table
    cursor.execute('INSERT INTO grocery_list_users (list_id, user_id) VALUES (?, ?)', (list_id, user_id))
    
    # Add other users to grocery_list_users table if they exist
    # WILL BE PROPERLY IMPLEMENTED LATER
    '''for username in other_users:
        other_user = conn.execute('SELECT user_id FROM users WHERE username = ?', (username,)).fetchone()
        if other_user:
            cursor.execute('INSERT INTO grocery_list_users (list_id, user_id) VALUES (?, ?)', (list_id, other_user[0]))'''
    
    conn.commit()
    conn.close()
    
    logger.info(f"List '{list_name}' created with ID {list_id} by user_id {user_id}")
    
    return jsonify({'success': True, 'listId': list_id}), 201

@app.route('/dashboard/delete_list', methods=['POST'])
def delete_list():
    logger.info("Delete list endpoint reached")
    
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in'}), 401
    
    data = request.get_json()
    list_id = data.get('listId')
    
    if list_id is None:
        return jsonify({'success': False, 'error': 'listId parameter is required'}), 400
    
    user_id = session['user_id']
    
    conn = get_db_conn()
    
    # Check if the user has access to the list
    access_check = conn.execute('SELECT 1 FROM grocery_list_users WHERE list_id = ? AND user_id = ?', (list_id, user_id)).fetchone()
    if not access_check:
        conn.close()
        return jsonify({'success': False, 'error': 'User does not have access to this list'}), 403
    
    try:
        # Delete items associated with the list
        conn.execute('DELETE FROM grocery_list_items WHERE list_id = ?', (list_id,))
        # Delete user associations with the list
        conn.execute('DELETE FROM grocery_list_users WHERE list_id = ?', (list_id,))
        # Delete the list itself
        conn.execute('DELETE FROM grocery_lists WHERE list_id = ?', (list_id,))
        
        conn.commit()
        logger.info(f"List with ID {list_id} deleted successfully by user_id {user_id}")
        return jsonify({'success': True}), 200
    except Exception as e:
        logger.error(f"Error deleting list with ID {list_id}: {e}")
        return jsonify({'success': False, 'error': 'Error deleting list'}), 500
    finally:
        conn.close()

@app.route('/dashboard/lists', methods=['GET'])
def get_user_lists():
    logger.info("Get user lists endpoint reached")
    
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in'}), 401
    
    user_id = session['user_id']
    
    conn = get_db_conn()
    lists = conn.execute('''
        SELECT gl.list_id, gl.name, gl.update_date
        FROM grocery_lists gl
        JOIN grocery_list_users glu ON gl.list_id = glu.list_id
        WHERE glu.user_id = ?
        ORDER BY gl.update_date DESC
    ''', (user_id,)).fetchall()
    conn.close()
    
    lists_info = [{'id': l[0], 'name': l[1], 'updateDate': l[2]} for l in lists]
    logger.info(f"Fetched lists for user_id {user_id}: {lists_info}")
    
    return jsonify({'success': True, 'lists': lists_info})

@app.route('/list/get_items', methods=['GET'])
def get_list_items():
    logger.info("Dashboard endpoint reached")
    
    list_id = request.args.get('list_id', type=int)
    
    if list_id is None:
        return jsonify({'success': False, 'error': 'list_id parameter is required'}), 400
    
    conn = get_db_conn()
    items = conn.execute('''
        SELECT i.name, c.name AS category, gli.quantity, i.item_id
        FROM grocery_list_items gli
        JOIN items i ON gli.item_id = i.item_id
        JOIN categories c ON i.category_id = c.category_id
        WHERE gli.list_id = ?
    ''', (list_id,)).fetchall()

    #logger.info(f"Fetched items: {items}")
    list_info = conn.execute('SELECT name, update_date FROM grocery_lists WHERE list_id = ?', (list_id,)).fetchone()
    list_name = list_info[0] if list_info else ''
    modified = list_info[1] if list_info else None
    
    # NEED TO TEST
    list_users = conn.execute('''
        SELECT u.username
        FROM grocery_list_users glu
        JOIN users u ON glu.user_id = u.user_id
        WHERE glu.list_id = ?
        AND u.user_id != ?
    ''', (list_id, session['user_id'])).fetchall()

    # Convert to a simple list of usernames
    usernames = [row[0] for row in list_users]
    
    conn.close()
    
    items_list = [{'name': item[0], 'category': item[1], 'quantity': item[2], 'item_id': item[3]} for item in items]
    #logger.info(f"items_list: {items_list}")
    return jsonify({'success': True, 'items': items_list, 'listName': list_name, 'modified': modified, 'otherUsers': usernames})

@app.route('/list/add_item', methods=['POST'])
def add_item():
    conn = get_db_conn()
    
    data = request.get_json()
    list_id = data.get('listId')
    item = data.get('item')
    
    logger.info(f"Adding item: {item.get('name')}, category: {item.get('category')}, quantity: {item.get('quantity')}, id: {item.get('id')}")
    
    if not item.get('name') or not item.get('category'):
        return jsonify({'success': False, 'error': 'Item name and category are required'}), 401
    
    category_id = conn.execute('SELECT category_id FROM categories WHERE name = ?', (item.get('category'),)).fetchone()
    
    #logger.info(f"category_id: {category_id}")
    
    # Look for item id if exists, otherwise create new item in items table
    #item_id = conn.execute('SELECT item_id FROM items WHERE name = ?', (item_name,)).fetchone()
    item_id = item.get('id')
    #logger.info(f"item_id: {item_id}")
    if item_id is None:
        # Check if an item with the same name already exists
        existing_item = conn.execute(
            'SELECT item_id FROM items WHERE name = ? AND category_id = ?',
            (item.get('name'), category_id[0])
        ).fetchone()
        
        if existing_item:
            # Use the existing item_id
            item_id = existing_item[0]
            #logger.info("Has Exisiting item")
        else:
            # Insert new item since it doesn't exist
            conn.execute(
                'INSERT INTO items (name, category_id) VALUES (?, ?)',
                (item.get('name'), category_id[0])
            )
            item_id = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
            #logger.info("No existing item")
    
    # Insert item into grocery_list_items table
    try:
        if update_list_modified_date(conn, list_id):
            conn.execute('INSERT INTO grocery_list_items (list_id, item_id, quantity) VALUES (?, ?, ?)', (list_id, item_id, item.get('quantity', 1)))
            conn.commit()
            logger.info(f"Item {item.get('name')} added successfully")
            return jsonify({'success': True}), 200
        else:
            return jsonify({'success': False, 'error': 'Error modifying database'})
    except sqlite3.IntegrityError as e:
        logger.error(f"Failed to add item: {e}")
        return jsonify({'success': False, 'error': 'Item already exists in the list'}), 400
    finally:
        conn.close()

@app.route('/list/edit_item', methods=['POST'])
def edit_item():
    conn = get_db_conn()
    data = request.get_json()
    
    list_id = data.get('listId')
    old_item_data = data.get('oldItem')
    new_item_data = data.get('newItem')
    
    logger.info(f'list_id: {list_id}\told_item: {old_item_data}\tnew_item: {new_item_data}')
    
    differing_value_keys = [k for k in old_item_data if old_item_data[k] != new_item_data[k]]
    
    logger.info(f'Differing keys: {differing_value_keys}')
    
    try:
        if 'id' in differing_value_keys:
            return jsonify({'success': False, 'error': "The item ID was changed, this shouldn't be possible..."})
        elif update_list_modified_date(conn, list_id):
            if 'quantity' in differing_value_keys:
                # find row in grocery_list_items table with corresponding item_id and list_id and update the quantity
                # return
                logger.info(f"Updating quantity to {new_item_data.get('quantity')} for item_id {old_item_data.get('id')} in list_id {list_id}")
                conn.execute('''
                    UPDATE grocery_list_items
                    SET quantity = ?
                    WHERE list_id = ? AND item_id = ?
                ''', (new_item_data.get('quantity'), list_id, old_item_data.get('id')))
                
                conn.commit()
                
                return jsonify({'success': True, 'message': 'Quantity updated successfully'})
            
            if 'category' in differing_value_keys or 'name' in differing_value_keys:
                # check if itemName/category pair exist as row in 'items' table
                # if not, create new item, remove edited item from list, and add the new item in its place
                # *** IDEA *** Might it be good to make (itemName, category) a primary key in the table?
                # return
                category_id = conn.execute('SELECT category_id FROM categories WHERE name = ?', (new_item_data.get('category'),)).fetchone()[0]
                logger.info(f"category_id: {category_id}")
                if category_id is None:
                    return jsonify({'success': False, 'error': 'Category does not exist'})
                exists = conn.execute('SELECT item_id FROM items WHERE name = ? AND category_id = ?', (new_item_data.get('name'), category_id)).fetchone()
                logger.info(f"exists: {exists}")
                if exists is None:
                    # create new item
                    conn.execute('INSERT INTO items (name, category_id) VALUES (?, ?)', (new_item_data.get('name'), category_id))
                    new_item_id = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
                else:
                    new_item_id = exists[0]
                # remove old item from list
                conn.execute('DELETE FROM grocery_list_items WHERE list_id = ? AND item_id = ?', (list_id, old_item_data.get('id'),))
                # add new item to list
                conn.execute('INSERT INTO grocery_list_items (list_id, item_id, quantity) VALUES (?, ?, ?)', (list_id, new_item_id, new_item_data.get('quantity', 1)))
                
                conn.commit()
                
                return jsonify({'success': True, 'message': 'Item updated successfully'})
        
    except Exception as e: #Make more specific
        return jsonify({'success': False, 'error': 'No changes detected.'})
    finally:
        conn.close()


@app.route('/list/delete_item', methods=['POST'])
def delete_item():
    conn = get_db_conn()
    
    data = request.get_json()
    list_id = data.get('currentListId')
    item_id = data.get('itemId')
    
    logger.info(f"Deleting item from list {list_id} with ID: {item_id}")
    
    if not item_id:
        return jsonify({'success': False, 'error': 'Item ID is required'}), 400
    
    # Delete item from grocery_list_items table
    try:
        logger.info('trying delete')
        if update_list_modified_date(conn, list_id):
            logger.info('about to delete')
            conn.execute('DELETE FROM grocery_list_items WHERE list_id = ? AND item_id = ?', (list_id, item_id))
            conn.commit()
            logger.info(f"Item with ID {item_id} deleted successfully")
            return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'Error deleting item'})
    finally:
        conn.close()


@app.route('/list/get_item_suggestions', methods=['GET'])
def get_item_suggestions():
    # Retrieve (item_id, name) from items table for all items 
    # whose name matches the query string (case insensitive, partial match)

    query = request.args.get('query', '').lower()
    
    logger.info(f"Item suggestions endpoint reached with query: {query}")
    
    conn = get_db_conn()
    #items = conn.execute('SELECT item_id, name FROM items WHERE name LIKE ?', (f'%{query}%',)).fetchall()
    items = conn.execute(
        '''
        SELECT item_id, name, category_id
        FROM items
        WHERE name LIKE ?              -- starts with query
        AND name != ? COLLATE NOCASE   -- exclude matches
        ''',
        (f'{query}%', query)
    ).fetchall()
    conn.close()
    
    items_list = [{'item_id': item[0], 'name': item[1], 'category_id': item[2]} for item in items]
    logger.info(f"Item suggestions for query '{query}': {items_list}")
    return jsonify({'success': True, 'items': items_list})


def update_list_modified_date(conn, list_id):
    # Update modified date in grocery_lists table in database
    try:
        conn.execute('''
            UPDATE grocery_lists 
            SET update_date = CURRENT_TIMESTAMP 
            WHERE list_id = ?
        ''', (list_id,))
        
        logger.info("List modification date updated successfully.")
        
        conn.commit()
    except Exception as e:
        return False
    
    return True


def get_db_conn():
    return sqlite3.connect('grocery.db')

if __name__ == '__main__':
    app.run(debug=True)