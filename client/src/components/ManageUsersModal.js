import React, { useState, useEffect } from "react";
import { 
  Modal, 
  Button, 
  Form
} from "react-bootstrap";

import UserSelector from "./UserSelector";

function ManageUsersModal({ show, handleClose, onFormSubmit, listName, currentUserRole, otherUsers, setOtherUsers }) {
  //const [otherUsers, setOtherUsers] = useState([]);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await onFormSubmit({ otherUsers });

    setOtherUsers([]);
    setError(null);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Update Users of List "{listName}"</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form className="p-3" id="manageUsersForm" onSubmit={handleSubmit}>
          <UserSelector
            label="Search users:" 
            currentUserRole={currentUserRole} 
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
        <Button variant="primary" type="submit" form="manageUsersForm">
          Update Users
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ManageUsersModal;