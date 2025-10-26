# File for creating and managing notifications
from datetime import date
from enum import Enum
import sqlite3

from logger import logger

NOTIFICATION_LIMIT = 50

class NotificationType(Enum):
    INVITE = 'invite'
    EDIT = 'edit'
    DELETE = 'delete'
    DEFAULT = 'none'
    
class ActionableNotificationType(Enum):
    JOIN_LIST_REQUEST = 'join_list_request'

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
):
    if icon not in [nt.value for nt in NotificationType]:
        raise ValueError(f"Invalid notification type: {icon}")
    
    if actionable and (action_type not in [ant.value for ant in ActionableNotificationType]):
        raise ValueError(f"Invalid actionable notification type: {action_type}")
    
    try:
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
            kwargs.get('data') if 'data' in kwargs else None
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
    notification_ids = []
    #for user_id in user_ids:
    for i, user_id in enumerate(user_ids):
        
        data = {'user_role': kwargs.get('user_roles')[i]} if 'user_roles' in kwargs else None
        
        new_notification_id = create_notification(
            cur,
            user_id,
            message,
            icon,
            actionable,
            action_type,
            requested_list_id,
            unread,
            data=data
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
    try:
        cur.execute('''
            UPDATE notifications
            SET unread = 0
            WHERE id = ?
        ''', (notification_id,))
        
        logger.info(f"Marked notification_id {notification_id} as read")
        
    except sqlite3.Error as e:
        logger.error(f"Failed to mark notification as read: {e}")
        raise
    

def get_notifications(
    cur: sqlite3.Cursor,
    user_id: int,
    limit: int = NOTIFICATION_LIMIT
) -> list[sqlite3.Row]:
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

