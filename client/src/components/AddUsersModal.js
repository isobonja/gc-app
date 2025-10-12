import React, { useState } from "react";
import { 
  Modal, 
  Button, 
  Form
} from "react-bootstrap";

import UserSelector from "./UserSelector";

function AddUsersModal({ show, handleClose, onFormSubmit, listName }) {
  const [otherUsers, setOtherUsers] = useState([]);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await onFormSubmit({ otherUsers });

    setOtherUsers("");
    setError(null);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Users to {listName}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form className="p-3" id="addUsersForm" onSubmit={handleSubmit}>
          <UserSelector
            label="Select users:" 
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
        <Button variant="primary" type="submit" form="addUsersForm">
          Add Users
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AddUsersModal;