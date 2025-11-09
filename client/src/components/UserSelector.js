import React, { useState } from 'react';

import {
  Form,
  Dropdown,
  Container,
  Row,
  Col
} from 'react-bootstrap';

import { useUserSuggestions } from '../hooks/useUserSuggestions';
import { SUGGESTIONS_MAX_SHOW } from '../constants/constants';
import UsersDisplay from './UsersDisplay';

import { getLowerRoles, ROLE_NAMES } from '../constants/constants';

/**
 * UserSelector Component
 *
 * Provides a searchable interface for selecting and managing users in a list.
 * Displays live username suggestions as the user types, and shows selected users
 * below with their roles and the ability to modify or remove them.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Label text displayed above the input field.
 * @param {string} [props.currentUserRole="Owner"] - The role of the current user, which determines permission levels for modifying other users' roles.
 * @param {Array<Object>} props.otherUsers - List of user objects currently selected. Each should contain `user_id`, `username`, and `role`.
 * @param {Function} props.setOtherUsers - Setter function to update the `otherUsers` list.
 *
 * @example
 * return (
 *   <UserSelector
 *     label="Add users to project"
 *     currentUserRole="Admin"
 *     otherUsers={[
 *       { user_id: 1, username: "alice", role: "Editor" },
 *       { user_id: 2, username: "bob", role: "Viewer" }
 *     ]}
 *     setOtherUsers={setOtherUsers}
 *   />
 * )
 *
 * @description
 * This component integrates with a custom hook (`useUserSuggestions`) to fetch
 * and display username suggestions dynamically. Once a user is selected, their
 * information appears in a scrollable container where roles can be edited or
 * users can be removed.
 *
 * Role modification options are limited based on the `currentUserRole` — for example,
 * non-Owner users cannot modify the roles of higher-privilege users.
 *
 * @returns {JSX.Element} A search bar with live username suggestions and a list of selected users with role management controls.
 */
function UserSelector({ label, currentUserRole = "Owner", otherUsers, setOtherUsers }) {
  const [username, setUsername] = useState("");

  const { 
    suggestions: userSuggestions, 
    visible: userSuggestionsVisible, 
    handleClick: handleUserSuggestionClick
  } = useUserSuggestions(username, setUsername, setOtherUsers);

  const removeUser = (usernameToRemove) => {
    setOtherUsers((prev) => prev.filter((u) => u !== usernameToRemove));
  };

  const handleRoleChange = (userId, newRole) => {
    setOtherUsers(prev =>
      prev.map(user =>
        user.user_id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  return (
    <div className="w-100">
      <Form.Group className="mb-3" controlId="formOtherUsers">
        <div className="position-relative">
          <Form.Label>{label}</Form.Label>
          <Form.Control
            type="text"
            placeholder="Search username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Suggestions Dropdown */}
          <Dropdown.Menu
            show={userSuggestionsVisible && userSuggestions.length > 0}
            style={{
              position: "absolute",
              zIndex: 1000,
              width: "100%",
              top: "100%",
              marginTop: 0,
            }}
          >
            {userSuggestions
              .slice(0, SUGGESTIONS_MAX_SHOW)
              .map((suggestion, idx) => (
                <Dropdown.Item
                  key={idx}
                  onClick={() => handleUserSuggestionClick(suggestion)}
                >
                  <Container className="p-0 m-0">
                    <Row>
                      <Col>{suggestion.username}</Col>
                    </Row>
                  </Container>
                </Dropdown.Item>
              ))}
          </Dropdown.Menu>
        </div>
      </Form.Group>

      {/* UserDisplay objects for each user */}
      <Container 
        className="border border-black pb-1" 
        style={{
          height: "200px",
          overflowY: "auto",
        }}
      >

        {otherUsers.map((user) => {
          const isPrivileged = currentUserRole === "Owner" ? false : ["Owner", "Admin"].includes(user.role);

          const roleOptions = isPrivileged
            ? ROLE_NAMES
            : getLowerRoles(currentUserRole);

          return (
            <UsersDisplay
              key={user.user_id}
              user={user}
              removeUser={removeUser}
              preventRoleChanges={isPrivileged}
              roleOptions={roleOptions}
              onRoleChange={handleRoleChange}
            />
          );
        })}

      </Container>
    </div>
  );
}

export default UserSelector;