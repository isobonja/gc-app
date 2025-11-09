import React, { useState } from "react";
import { 
  Modal, 
  Button, 
  Form
} from "react-bootstrap";

import UserSelector from "./UserSelector";

/**
 * A modal component for managing the users associated with a shared list.
 *
 * This component displays a Bootstrap modal that allows modifying which users
 * have access to a specific list. It uses the `UserSelector` component to
 * search for and manage the list of shared users.
 *
 * The modal supports submission via `onFormSubmit`, and the parent component
 * controls visibility via the `show` and `handleClose` props.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.show - Controls whether the modal is visible.
 * @param {Function} props.handleClose - Callback to close the modal.
 * @param {Function} props.onFormSubmit - Callback fired when the form is submitted.  
 *   Receives an object `{ otherUsers }` with the updated list of users.
 * @param {string} props.listName - The name of the list being modified, displayed in the modal title.
 * @param {string} props.currentUserRole - The role of the current user (e.g., `"owner"`, `"editor"`, `"viewer"`).  
 *   Used to determine editing permissions in the `UserSelector`.
 * @param {Array<Object>} props.otherUsers - The list of users the list is currently shared with.  
 *   Each user object typically includes fields like `id` and `username`.
 * @param {Function} props.setOtherUsers - Setter function to update the list of shared users in the parent component.
 *
 * @example
 * const [showModal, setShowModal] = useState(false);
 * const [otherUsers, setOtherUsers] = useState([{ id: 2, username: "jane_doe" }]);
 *
 * const handleFormSubmit = async ({ otherUsers }) => {
 *   console.log("Updated shared users:", otherUsers);
 *   // Call backend API or update state
 * };
 *
 * <ManageUsersModal
 *   show={showModal}
 *   handleClose={() => setShowModal(false)}
 *   onFormSubmit={handleFormSubmit}
 *   listName="Weekly Groceries"
 *   currentUserRole="owner"
 *   otherUsers={otherUsers}
 *   setOtherUsers={setOtherUsers}
 * />
 */
function ManageUsersModal({ show, handleClose, onFormSubmit, listName, currentUserRole, otherUsers, setOtherUsers }) {
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