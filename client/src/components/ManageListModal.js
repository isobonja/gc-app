import React, { useEffect, useState } from "react";
import { 
  Modal, 
  Button, 
  Form,
} from "react-bootstrap";

import UserSelector from "./UserSelector";

/**
 * A modal component for creating or editing a grocery list and managing its shared users.
 *
 * This component displays a Bootstrap modal with a form for entering a list name and
 * selecting additional users to share the list with. It is used both for creating
 * new lists and editing existing ones, depending on whether a `list` prop is provided.
 *
 * The component validates input (ensuring a non-empty list name), resets state when
 * closed or reopened, and passes the final form data to the parent via `onFormSubmit`.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.show - Controls whether the modal is visible.
 * @param {Function} props.handleClose - Callback to close the modal.
 * @param {string} [props.title="Manage List"] - The title displayed in the modal header.
 * @param {string} [props.submitButtonText="Submit"] - The text for the primary submit button.
 * @param {Function} props.onFormSubmit - Callback fired when the form is successfully submitted.  
 *   Receives an object `{ listId, listName, otherUsers }`.
 * @param {Object|null} [props.list=null] - Optional existing list object to edit.  
 *   If provided, pre-fills the form fields.
 * @param {number} [props.list.id] - Unique ID of the list (used when editing).
 * @param {string} [props.list.name] - The name of the existing list.
 * @param {Array<Object>} [props.list.other_users] - List of users the list is shared with.
 *
 * @example
 * const handleFormSubmit = async ({ listId, listName, otherUsers }) => {
 *   console.log("Submitting:", listId, listName, otherUsers);
 *   // Send to API or update state
 * };
 *
 * <ManageListModal
 *   show={true}
 *   handleClose={() => setShow(false)}
 *   title="Edit Grocery List"
 *   submitButtonText="Save Changes"
 *   onFormSubmit={handleFormSubmit}
 *   list={{
 *     id: 1,
 *     name: "Weekly Groceries",
 *     other_users: [{ id: 2, username: "jane_doe" }]
 *   }}
 * />
 */
function ManageListModal({ show, handleClose, title, submitButtonText, onFormSubmit, list=null, items=null }) {
  const [listName, setListName] = useState("");
  const [otherUsers, setOtherUsers] = useState([]);
  const [error, setError] = useState(null);

  // Set input field values when Modal opens, if applicable
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

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!listName.trim()) {
      setError("List name is required.");
      return;
    }

    setError(null);

    //const listId = list?.id;

    //console.log(`listId: ${listId}\tlistName: ${listName}\totherUsers: ${otherUsers}`);

    //await onFormSubmit({ listId, listName, otherUsers });
    await onFormSubmit({ listName, otherUsers, items });

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