"""
Module for managing and creating user notifications.
"""

from enum import Enum
import json
import sqlite3

from logger import logger


# ----------------------------------------------
#   CONSTANTS
# ----------------------------------------------

# Maximum amount of notifications that can be sent to frontend at once
NOTIFICATION_LIMIT = 50


# ----------------------------------------------
#     ENUMS
# ----------------------------------------------

"""
    Types of Notifications
    
    This is mainly used for determining icons on the frontend.
"""
class NotificationType(Enum):
    INVITE = 'invite'
    EDIT = 'edit'
    DELETE = 'delete'
    DEFAULT = 'none'
    
"""
    Types of "Actionable" Notifications
    
    This is mainly used for determining buttons and respective actions on the frontend.
"""
class ActionableNotificationType(Enum):
    JOIN_LIST_REQUEST = 'join_list_request'


# ----------------------------------------------
#    FUNCTIONS
# ----------------------------------------------

def create_notification(
    cur: sqlite3.Cursor, 
    user_id: int,
    message: str,
    icon: str = NotificationType.DEFAULT.value,
    actionable: bool = False,
    action_type: str|None = None,
    requested_list_id: int|None = None,
    unread: bool = True,
    **kwargs
) -> int:
    """
    Create and insert a notification entry into the database.

    This function inserts a new notification record for a specific user into 
    the `notifications` table. It supports both standard and actionable 
    notifications, along with optional custom data stored as JSON.

    Args:
        cur (sqlite3.Cursor): Active SQLite cursor used to execute the query.
        user_id (int): The ID of the user receiving the notification.
        message (str): The main text content of the notification.
        icon (str, optional): The notification type identifier, defined by 
            `NotificationType`. Defaults to `NotificationType.DEFAULT.value`.
        actionable (bool, optional): Whether the notification includes an action 
            the user can perform (e.g., accepting an invite). Defaults to False.
        action_type (str | None, optional): The type of action for actionable 
            notifications, defined by `ActionableNotificationType`. Required 
            if `actionable` is True.
        requested_list_id (int | None, optional): Associated grocery list ID, if applicable.
        unread (bool, optional): Whether the notification is initially marked as unread. 
            Defaults to True.
        **kwargs: Additional optional data to include with the notification.
            - `data` (dict): Extra metadata stored as JSON.

    Raises:
        ValueError: If `icon` or `action_type` values are invalid.
        sqlite3.IntegrityError: If the database insertion fails due to constraint violations.

    Returns:
        int: The ID of the newly created notification record.
    """
    if icon not in [nt.value for nt in NotificationType]:
        raise ValueError(f"Invalid notification type: {icon}")
    
    if actionable and (action_type not in [ant.value for ant in ActionableNotificationType]):
        raise ValueError(f"Invalid actionable notification type: {action_type}")
    
    try:
        data_str = json.dumps(kwargs.get('data')) if 'data' in kwargs else None
        
        cur.execute('''
            INSERT INTO notifications (user_id, icon, message, actionable, action_type, requested_list_id, unread, created_at, data)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
        ''', (
            user_id,
            icon,
            message,
            actionable,
            action_type,
            requested_list_id,
            unread,
            data_str
        ))  
        
        logger.info(f"Notification created for user_id {user_id} with message: {message}")
        
        return cur.lastrowid
    except sqlite3.IntegrityError as e:
        logger.error(f"Failed to create notification: {e}")
        raise
    
def create_notifications_for_users(
    cur: sqlite3.Cursor,
    user_ids: list[int],
    message: str,
    icon: str = NotificationType.DEFAULT.value,
    actionable: bool = False,
    action_type: str|None = None,
    requested_list_id: int|None = None,
    unread: bool = True,
    **kwargs
):
    """
    Create notifications for multiple users simultaneously.

    This function loops through a list of user IDs and creates a notification
    entry for each one using `create_notification()`. It can optionally attach
    user-specific role data or other metadata to each notification.

    Args:
        cur (sqlite3.Cursor): Active SQLite cursor used to execute database operations.
        user_ids (list[int]): List of user IDs to receive the notification.
        message (str): The text content of the notification.
        icon (str, optional): The notification type identifier, defined by 
            `NotificationType`. Defaults to `NotificationType.DEFAULT.value`.
        actionable (bool, optional): Whether each notification includes an actionable 
            component. Defaults to False.
        action_type (str | None, optional): The type of actionable notification, defined by 
            `ActionableNotificationType`. Required if `actionable` is True.
        requested_list_id (int | None, optional): The associated grocery list ID, if applicable.
        unread (bool, optional): Whether the notification is initially marked unread. Defaults to True.
        **kwargs: Optional metadata for notifications.
            - `data` (dict): May contain `user_roles`, a list of roles that correspond 
              to each user ID in `user_ids`.

    Returns:
        None: This function does not return a value, but logs and creates notification records.

    Raises:
        sqlite3.IntegrityError: If a database constraint is violated during insertion.
    """
    notification_ids = []
    #for user_id in user_ids:
    for i, user_id in enumerate(user_ids):
        data = kwargs.get('data') if 'data' in kwargs else None
        role_data = {'user_role': data.get('user_roles')[i].lower()} if 'user_roles' in data else None
        
        new_notification_id = create_notification(
            cur,
            user_id,
            message,
            icon,
            actionable,
            action_type,
            requested_list_id,
            unread,
            data=role_data
        )
        notification_ids.append(new_notification_id)
        
def create_notifications_for_users_of_list(
    cur: sqlite3.Cursor,
    list_id: int,
    creator_user_id: int,
    message: str,
    icon: str = NotificationType.DEFAULT.value,
    actionable: bool = False,
    action_type: str|None = None,
    requested_list_id: int|None = None,
    unread: bool = True,
    **kwargs
):
    """
    Create notifications for all users of a grocery list, excluding the creator.

    Fetches all users associated with a given grocery list (except the list creator)
    and generates a notification for each using `create_notification()`.

    Args:
        cur (sqlite3.Cursor): Active SQLite cursor used to execute database operations.
        list_id (int): ID of the grocery list whose users should receive notifications.
        creator_user_id (int): ID of the user who triggered the event (excluded from notifications).
        message (str): The text content of the notification.
        icon (str, optional): The notification type identifier, defined by 
            `NotificationType`. Defaults to `NotificationType.DEFAULT.value`.
        actionable (bool, optional): Whether each notification includes an actionable 
            component. Defaults to False.
        action_type (str | None, optional): The type of actionable notification, defined by 
            `ActionableNotificationType`. Required if `actionable` is True.
        requested_list_id (int | None, optional): The ID of the list being referenced by the notification.
        unread (bool, optional): Whether the notification is initially marked unread. Defaults to True.
        **kwargs: Reserved for future expansion.

    Returns:
        None: This function creates multiple notification records.

    Example:
        >>> create_notifications_for_users_of_list(cur, list_id=3, creator_user_id=1, message="List updated")
    """
    users = cur.execute('''
        SELECT user_id
        FROM grocery_list_users
        WHERE list_id = ? AND user_id != ?
    ''', (list_id, creator_user_id)).fetchall()
    
    user_ids = [user[0] for user in users]
    
    notification_ids = []
    for user_id in user_ids:
        new_notification_id = create_notification(
            cur,
            user_id,
            message,
            icon,
            actionable,
            action_type,
            requested_list_id,
            unread
        )
        notification_ids.append(new_notification_id)
    
def mark_notification_as_read(
    cur: sqlite3.Cursor,
    notification_id: int
):
    """
    Mark a notification as read.

    Updates the `unread` flag of a notification to `0`, indicating it has been viewed.

    Args:
        cur (sqlite3.Cursor): Active SQLite cursor used to execute the update.
        notification_id (int): The ID of the notification to mark as read.

    Returns:
        None

    Raises:
        sqlite3.Error: If the database operation fails.
    """
    try:
        cur.execute('''
            UPDATE notifications
            SET unread = 0
            WHERE id = ?
        ''', (notification_id,))
    except sqlite3.Error as e:
        logger.error(f"Failed to mark notification as read: {e}")
        raise
    
def get_notifications(
    cur: sqlite3.Cursor,
    user_id: int,
    limit: int = NOTIFICATION_LIMIT
) -> list[sqlite3.Row]:
    """
    Retrieve recent notifications for a user.

    Fetches notifications from the database for a given user, sorted by 
    unread status (unread first) and creation time (newest first).

    Args:
        cur (sqlite3.Cursor): Active SQLite cursor used to execute the query.
        user_id (int): The ID of the user whose notifications will be fetched.
        limit (int, optional): Maximum number of notifications to retrieve. 
            Defaults to `NOTIFICATION_LIMIT`.

    Returns:
        list[sqlite3.Row]: A list of notification rows, each containing:
            - id (int)
            - icon (str)
            - message (str)
            - actionable (bool)
            - action_type (str | None)
            - requested_list_id (int | None)
            - unread (bool)
            - created_at (str)
            - data (str | None)

    Raises:
        sqlite3.Error: If the query execution fails.
    """
    try:
        cur.execute('''
            SELECT id, icon, message, actionable, action_type, requested_list_id, unread, created_at, data
            FROM notifications
            WHERE user_id = ?
            ORDER BY unread DESC, created_at DESC
            LIMIT ?
        ''', (user_id, limit))
        
        notifications = cur.fetchall()
        
        logger.info(f"Fetched {len(notifications)} notifications for user_id {user_id}")
        
        return notifications
    except sqlite3.Error as e:
        logger.error(f"Failed to fetch notifications: {e}")
        raise

