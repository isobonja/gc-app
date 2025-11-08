import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useLogout } from '../hooks/useLogout';

import '../App.css';

import {
  Navbar,
  Container,
  Nav,
  Button,
  Dropdown,
  Pagination
} from 'react-bootstrap';

import Notification from './Notification';
import { getNotifications, addUserToList, deleteNotifications, markNotificationsAsRead } from '../api/requests';
import { useToasts } from '../context/ToastProvider';
import { useTheme } from '../context/ThemeContext';

function UserNavbar({ username }) {
  const { theme, toggleTheme } = useTheme();

  // Each notification is a dict with keys: id, icon, message, actionable, action_type, requested_list_id, unread, created_at, data
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refetch, setRefetch] = useState(false);

  const { addToast } = useToasts();

  const logout = useLogout();
  const navigate = useNavigate();

  const [currentNotificationPage, setCurrentNotificationPage] = useState(1);
  const NOTIFICATIONS_PER_PAGE = 5;

  const [totalNotificationPages, setTotalNotificationPages] = useState(1);
  const [paginatedNotifications, setPaginatedNotifications] = useState([]);

  useEffect(() => {
    // Fetch notifications from server
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        console.log("Fetched notifications:", data);
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();

    
  }, [refetch]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => n.unread).length);
    setTotalNotificationPages(Math.ceil(notifications.length / NOTIFICATIONS_PER_PAGE));

    setPaginatedNotifications(notifications.slice(
      (currentNotificationPage - 1) * NOTIFICATIONS_PER_PAGE,
      currentNotificationPage * NOTIFICATIONS_PER_PAGE
    ));
  //}, [notifications]);
  }, [notifications, currentNotificationPage]);

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const handleNotificationDropdownToggle = (isOpen) => {
    console.log("Notification dropdown is now", isOpen ? "open" : "closed");
    if (!isOpen) {
      // Update notifications as read server-side
      // Would need to then retrieve updated notifs

      // Get all currently displayed notifications and mark them as read
      // Each page has max of 5 notifications, so only change those

      //setUnreadCount(0);
      //setNotifications([]);
      handleMarkAsRead();
      setCurrentNotificationPage(1);
      setRefetch(!refetch);
    } else {
      //setCurrentNotificationPage(1);
    }
  };

  const handleMarkAsRead = async () => {
    const paginatedNotificationIds = paginatedNotifications
      .filter(n => n.unread)
      .map(n => n.id);
    
    console.log("Marking notifications as read:", paginatedNotificationIds);

    setNotifications((prevNotifs) =>
      prevNotifs.map((n) =>
        paginatedNotificationIds.includes(n.id) ? { ...n, unread: false } : n
      )
    );

    try {
      await markNotificationsAsRead(paginatedNotificationIds);
      // Update local state
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const handleNotificationDelete = async (notification) => {
    try{
      await deleteNotifications([notification.id]);
      addToast("Notification deleted!", "success");
      setRefetch(!refetch);
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };
  

  return (
    <Navbar expand="lg" className="bg-primary ps-3">
      <Container fluid>
        <Navbar.Brand href="#home" className="text-light">
          {username ? `Welcome, ${username}` : "Welcome"}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="dashboard-nav" />
        <Navbar.Collapse id="dashboard-nav">
          <Nav>
            <Button type="button" variant="outline-light" onClick={goToDashboard} className="me-2">
              My Dashboard
            </Button>
          </Nav>
          <Nav className="me-auto" />
          <Nav className="px-3">
            <Dropdown align="end" onToggle={handleNotificationDropdownToggle}>
              <Dropdown.Toggle
                variant="link"
                className="p-0 border-0 position-relative text-decoration-none"
                id="notification-dropdown"
              >
                <i className="bi bi-bell text-light fs-4"></i>

                {unreadCount > 0 && (
                  <span
                    className="position-absolute translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.6rem', top: '25%', right: '-10%' }}
                  >
                    {unreadCount}
                  </span>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu variant="dark" className="dropdown-menu-end mt-2" style={{ width: '500px', minWidth: '250px' }}>
                <Dropdown.Header>Notifications</Dropdown.Header>
                <Dropdown.Divider />

                {totalNotificationPages > 1 && (
                  <div className="d-flex justify-content-center align-items-center mt-2">
                    <Pagination size="sm" className="mb-2">
                      <Pagination.Prev
                        disabled={currentNotificationPage === 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead();
                          setCurrentNotificationPage((p) => Math.max(p - 1, 1));
                        }}
                      />
                      {[...Array(totalNotificationPages)].map((_, i) => (
                        <Pagination.Item
                          key={i}
                          active={i + 1 === currentNotificationPage}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead();
                            setCurrentNotificationPage(i + 1);
                          }}
                        >
                          {i + 1}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        disabled={currentNotificationPage === totalNotificationPages}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead();
                          setCurrentNotificationPage((p) => Math.min(p + 1, totalNotificationPages));
                        }}
                      />
                    </Pagination>
                  </div>
                )}

                {notifications.length > 0 ? (
                  paginatedNotifications.map((n) => (
                    <Dropdown.Item key={n.id} className="text-wrap py-0">
                      <Notification 
                        text={n.message} 
                        isUnread={n.unread} 
                        icon={
                          n.icon === 'invite' ? <i className="bi bi-person-plus-fill text-light fs-4"></i> :
                          n.icon === 'edit' ? <i className="bi bi-pencil-square text-light fs-4"></i> :
                          n.icon === 'delete' ? <i className="bi bi-trash-fill text-light fs-4"></i> :
                          <i className="bi bi-bell text-light fs-4"></i>
                        }
                        requiresAction={n.actionable} 
                        onConfirm={(e) => {
                          // Handle confirm action
                          e.stopPropagation();
                          console.log("Confirmed action for notification", n.id);
                          if (n.action_type === 'join_list_request') {
                            // Add user to the list with ID n.requested_list_id
                            console.log("Notif data: ", n.data);
                            addUserToList({ listId: n.requested_list_id, username: username, data: n.data })
                              .then(response => {
                                console.log("User added to list response:", response);
                                addToast("Successfully joined the list!", "success");
                                // Remove notification from list
                                handleNotificationDelete(n);
                              })
                              .catch(error => {
                                console.error("Error adding user to list:", error);
                                addToast("Failed to join the list.", "error");
                              });
                          }
                        }} 
                        onDismiss={(e) => {
                          e.stopPropagation();
                          // Handle dismiss action
                          console.log("Dismissed action for notification", n.id);
                          // Remove notification from list
                          handleNotificationDelete(n);
                        }} 
                        onDelete={(e) => {
                          e.stopPropagation();
                          handleNotificationDelete(n);
                        }}
                      />
                    </Dropdown.Item>
                  ))
                ) : (
                  <Dropdown.ItemText className="text-muted">No new notifications</Dropdown.ItemText>
                )}

                <Dropdown.Divider />
                <Container className="d-flex justify-content-center">
                  <Button 
                    variant="link" 
                    className="p-0 text-decoration-none"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markNotificationsAsRead(notifications.filter(n => n.unread).map(n => n.id));
                      setNotifications((prevNotifs) =>
                        prevNotifs.map((n) =>
                          n.unread ? { ...n, unread: false } : n
                        )
                      );
                  }}>
                    Mark all as read
                  </Button>
                  <span className="mx-2">|</span>
                  <Button 
                    variant="link" 
                    className="p-0 text-danger text-decoration-none"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const allNotificationIds = notifications.map(n => n.id);
                      deleteNotifications(allNotificationIds);
                      setNotifications([]);
                  }}>
                    Delete all notifications
                  </Button>
                </Container>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
          
          <Nav>
            {/*<Button type="button" variant="outline-light" onClick={logout}>
              Log Out
            </Button>*/}
            <Dropdown align="end">
              <Dropdown.Toggle
                id="settings-dropdown"
                variant="link"
                className="p-0 border-0 position-relative text-decoration-none"
              >
                <i className="bi bi-gear-fill text-light fs-4 me-2"></i>
              </Dropdown.Toggle>

              <Dropdown.Menu className="mt-2">
                {/* Theme Toggle */}
                <Dropdown.Item
                  onClick={toggleTheme}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span>Toggle Theme</span>
                  {theme === "dark" ? (
                    <i className="bi bi-moon-fill"></i>
                  ) : (
                    <i className="bi bi-sun-fill"></i>
                  )}
                </Dropdown.Item>

                <Dropdown.Divider />

                {/* Log Out */}
                {/*<Dropdown.Item className="bg-danger" onClick={logout}>
                  <i className="bi bi-box-arrow-right me-2"></i> Log Out
                </Dropdown.Item>*/}
                <Dropdown.Item 
                  className="m-0 p-0 d-flex px-2" 
                  style={{
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "transparent")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                >
                  <Button className="flex-fill bg-danger text-light border-0" onClick={logout}>
                    <i className="bi bi-box-arrow-right me-2"></i> Log Out
                  </Button>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default UserNavbar;