//Note: might be possible to generalize NewListModal and AddUsersModal to some extent
//   Look into this later

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

function AddUsersModal({ show, handleClose, onFormSubmit, listName }) {
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

    const data = await onFormSubmit({ otherUsers });

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
        <Modal.Title>Add Users to {listName}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form className="p-3" id="addUsersForm" onSubmit={handleSubmit}>
          <div className="position-relative w-100">
            <Form.Group className="mb-3" controlId="formOtherUsers">
              <Form.Label>Search other users: </Form.Label>
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
        <Button variant="primary" type="submit" form="addUsersForm">
          Add Users
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AddUsersModal;