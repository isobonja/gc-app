import React, { useState } from 'react';

import {
  Form,
  Dropdown,
  Container,
  Row,
  Col,
  Badge
} from 'react-bootstrap';

import { useUserSuggestions } from '../hooks/useUserSuggestions';
import { SUGGESTIONS_MAX_SHOW } from '../constants/constants';
import UsersDisplay from './UsersDisplay';

import { getLowerRoles, ROLE_NAMES } from '../constants/constants';

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