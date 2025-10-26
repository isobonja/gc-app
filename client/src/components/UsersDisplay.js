import {
  Row,
  Col,
  Form
} from 'react-bootstrap';

function UsersDisplay({ user, removeUser, preventRoleChanges, roleOptions, onRoleChange }) {
  // For now, 'user' should be object with user_id, username, and role

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