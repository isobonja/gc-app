import React, { useState } from "react";
import { 
  Modal, 
  Button, 
  Form,
  Dropdown,
  Container,
  Row,
  Col,
  Badge
} from "react-bootstrap";

import { useUserSuggestions } from "../hooks/useUserSuggestions";

import { SUGGESTIONS_MAX_SHOW } from '../constants/constants';

function NewListModal({ show, handleClose, onFormSubmit }) {
  const [listName, setListName] = useState("");
  const [username, setUsername] = useState("");
  const [otherUsers, setOtherUsers] = useState([]);
  const [error, setError] = useState(null);

  const { 
    suggestions: userSuggestions, 
    visible: userSuggestionsVisible, 
    handleClick: handleUserSuggestionClick
  } = useUserSuggestions(username, setUsername, setOtherUsers);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!listName.trim()) {
      setError("List name is required.");
      return;
    }

    setError(null);

    const data = await onFormSubmit({ listName, otherUsers });

    setListName("");
    setUsername("");
    setOtherUsers("");
    setError(null);
    handleClose();
  };

  const removeUser = (usernameToRemove) => {
    setOtherUsers((prev) => prev.filter((u) => u !== usernameToRemove));
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create New List</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form className="p-3" id="newListForm" onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formListName">
            <Form.Label>List Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter list name"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              required
            />
          </Form.Group>

          {/* *** Will not implement at the moment. ***
              Ideally, I'd have a user suggestion dropdown that fetches existing usernames,
              and allows the user to click on them to add them (would also clear input field).
              The selected users would each be played into a badge component that shows the username
              and an 'x' button to remove them. */}
          {/*<Form.Group className="mb-3" controlId="formOtherUsers">
            <Form.Label>Share with other users (comma-separated usernames)</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., user1, user2"
              value={otherUsers}
              onChange={(e) => setOtherUsers(e.target.value)}
              disabled
            />
          </Form.Group>*/}
          <div className="position-relative w-100">
            <Form.Group className="mb-3" controlId="formOtherUsers">
              <Form.Label>Share with other users: </Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>

            {/* Suggestions Dropdown */}
            <Dropdown.Menu
              show={userSuggestionsVisible && userSuggestions.length > 0}
              style={{ position: 'absolute', zIndex: 1000, width: '100%', top: '100%', marginTop: 0 }}
            >
              {userSuggestions.slice(0, SUGGESTIONS_MAX_SHOW).map((suggestion, idx) => (
                <Dropdown.Item key={idx} onClick={() => handleUserSuggestionClick(suggestion)}> {/*Suggestion here is object with keys {user_id, username}*/}
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
          
          {error && <p className="text-danger">{error}</p>}
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" form="newListForm">
          Create List
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default NewListModal;