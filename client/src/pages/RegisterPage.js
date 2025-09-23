import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, Form, Button } from 'react-bootstrap';
import { register as apiRegister } from '../api/requests';

function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const data = await apiRegister(username, password);

      if (data.success) {
        navigate("/", { state: { message: "Account created successfully. Please log in." } });
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div id="main" data-bs-theme="dark">
      <Navbar expand="lg" className="bg-primary ps-3">
        <Navbar.Brand href="#home">Grocery List App</Navbar.Brand>
      </Navbar>
      <Container className="p-3 w-25 mx-auto">
        <Form onSubmit={handleRegister}>
          <Form.Group className="mb-3" controlId="formUsername">
            <Form.Label>Username:</Form.Label>
            <Form.Control type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Password:</Form.Label>
            <Form.Control type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} />
          </Form.Group> 
          <Form.Group className="mb-3" controlId="formConfirmPassword">
            <Form.Label>Confirm Password:</Form.Label>
            <Form.Control type="password" placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </Form.Group> 
          {error && 
          <Form.Text className="text-danger">{error}</Form.Text>
          }
          <Button variant='primary' type='submit' className="w-100 mt-3">Create Account</Button>
        </Form>
      </Container>
    </div>
  );
}

export default RegisterPage;
