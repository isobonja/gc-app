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

function UserSelector({ label, otherUsers, setOtherUsers }) {
  const [username, setUsername] = useState("");

  const { 
    suggestions: userSuggestions, 
    visible: userSuggestionsVisible, 
    handleClick: handleUserSuggestionClick
  } = useUserSuggestions(username, setUsername, setOtherUsers);

  const removeUser = (usernameToRemove) => {
    setOtherUsers((prev) => prev.filter((u) => u !== usernameToRemove));
  };

  return (
    
    <div className="position-relative w-100">
      {/* Structure will be:
      Label
      Text Input field
      User suggestion dropdown
      Container listing users
       - Each item in the list will contain the username and a dropdown selection for their role
      */}
      <Form.Group className="mb-3" controlId="formOtherUsers">
        <Form.Label>{label}</Form.Label>
        <Form.Control
          type="text"
          placeholder="Search username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </Form.Group>

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

      {otherUsers.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mt-2">
          {otherUsers.map((user, index) => (
            <Badge
              key={index}
              pill
              bg="secondary"
              className="d-flex align-items-center"
            >
              {user.username}
              <button
                type="button"
                className="btn-close btn-close-white btn-sm ms-2"
                aria-label="Remove"
                onClick={() => removeUser(user)}
                style={{
                  fontSize: "0.6rem",
                  lineHeight: "1",
                }}
              ></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserSelector;