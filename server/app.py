"""
Main Flask backend script.
"""
from datetime import timedelta
import json
import os
import sqlite3
import bcrypt
from dotenv import load_dotenv
from flask import Flask, request, jsonify, session
from flask_cors import CORS

from notifications import (
    create_notification, 
    create_notifications_for_users, 
    create_notifications_for_users_of_list,
    get_notifications as get_user_notifications,
    NotificationType,
    ActionableNotificationType
)

from logger import logger

load_dotenv()

# Defines app specification
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)
app.secret_key = os.getenv("FLASK_SECRET_KEY")

# Enables session expiration after a set time
app.config['SESSION_PERMANENT'] = False
app.permanent_session_lifetime = timedelta(days=7)


# ------------------------------------------------------------------------
#       ROUTES
# ------------------------------------------------------------------------

@app.route('/login', methods=['POST'])
def login():
    """
    Authenticate a user and initialize their session.

    This route handles user login by validating the provided username and password
    against stored credentials in the database. If authentication succeeds, the user's
    session is initialized with relevant data, including `username`, `user_id`, and
    their most recently edited grocery list (if available).

    ---
    Request JSON Parameters:
    - `username` (str): The user's username.
    - `password` (str): The user's plaintext password.
    - `keepLoggedIn` (bool, optional): Whether to make the session persistent across browser restarts.
      Defaults to `False`.

    Session Data Stored:
    - `username` (str): For display purposes only.
    - `user_id` (int): Used for secure database operations.
    - `current_list_id` (int | None): The most recently edited grocery list, if available.

    Returns:
    - `200 OK` and JSON `{ success: True, username: str, currentListId: int | None }`
      on successful login.
    - `200 OK` and JSON `{ success: False, error: str }` if authentication fails.

    Raises:
    - None directly, but logs warnings for incorrect credentials and info on successful logins.
    """
    logger.info("Login endpoint reached")

    # Get data from frontend request
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    keep_logged_in = data.get('keepLoggedIn', False)

    # Query the database for the user and determine if login info is correct
    with get_db_conn() as conn:
        cursor = conn.cursor()
        
        user_info = cursor.execute('SELECT password_hash, user_id FROM users WHERE username = ?', (username,)).fetchone()
        db_pw = user_info[0] if user_info else None
        user_id = user_info[1] if user_info else None

        # If password does not exist in database for username, then user does not exist
        if db_pw is None:
            logger.warning("Incorrect username.")
            return jsonify({'success': False, 'error': 'Incorrect username.'})
            
        # Compares entered password with hashed password in DB.
        # If they do not match, an incorrect password was entered.
        if not bcrypt.checkpw(password.encode('utf-8'), db_pw):
            logger.warning("Incorrect password.")
            return jsonify({'success': False, 'error': 'Incorrect password.'})
        
        # Store username and user_id in session
        session['username'] = username
        session['user_id'] = user_id
        
        # If 'Keep Logged In' selected on frontend, disable session expiration
        if keep_logged_in:
            session.permanent = True
        else:
            session.permanent = False
        
        # Retrieve most recently updated list
        # ------------------------------------
        # - This is intended for a future option of skipping the dashboard page 
        #   and immediately redirecting to a list on login
        # - The logic currently does not make the most sense, as the update_data 
        #   is updated with any user's change to a list, not the current user.
        #   Instead, it would probably be better to save the ID of the user's 
        #   currently viewed/edited list whenever they make a change to a list.
        # ------------------------------------
        # ******** 
        # NEEDS FIXING/REWRITING
        # ********
        #
        #
        #
        # ------------------------------------
        recent_list = cursor.execute('''
            SELECT gl.list_id
            FROM grocery_lists gl
            JOIN grocery_list_users glu ON gl.list_id = glu.list_id
            WHERE glu.user_id = ?
            ORDER BY gl.update_date DESC
            LIMIT 1
        ''', (user_id,)).fetchone()
        
        current_list_id = recent_list[0] if recent_list else None
        session['current_list_id'] = current_list_id
    
    # If no list exists for user, currentListId will be null
    # Frontend should handle this case by prompting user to create a new list
    return jsonify({'success': True, 'username': username, 'currentListId': current_list_id}), 200

@app.route('/register', methods=['POST'])
def register():
    """
    Register a new user.

    This route handles user registration by requiring a username and password from the frontend. 
    It verifies that the new username does not already exist in an entry in the database.

    ---
    Request JSON Parameters:
    - `username` (str): The user's desired username.
    - `password` (str): The user's desired password.

    Session Data Stored:
    - `username` (str): For display purposes only.
    - `user_id` (int): Used for secure database operations.
    - `current_list_id` (int | None): The most recently edited grocery list, if available.

    Returns:
    - `200 OK` and JSON `{ success: True, username: str, currentListId: int | None }`
      on successful login.
    - `200 OK` and JSON `{ success: False, error: str }` if authentication fails.

    Raises:
    - None directly, but logs warnings for incorrect credentials and info on successful logins.
    """
    logger.info("Register endpoint reached")

    # Get data from frontend
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Return error message if username or password do not exist
    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password are required'})

    with get_db_conn() as conn:
        # Check if username already exists
        cursor = conn.cursor()
        existing_user = cursor.execute('SELECT user_id FROM users WHERE username = ?', (username,)).fetchone()
        if existing_user:
            return jsonify({'success': False, 'error': 'Username already exists'})

        # Hash the password
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Insert new user into the database
        cursor.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', (username, hashed_pw))

    return jsonify({'success': True, 'message': 'User registered successfully'}), 201

@app.route('/logout', methods=['POST'])
def logout():
    """
    Logs out user and clears their session.

    ---
    Session Data Removed:
    - `username` (str): For display purposes only.
    - `user_id` (int): Used for secure database operations.
    - `current_list_id` (int | None): The most recently edited grocery list, if available.

    Returns:
    - `200 OK` and JSON `{ success: True, message: str }` on successful logout.
    """
    session.clear() # Clear all session data
    return jsonify({"success": True, "message": "Logged out successfully"}), 200

@app.route("/me", methods=["GET"])
def me():
    """
    Retrieve user and session information.

    ---
    Returns:
    - `200 OK` and JSON `{ loggedIn: True, username: str, currentListId: int | None }`
      if session active.
    - `200 OK` and JSON `{ loggedIn: False }` if session does not exist.
    """
    if "username" in session and "user_id" in session:
        return jsonify({
            "loggedIn": True,
            "username": session["username"],
            "currentListId": session.get("current_list_id")
        }), 200
    else:
        return jsonify({"loggedIn": False}), 200

@app.route("/get_theme", methods=["GET"])
def get_theme():
    """
    Retrieve user theme information.

    ---
    Returns:
    - `200 OK` and JSON `{ success: True, theme: str }`
    """
    theme = session.get('theme', 'light')
    return jsonify({'success': True, 'theme': theme})

@app.route("/set_theme", methods=['POST'])
def set_theme():
    """
    Sets user theme in session.
    
    For now, this is intended to only support 'light' and 'dark' themes.

    ---
    Request JSON Parameters:
    - `new_theme` (str): The user's new theme.
    
    Returns:
    - `200 OK` and JSON `{ success: True, theme: str }` if success setting theme.
    - `400 Bad Request` and JSON `{ success: False, error: str }` if error setting theme.
    """
    data = request.get_json()
    new_theme = data.get('newTheme')
    
    if new_theme not in ['light', 'dark']:
        return jsonify({'success': False, 'error': 'Invalid theme'}), 400

    session['theme'] = new_theme
    return jsonify({'success': True, 'theme': new_theme})

@app.route('/get_notifications', methods=['GET'])
def get_notifications():
    """
    Retrieve user's notifications.

    ---
    Returns:
    - `200 OK` and JSON `{ success: True, notifications: [... ] }` on success.
    - `401 Unauthorized` and JSON `{ success: False, error: str }` if user not logged in.
    """
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in'}), 401
    
    user_id = session['user_id']
    
    with get_db_conn() as conn:
        cursor = conn.cursor()
        
        # Get user's notifications
        notifications = get_user_notifications(cursor, user_id)
    
    # Construct list of dicts of notifications
    notifications_list = [{
        'id': n[0],
        'icon': n[1],
        'message': n[2],
        'actionable': bool(n[3]),
        'action_type': n[4],
        'requested_list_id': n[5],
        'unread': bool(n[6]),
        'created_at': n[7],
        'data': n[8]
    } for n in notifications]
    
    return jsonify({'success': True, 'notifications': notifications_list})

@app.route('/mark_notifications_as_read', methods=['PUT'])
def mark_notifications_as_read():
    """
    Mark specified notifications as read.
    
    Notification IDs are provided in the request body as a list.

    ---
    Request JSON Parameters:
    - `notification_ids` (list[int]): list of notification IDs to mark as read.
    
    Returns:
    - `200 OK` and JSON `{ success: True, message: str }` on success.
    - `500 Internal Server Error` and JSON `{ success: False, error: str }` 
        if database error occurs.
    
    Raises:
    - None directly, but returns error message if database operation fails.
    """
    logger.info("Mark notifications as read endpoint reached")
    
    data = request.get_json()
    notification_ids = data.get('notificationIds', [])
    
    with get_db_conn() as conn:
        cursor = conn.cursor()
        try:
            for n_id in notification_ids: 
                cursor.execute('''
                    UPDATE notifications
                    SET unread = ?
                    WHERE id = ?               
                ''', (0, n_id))
        except Exception as e:
            return jsonify({'success': False, 'error': f'Error marking notification as read: {e}'}), 500
    
    return jsonify({'success': True, 'message': 'Notifications successfully marked as read!'}), 200

@app.route('/delete_notifications', methods=['POST'])
def delete_notifications():
    """
    Delete specified notifications from the database.
    
    This endpoint removes one or more notifications identified by their IDs.  
    Notification IDs should be provided in the request body as a list.

    ---
    Request JSON Parameters:
    - `notificationIds` (list[int]): List of notification IDs to delete.

    Returns:
    - `200 OK` and JSON `{ success: True, message: str }` on successful deletion.
    - `500 Internal Server Error` and JSON `{ success: False, error: str }` if a database error occurs.

    Raises:
    - None directly, but returns an error message if a database operation fails.
    """
    logger.info("Delete notifications endpoint reached")
    
    data = request.get_json()
    notification_ids = data.get('notificationIds', [])
    
    with get_db_conn() as conn:
        cursor = conn.cursor()
        try:
            for n_id in notification_ids:
                cursor.execute('''
                    DELETE FROM notifications
                    WHERE id = ?     
                ''', (n_id,))
        except Exception as e:
            logger.error(f"Error deleting notification: {e}")
            return jsonify({'success': False, 'error': f'Error deleting notification: {e}'}), 500
            
    return jsonify({'success': True, 'message': 'Deleted notifications successfully!'}), 200

@app.route('/categories', methods=['GET'])
def get_categories():
    """
    Retrieve grocery list item categories.
    
    The list of categories is treated as a constant and created during database initialization.

    ---
    Returns:
    - `200 OK` and JSON `{ success: True, categories: [... ] }` on success.
    - `500 Internal Server Error` and JSON `{ success: False, error: str }` on database failure.
    """
    # Retrieve categories from database
    with get_db_conn() as conn:
        cursor = conn.cursor()
        try:
            categories = cursor.execute('SELECT name, category_id FROM categories').fetchall()
        except Exception as e:
            return jsonify({'success': False, 'error': f'Error retrieving categories: {e}'}), 500
    
    categories_list = [{'name': c[0], 'category_id': c[1]} for c in categories]
    return jsonify({'success': True, 'categories': categories_list}), 200

@app.route('/dashboard/lists', methods=['GET'])
def get_user_lists():
    """
    Retrieve all grocery lists associated with the logged-in user.

    This endpoint fetches all grocery lists where the user is a member, 
    including details such as list name, role, last update date, and 
    other users who share the list.

    ---
    Returns:
    - `200 OK` and JSON `{ success: True, lists: list[dict] }` on success.
        Each list dictionary includes:
        - `id` (int): The unique list ID.
        - `name` (str): The list name.
        - `type` (str): Either `"shared"` or `"private"`.
        - `role` (str): The current user's role in the list (e.g., `"Owner"`, `"Editor"`, `"Viewer"`).
        - `last_updated` (str): Timestamp of the last modification.
        - `other_users` (list[dict]): Other users on the list, where each object includes:
            - `user_id` (int)
            - `username` (str)
            - `role` (str)
    - `401 Unauthorized` and JSON `{ success: False, error: str }` if the user is not logged in.
    - `500 Internal Server Error` and JSON `{ success: False, error: str }` if a database error occurs.

    Raises:
    - None directly, but returns an error message for authentication or database failures.
    """
    logger.info("Get user lists endpoint reached")
    
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in'}), 401
    
    user_id = session['user_id']
    
    with get_db_conn() as conn:
        cursor = conn.cursor()
        try:
            # Retrieve list ID, list name, user's role, and update date of all user's lists
            lists = cursor.execute('''
                SELECT gl.list_id, gl.name, glu.role, gl.update_date
                FROM grocery_lists gl
                JOIN grocery_list_users glu ON gl.list_id = glu.list_id
                WHERE glu.user_id = ?
                ORDER BY gl.update_date DESC
            ''', (user_id,)).fetchall()
            
            list_ids = [l[0] for l in lists]
            
            if list_ids:
                other_users_map = {}
                placeholders = ', '.join(['?'] * len(list_ids))

                other_users_query = f'''
                    SELECT glu.list_id, glu.user_id, u.username, glu.role
                    FROM grocery_list_users glu
                    JOIN users u ON glu.user_id = u.user_id
                    WHERE glu.list_id IN ({placeholders})
                    AND glu.user_id != ?
                '''
                
                # Get list of (list_id, user_id, username, role) for all other users for every list the
                # logged in user has access to
                other_users_rows = conn.execute(other_users_query, (*list_ids, user_id)).fetchall()

                for list_id, user_id, username, role in other_users_rows:
                    user_data = {'user_id': user_id, 'username': username, 'role': role.capitalize()}
                    if list_id not in other_users_map:
                        other_users_map[list_id] = []
                    other_users_map[list_id].append(user_data)
        except Exception as e:
            logger.error(f"Error retrieving lists: {e}")
            return jsonify({'success': False, 'error': f'Error retrieving lists: {e}'}), 500
    
    # Construct list to send to frontend with list info
    lists_info = []
    for l in lists:
        list_id, name, role, update_date = l
        list_type = "shared" if list_id in other_users_map else "private"
        lists_info.append({
            'id': list_id,
            'name': name,
            'type': list_type,
            'role': role.capitalize(),
            'last_updated': update_date,
            'other_users': other_users_map.get(list_id, [])
        })
        
    return jsonify({'success': True, 'lists': lists_info})

@app.route('/list/get_list_data', methods=['GET'])
def get_list_data():
    """
    Retrieve all data for a specific grocery list.

    ---
    Query Parameters:
    - `list_id` (int, required): The ID of the grocery list to retrieve.

    Returns:
    - `200 OK` and JSON:
        {
            "success": True,
            "userRole": str,
            "items": [ { "name": str, "category": str, "quantity": int, "item_id": int }, ... ],
            "listName": str,
            "modified": str,
            "otherUsers": [ { "user_id": int, "username": str, "role": str }, ... ]
        }
    - `400 Bad Request` and JSON `{ success: False, error: str }` if missing list_id.
    - `403 Forbidden` and JSON `{ success: False, error: str }` if user lacks permission.
    - `500 Internal Server Error` and JSON `{ success: False, error: str }` if an unexpected error occurs.

    Raises:
    - None directly, but may return structured error JSON on database or access errors.
    """
    logger.info("Get List Data endpoint reached")
    
    # Get list ID from request
    list_id = request.args.get('list_id', type=int)
    
    if list_id is None:
        return jsonify({'success': False, 'error': 'list_id parameter is required'}), 400
    
    with get_db_conn() as conn:
        cursor = conn.cursor()
        try:
            # Get user's role in list
            user_role = cursor.execute('''
                SELECT role
                FROM grocery_list_users
                WHERE list_id = ? 
                AND user_id = ?                               
            ''', (list_id, session['user_id'])).fetchone()
            
            if not user_role:
                return jsonify({'success': False, 'error': 'You do not have access to this list!'}), 403
            
            # Get all (item name, category name, item quantity, item ID) groups for specified list
            items = cursor.execute('''
                SELECT i.name, c.name AS category, gli.quantity, i.item_id
                FROM grocery_list_items gli
                JOIN items i ON gli.item_id = i.item_id
                JOIN categories c ON i.category_id = c.category_id
                WHERE gli.list_id = ?
            ''', (list_id,)).fetchall()

            list_info = cursor.execute('SELECT name, update_date FROM grocery_lists WHERE list_id = ?', (list_id,)).fetchone()
            list_name = list_info[0] if list_info else ''
            modified = list_info[1] if list_info else None
            
            # Get other users and their roles of the specified list
            list_users = cursor.execute('''
                SELECT u.user_id, u.username, glu.role
                FROM grocery_list_users glu
                JOIN users u ON glu.user_id = u.user_id
                WHERE glu.list_id = ?
                AND u.user_id != ?
            ''', (list_id, session['user_id'])).fetchall()
        except Exception as e:
            logger.error(f"Error retrieving list data: {e}")
            return jsonify({'success': False, 'error': f'Error retrieving list data: {e}'}), 500

        other_users = [{'user_id': user[0], 'username': user[1], 'role': user[2].capitalize()} for user in list_users]
    
    items_list = [{'name': item[0], 'category': item[1], 'quantity': item[2], 'item_id': item[3]} for item in items]

    return jsonify({'success': True, 'userRole': user_role[0].capitalize(), 'items': items_list, 'listName': list_name, 'modified': modified, 'otherUsers': other_users})

@app.route('/dashboard/create_list', methods=['POST'])
def create_list():
    """
    Create a new grocery list for the logged-in user.

    This endpoint allows an authenticated user to create a new grocery list.  
    The list is automatically assigned to the creator as the 'owner'.  
    Optional additional users can be invited, and notifications will be sent to them.

    ---
    Request JSON Parameters:
    - `listName` (str, optional): The name of the new grocery list. Defaults to `"New List"`.
    - `otherUsers` (list[dict], optional): A list of user objects to invite.  
      Each object should include:
        - `user_id` (int): The invited user's ID.  
        - `role` (str): The role of the invited user in the list (e.g., `"editor"`, `"viewer"`).

    Returns:
    - `201 Created` and JSON `{ success: True, listId: int }` on success.
    - `401 Unauthorized` and JSON `{ success: False, error: str }` if the user is not logged in.
    - `500 Internal Server Error` and JSON `{ success: False, error: str }` if a database or unexpected error occurs.

    Raises:
    - None directly, but returns error messages for authentication or database failures.
    """
    logger.info("Create list endpoint reached")
    
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in'}), 401
    
    # Get data from frontend
    data = request.get_json()
    list_name = data.get('listName', 'New List')
    other_users = data.get('otherUsers', [])
    
    user_id = session['user_id']
    
    with get_db_conn() as conn:
        cursor = conn.cursor()
        
        try:
            # Insert new list into grocery_lists table
            cursor.execute('INSERT INTO grocery_lists (name, creation_date, update_date) VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', (list_name,))
            list_id = cursor.lastrowid
            
            # Add current user to grocery_list_users table
            cursor.execute('INSERT INTO grocery_list_users (list_id, user_id, role) VALUES (?, ?, ?)', (list_id, user_id, 'owner'))
            
            # Create invite notifications for added users
            user_ids = [user['user_id'] for user in other_users]
            create_notifications_for_users(
                cur=cursor,
                user_ids=user_ids,
                message=f"{session['username']} invites you to grocery list '{list_name}'.",
                icon=NotificationType.INVITE.value,
                actionable=True,
                action_type=ActionableNotificationType.JOIN_LIST_REQUEST.value,
                requested_list_id=list_id,
                unread=True,
                data={'user_roles': [user['role'] for user in other_users]}
            )
        except Exception as e:
            logger.error(f"Error creating new list: {e}")
            return jsonify({'success': False, 'error': 'Error creating new list'}), 500
    
    return jsonify({'success': True, 'listId': list_id}), 201

@app.route('/dashboard/delete_list', methods=['POST'])
def delete_list():
    """
    Deletes a specified grocery list.

    This endpoint allows an authenticated user to delete a grocery list.  
    They must have access to the list they are trying to delete.  
    Notifications will be sent to all other users that were a part of the list.

    ---
    Request JSON Parameters:
    - `listId` (int): The ID of the list to be deleted.

    Returns:
    - `200 OK` and JSON `{ success: True }` on successful deletion.
    - `400 Bad Request` and JSON `{ success: False, error: str }` if the list ID is missing.
    - `401 Unauthorized` and JSON `{ success: False, error: str }` if the user is not logged in.
    - `401 Forbidden` and JSON `{ success: False, error: str }` if the user does not have access to the list.
    - `500 Internal Server Error` and JSON `{ success: False, error: str }` if a database or unexpected error occurs.

    Raises:
    - None directly, but returns error messages for authentication or database failures.
    """
    logger.info("Delete list endpoint reached")
    
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in'}), 401
    
    data = request.get_json()
    list_id = data.get('listId')
    
    if list_id is None:
        return jsonify({'success': False, 'error': 'listId parameter is required'}), 400
    
    user_id = session['user_id']
    
    with get_db_conn() as conn:
        cursor = conn.cursor()
        
        try:
            # Check if the user has access to the list
            access_check = cursor.execute('SELECT 1 FROM grocery_list_users WHERE list_id = ? AND user_id = ?', (list_id, user_id)).fetchone()
            if not access_check:
                return jsonify({'success': False, 'error': 'User does not have access to this list'}), 403
            
            # Retrieve list name
            list_name = cursor.execute('SELECT name FROM grocery_lists WHERE list_id = ?', (list_id,)).fetchone()[0]
        
            # Get other users of list
            other_users = cursor.execute('SELECT user_id FROM grocery_list_users WHERE list_id = ? AND user_id != ?', (list_id, user_id)).fetchall()
            other_user_ids = [u[0] for u in other_users]
            
            # Send notifications to other users that the list has been deleted
            create_notifications_for_users(
                cur=cursor,
                user_ids=other_user_ids,
                message=f"{session['username']} has deleted grocery list {list_name}.",
                icon=NotificationType.DELETE.value,
            )
            
            # Delete items associated with the list
            cursor.execute('DELETE FROM grocery_list_items WHERE list_id = ?', (list_id,))
            # Delete user associations with the list
            cursor.execute('DELETE FROM grocery_list_users WHERE list_id = ?', (list_id,))
            # Delete the list itself
            cursor.execute('DELETE FROM grocery_lists WHERE list_id = ?', (list_id,))
        except Exception as e:
            logger.error(f"Error deleting list with ID {list_id}: {e}")
            return jsonify({'success': False, 'error': f'Error deleting list: {e}'}), 500
    
    return jsonify({'success': True}), 200














# *****************************
# EVERYTHING ABOVE IS COMMENTED/HAS DOCSTRINGS
# ****************************



@app.route('/dashboard/edit_list', methods=['PUT'])
def edit_list():
    logger.info("Edit list endpoint")
    
    data = request.get_json()
    list_id = data.get('listId')
    list_name = data.get('listName')
    list_other_users = data.get('otherUsers', [])
    
    if not list_id or not list_name:
        return jsonify({'success': False, 'error': 'Missing list ID or name'})
    
    with get_db_conn() as conn:
        cursor = conn.cursor()
        old_name = cursor.execute('SELECT name FROM grocery_lists WHERE list_id = ?', (list_id,)).fetchone()[0]
        
        cursor.execute('''
            UPDATE grocery_lists 
            SET name = ?, update_date = CURRENT_TIMESTAMP
            WHERE list_id = ?
        ''', (list_name, list_id))
        
        if old_name != list_name:
            # Notify other users of list name change
            create_notifications_for_users(
                cur=cursor,
                user_ids=[u['user_id'] for u in list_other_users],
                message=f"{session['username']} changed the name of grocery list from '{old_name}' to '{list_name}'.",
                icon=NotificationType.EDIT.value
            )
        
        
        
        old_other_users = cursor.execute('''
            SELECT user_id, role
            FROM grocery_list_users
            WHERE list_id = ? AND user_id != ?
        ''', (list_id, session.get('user_id'))).fetchall()
        
        old_users_dict = {u[0]: u[1].lower() for u in old_other_users}
        new_users_dict = {u.get('user_id'): u.get('role').lower() for u in list_other_users}

        added_user_ids = [u_id for u_id in new_users_dict if u_id not in old_users_dict]
        removed_user_ids = [u_id for u_id in old_users_dict if u_id not in new_users_dict]
        changed_roles = {
            u_id: (old_users_dict[u_id], new_users_dict[u_id])
            for u_id in old_users_dict.keys() & new_users_dict.keys()
            if old_users_dict[u_id] != new_users_dict[u_id]
        }
        
        create_notifications_for_users(
            cur=cursor,
            user_ids=added_user_ids,
            message=f"{session['username']} invites you to grocery list '{list_name}'.",
            icon=NotificationType.INVITE.value,
            actionable=True,
            action_type=ActionableNotificationType.JOIN_LIST_REQUEST.value,
            requested_list_id=list_id
        )
        
        create_notifications_for_users(
            cur=cursor,
            user_ids=removed_user_ids,
            message=f"{session['username']} removed you from grocery list '{list_name}'.",
            icon=NotificationType.DELETE.value
        )
        for user_id in removed_user_ids:
            cursor.execute('''
                DELETE FROM grocery_list_users
                WHERE list_id = ? AND user_id = ?
            ''', (list_id, user_id))
        
        for user_id, (old_role, new_role) in changed_roles.items():
            create_notification(
                cur=cursor,
                user_id=user_id,
                message=f"{session['username']} changed your role from '{old_role.capitalize()}' to '{new_role.capitalize()}' in grocery list '{list_name}'.",
                icon=NotificationType.EDIT.value
            )
            cursor.execute('''
               UPDATE grocery_list_users
               SET role = ?
               WHERE user_id = ? AND list_id = ?            
            ''', (new_role, user_id, list_id))
    
    return jsonify({'success': True, 'message': 'Successfully updated list!'})

@app.route('/list/add_item', methods=['POST'])
def add_item():
    data = request.get_json()
    list_id = data.get('listId')
    item = data.get('item')
    
    # ****************
    # NEED TO ADD CHECK IF USER IS A PART OF LIST
    # ****************
    
    logger.info(f"Adding item: {item.get('name')}, category: {item.get('category')}, quantity: {item.get('quantity')}, id: {item.get('id')}")
    
    if not item.get('name') or not item.get('category'):
        return jsonify({'success': False, 'error': 'Item name and category are required'}), 401
    
    with get_db_conn() as conn:
        cursor = conn.cursor()
        
        list_name = cursor.execute('SELECT name FROM grocery_lists WHERE list_id = ?', (list_id,)).fetchone()[0]
        
        category_id = cursor.execute('SELECT category_id FROM categories WHERE name = ?', (item.get('category'),)).fetchone()
        
        item_id = item.get('id')
        if item_id is None:
            # Check if an item with the same name already exists
            existing_item = cursor.execute(
                'SELECT item_id FROM items WHERE name = ? AND category_id = ?',
                (item.get('name'), category_id[0])
            ).fetchone()
            
            if existing_item:
                # Use the existing item_id
                item_id = existing_item[0]
            else:
                # Insert new item since it doesn't exist
                cursor.execute(
                    'INSERT INTO items (name, category_id) VALUES (?, ?)',
                    (item.get('name'), category_id[0])
                )
                item_id = cursor.execute('SELECT last_insert_rowid()').fetchone()[0]
                #logger.info("No existing item")
        
        # Insert item into grocery_list_items table
        try:
            if update_list_modified_date(cursor, list_id):
                cursor.execute('INSERT INTO grocery_list_items (list_id, item_id, quantity) VALUES (?, ?, ?)', (list_id, item_id, item.get('quantity', 1)))
                logger.info(f"Item {item.get('name')} added successfully")
                
                create_notifications_for_users_of_list(
                    cur=cursor,
                    list_id=list_id,
                    creator_user_id=session['user_id'],
                    message=f"{session['username']} added '{item.get('name')}' to list '{list_name}'.",
                    icon=NotificationType.DEFAULT.value
                )
                
                return jsonify({'success': True}), 200
            else:
                return jsonify({'success': False, 'error': 'Error modifying database'})
        except sqlite3.IntegrityError as e:
            logger.error(f"Failed to add item: {e}")
            return jsonify({'success': False, 'error': 'Item already exists in the list'}), 400
        #finally:
        #    conn.close()

@app.route('/list/edit_item', methods=['POST'])
def edit_item():
    conn = get_db_conn()
    data = request.get_json()
    
    list_id = data.get('listId')
    old_item_data = data.get('oldItem')
    new_item_data = data.get('newItem')
    
    # ****************
    # NEED TO ADD CHECK IF USER IS A PART OF LIST
    # ****************
    user_in_list = conn.execute('''
        SELECT 1
        FROM grocery_list_users
        WHERE list_id = ? AND user_id = ?
    ''', (list_id, session['user_id'])).fetchone()
    
    if not user_in_list:
        return jsonify({'success': False, 'error': 'User does not have access to this list'}), 403
    
    logger.info(f'list_id: {list_id}\told_item: {old_item_data}\tnew_item: {new_item_data}')
    
    differing_value_keys = [k for k in old_item_data if old_item_data[k] != new_item_data[k]]
    
    logger.info(f'Differing keys: {differing_value_keys}')
    
    with get_db_conn() as conn:
        cursor = conn.cursor()
        
        list_name = cursor.execute('SELECT name FROM grocery_lists WHERE list_id = ?', (list_id,)).fetchone()[0]
        
        try:
            if 'id' in differing_value_keys:
                return jsonify({'success': False, 'error': "The item ID was changed, this shouldn't be possible..."})
            elif update_list_modified_date(cursor, list_id):
                if 'quantity' in differing_value_keys:
                    # find row in grocery_list_items table with corresponding item_id and list_id and update the quantity
                    # return
                    logger.info(f"Updating quantity to {new_item_data.get('quantity')} for item_id {old_item_data.get('id')} in list_id {list_id}")
                    cursor.execute('''
                        UPDATE grocery_list_items
                        SET quantity = ?
                        WHERE list_id = ? AND item_id = ?
                    ''', (new_item_data.get('quantity'), list_id, old_item_data.get('id')))
                    
                    create_notifications_for_users_of_list(
                        cur=cursor,
                        list_id=list_id,
                        creator_user_id=session['user_id'],
                        message=f"{session['username']} updated the quantity of '{old_item_data.get('name')}' to {new_item_data.get('quantity')}.",
                        icon=NotificationType.EDIT.value
                    )
                    
                    return jsonify({'success': True, 'message': 'Quantity updated successfully'})
                
                if 'category' in differing_value_keys or 'name' in differing_value_keys:
                    # check if itemName/category pair exist as row in 'items' table
                    # if not, create new item, remove edited item from list, and add the new item in its place
                    # *** IDEA *** Might it be good to make (itemName, category) a primary key in the table?
                    # return
                    category_id = cursor.execute('SELECT category_id FROM categories WHERE name = ?', (new_item_data.get('category'),)).fetchone()[0]
                    logger.info(f"category_id: {category_id}")
                    if category_id is None:
                        return jsonify({'success': False, 'error': 'Category does not exist'})
                    exists = cursor.execute('SELECT item_id FROM items WHERE name = ? AND category_id = ?', (new_item_data.get('name'), category_id)).fetchone()
                    logger.info(f"exists: {exists}")
                    if exists is None:
                        # create new item
                        cursor.execute('INSERT INTO items (name, category_id) VALUES (?, ?)', (new_item_data.get('name'), category_id))
                        new_item_id = cursor.execute('SELECT last_insert_rowid()').fetchone()[0]
                    else:
                        new_item_id = exists[0]
                    # remove old item from list
                    cursor.execute('DELETE FROM grocery_list_items WHERE list_id = ? AND item_id = ?', (list_id, old_item_data.get('id'),))
                    # add new item to list
                    cursor.execute('INSERT INTO grocery_list_items (list_id, item_id, quantity) VALUES (?, ?, ?)', (list_id, new_item_id, new_item_data.get('quantity', 1)))
                    
                    if 'category' in differing_value_keys and 'name' in differing_value_keys:
                        change_desc = f"name of '{old_item_data.get('name')}' to '{new_item_data.get('name')}' and category to '{new_item_data.get('category')}'"
                    elif 'category' in differing_value_keys:
                        change_desc = f"category of '{old_item_data.get('name')}' to '{new_item_data.get('category')}'"
                    else:
                        change_desc = f"name of '{old_item_data.get('name')}' to '{new_item_data.get('name')}'"
                        
                    create_notifications_for_users_of_list(
                        cur=cursor,
                        list_id=list_id,
                        creator_user_id=session['user_id'],
                        message=f"{session['username']} updated the {change_desc} in list '{list_name}'.",
                        icon=NotificationType.EDIT.value
                    )
                    
                    return jsonify({'success': True, 'message': 'Item updated successfully'})
            
        except Exception as e: #Make more specific
            return jsonify({'success': False, 'error': 'No changes detected.'})
        #finally:
        #    conn.close()

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
    with get_db_conn() as conn:
        cursor = conn.cursor()
        
        list_name = cursor.execute('SELECT name FROM grocery_lists WHERE list_id = ?', (list_id,)).fetchone()[0]
        
        try:
            #logger.info('trying delete')
            if update_list_modified_date(cursor, list_id):
                #logger.info('about to delete')
                cursor.execute('DELETE FROM grocery_list_items WHERE list_id = ? AND item_id = ?', (list_id, item_id))
                
                item_name = cursor.execute('SELECT name FROM items WHERE item_id = ?', (item_id,)).fetchone()[0]
                
                create_notifications_for_users_of_list(
                    cur=cursor,
                    list_id=list_id,
                    creator_user_id=session['user_id'],
                    message=f"{session['username']} deleted '{item_name}' from list '{list_name}'.",
                    icon=NotificationType.DELETE.value
                )
                
                logger.info(f"Item with ID {item_id} deleted successfully")
                return jsonify({'success': True}), 200
        except Exception as e:
            return jsonify({'success': False, 'error': 'Error deleting item'})
        #finally:
        #    conn.close()

@app.route('/list/add_user_to_list', methods=['POST'])
def add_user_to_list():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in.'}), 401
    
    data = request.get_json()
    list_id = data.get('currentListId')
    username = data.get('username')
    notif_data = json.loads(data.get('data', {}))
    
    logger.info(f"Notif_data: {notif_data}\tVar type: {type(notif_data)}")
    
    #logger.info(f"Adding user {new_user} to list {list_id}")
    
    with get_db_conn() as conn:
        cursor = conn.cursor()
        user_id = cursor.execute('SELECT user_id FROM users WHERE username = ?', (username,)).fetchone()[0]
        role = notif_data.get('user_role', 'viewer').lower()
        cursor.execute('''
            INSERT OR IGNORE INTO grocery_list_users (list_id, user_id, role) VALUES (?, ?, ?)
        ''', (list_id, user_id, role))
    
    return jsonify({'success': True, 'message': f'Successfully added user {username} to list with id {list_id}'})

@app.route('/list/manage_users_of_list', methods=['POST'])
def manage_users_of_list():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in.'}), 401
    
    data = request.get_json()
    list_id = data.get('currentListId')
    other_users = data.get('otherUsers', [])
    
    logger.info(f"Updating list {list_id}'s users: {other_users}")
    
    with get_db_conn() as conn:
        cursor = conn.cursor()
        
        list_name = cursor.execute('''
            SELECT name
            FROM grocery_lists
            WHERE list_id = ?                           
        ''', (list_id,)).fetchone()[0]
        
        old_other_users = cursor.execute('''
            SELECT user_id, role
            FROM grocery_list_users
            WHERE list_id = ? AND user_id != ?
        ''', (list_id, session.get('user_id'))).fetchall()
        
        logger.info(f"Old other users: {old_other_users}") # list of (user_id, role) tuples
        logger.info(f"New other users: {other_users}") # list of {'user_id': ..., 'username': ..., 'role': ...} dicts
        
        old_users_dict = {u[0]: u[1].lower() for u in old_other_users}
        new_users_dict = {u['user_id']: u['role'].lower() for u in other_users}

        added_user_ids = [u_id for u_id in new_users_dict if u_id not in old_users_dict]
        removed_user_ids = [u_id for u_id in old_users_dict if u_id not in new_users_dict]
        changed_roles = {
            u_id: (old_users_dict[u_id], new_users_dict[u_id])
            for u_id in old_users_dict.keys() & new_users_dict.keys()
            if old_users_dict[u_id] != new_users_dict[u_id]
        }
        
        #added_user_ids = [user['user_id'] for user in added_users]
        create_notifications_for_users(
            cur=cursor,
            user_ids=added_user_ids,
            message=f"{session['username']} invites you to grocery list '{list_name}'.",
            icon=NotificationType.INVITE.value,
            actionable=True,
            action_type=ActionableNotificationType.JOIN_LIST_REQUEST.value,
            requested_list_id=list_id
        )
        
        #removed_user_ids = [user['user_id'] for user in removed_users]
        create_notifications_for_users(
            cur=cursor,
            user_ids=removed_user_ids,
            message=f"{session['username']} removed you from grocery list '{list_name}'.",
            icon=NotificationType.DELETE.value
        )
        
        for user_id in removed_user_ids:
            cursor.execute('''
                DELETE FROM grocery_list_users
                WHERE list_id = ? AND user_id = ?
            ''', (list_id, user_id))
        
        for user_id, (old_role, new_role) in changed_roles.items():
            create_notification(
                cur=cursor,
                user_id=user_id,
                message=f"{session['username']} changed your role from '{old_role.capitalize()}' to '{new_role.capitalize()}' in grocery list '{list_name}'.",
                icon=NotificationType.EDIT.value
            )
            cursor.execute('''
               UPDATE grocery_list_users
               SET role = ?
               WHERE user_id = ? AND list_id = ?            
            ''', (new_role, user_id, list_id))
    
    return jsonify({'success': True, 'message': f'Successfully added users to list with id {list_id}'})

@app.route('/list/get_item_suggestions', methods=['GET'])
def get_item_suggestions():
    # Retrieve (item_id, name) from items table for all items 
    # whose name matches the query string (case insensitive, partial match)

    query = request.args.get('query', '').lower()
    
    logger.info(f"Item suggestions endpoint reached with query: {query}")
    
    with get_db_conn() as conn:
        #items = conn.execute('SELECT item_id, name FROM items WHERE name LIKE ?', (f'%{query}%',)).fetchall()
        cursor = conn.cursor()
        items = cursor.execute(
            '''
            SELECT item_id, name, category_id
            FROM items
            WHERE LOWER(name) LIKE ? 
            AND LOWER(name) != ?
            ''',
            (f'%{query}%', query)
        ).fetchall()
        #conn.close()
        
        items_list = [{'item_id': item[0], 'name': item[1], 'category_id': item[2]} for item in items]
        logger.info(f"Item suggestions for query '{query}': {items_list}")
    return jsonify({'success': True, 'items': items_list})

@app.route('/list/get_user_suggestions', methods=['GET'])
def get_user_suggestions():
    # Retrieve usernames from users table based on query string (case insensitive, partial match)

    query = request.args.get('query', '').lower()
    
    logger.info(f"User suggestions endpoint reached with query: {query}")
    
    with get_db_conn() as conn:
        cursor = conn.cursor()
        users = cursor.execute(
            '''
            SELECT user_id, username
            FROM users
            WHERE username LIKE ?              -- starts with query
            AND username != ? COLLATE NOCASE   -- exclude matches
            ''',
            (f'{query}%', session['username'])
        ).fetchall()
        #conn.close()
        
        users_list = [{'user_id': user[0], 'username': user[1], 'role': "Viewer"} for user in users]
        logger.info(f"User suggestions for query '{query}': {users_list}")
    return jsonify({'success': True, 'users': users_list})


def update_list_modified_date(cur, list_id):
    # Update modified date in grocery_lists table in database
    try:
        cur.execute('''
            UPDATE grocery_lists 
            SET update_date = CURRENT_TIMESTAMP 
            WHERE list_id = ?
        ''', (list_id,))
        
        logger.info("List modification date updated successfully.")
    except Exception as e:
        return False
    
    return True


def get_db_conn():
    return sqlite3.connect('grocery.db')

if __name__ == '__main__':
    app.run(debug=True)