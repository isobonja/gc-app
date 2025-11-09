import {
  Row,
  Col,
  Form
} from 'react-bootstrap';

/**
 * Displays a single user's information with role selection and removal controls.
 *
 * Typically used in lists of users where admins or list owners can adjust roles or remove users.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.user - The user object containing `user_id`, `username`, and `role`.
 * @param {Function} props.removeUser - Callback function to remove the user from the list.
 * @param {boolean} props.preventRoleChanges - Whether to disable role selection and removal actions.
 * @param {string[]} props.roleOptions - Array of available role names for selection (e.g., `["Admin", "Editor", "Viewer"]`).
 * @param {Function} props.onRoleChange - Callback triggered when the user's role is changed; receives `(userId, newRole)`.
 *
 * @example
 * return (
 *   <UsersDisplay
 *     user={{ user_id: 1, username: "alice", role: "Editor" }}
 *     removeUser={(u) => console.log("Remove:", u)}
 *     preventRoleChanges={false}
 *     roleOptions={["Admin", "Editor", "Viewer"]}
 *     onRoleChange={(id, role) => console.log("Role changed:", id, role)}
 *   />
 * )
 *
 * @returns {JSX.Element} A styled row showing a user's name, role dropdown, and remove button.
 */
function UsersDisplay({ user, removeUser, preventRoleChanges, roleOptions, onRoleChange }) {
  // 'user' should be object with user_id, username, and role

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    onRoleChange(user.user_id, newRole);
  };

  return (
    <Row className="border align-items-center mt-1">
      <Col xs="auto">
        <button
          type="button"
          className="btn-close btn-close-black btn-sm"
          aria-label="Remove"
          onClick={() => removeUser(user)}
          style={{
            fontSize: "0.6rem",
            lineHeight: "1",
          }}
          disabled={preventRoleChanges}
        ></button>
      </Col>
      <Col className="p-0 fw-bold">
        {user.username}
      </Col>
      <Col className="w-auto d-flex justify-content-end">
        <Form.Select 
          value={user.role || "Viewer"} 
          className="w-auto"
          onChange={handleRoleChange} 
          disabled={preventRoleChanges}
        >
          {roleOptions.map((role, idx) => (
            <option key={idx} value={role}>{role}</option>
          ))}
        </Form.Select>
      </Col>
    </Row>
  );
}

export default UsersDisplay;