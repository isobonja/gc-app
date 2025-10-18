import React, { useEffect, useState } from "react";
import { 
  Modal, 
  Button, 
  Form,
} from "react-bootstrap";

import UserSelector from "./UserSelector";

function ManageListModal({ show, handleClose, title, submitButtonText, onFormSubmit, list=null }) {
  const [listName, setListName] = useState("");
  const [otherUsers, setOtherUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (list !== null && show) {
      setListName(list.name);
      setOtherUsers(list.other_users);
    }

    if (!show) {
      setListName("");
      setOtherUsers([]);
      setError(null);
    }
  }, [show, list]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!listName.trim()) {
      setError("List name is required.");
      return;
    }

    setError(null);

    const listId = list?.id;

    console.log(`listId: ${listId}\tlistName: ${listName}\totherUsers: ${otherUsers}`);

    await onFormSubmit({ listId, listName, otherUsers });

    setListName("");
    setOtherUsers([]);
    setError(null);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title || "Manage List"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form className="p-3" id="manageListForm" onSubmit={handleSubmit}>
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
            label="Select other users:"
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
        <Button variant="primary" type="submit" form="manageListForm">
          {submitButtonText || "Submit"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ManageListModal;