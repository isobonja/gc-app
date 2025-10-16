import React, { useState } from "react";
import { 
  Modal, 
  Button, 
  Form,
} from "react-bootstrap";

import UserSelector from "./UserSelector";

function NewListModal({ show, handleClose, onFormSubmit }) {
  const [listName, setListName] = useState("");
  const [otherUsers, setOtherUsers] = useState([]);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!listName.trim()) {
      setError("List name is required.");
      return;
    }

    setError(null);

    await onFormSubmit({ listName, otherUsers });

    setListName("");
    setOtherUsers([]);
    setError(null);
    handleClose();
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

          <UserSelector 
            label="Add users:"
            otherUsers={otherUsers}
            setOtherUsers={setOtherUsers}
          />
          
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