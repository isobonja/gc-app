import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Nav, Navbar, Form, Button } from 'react-bootstrap';
import { UserContext } from '../context/UserContext';

import { login as apiLogin } from '../api/requests';

function LoginPage() {
  const navigate = useNavigate();

  const location = useLocation();
  const message = location.state?.message;

  const { setUser } = useContext(UserContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (message) {
      setSuccess(message);
      window.history.replaceState({}, document.title);
    }
  }, [message]);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');

    console.log(`Username: ${username}, Password: ${password}`);

    try {
      const data = await apiLogin(username, password);

      if (data.success) {
        setUser({ username: data.username, currentListId: data.currentListId });
        navigate('/dashboard');
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
        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3" controlId="formUsername">
            <Form.Label>Username:</Form.Label>
            <Form.Control type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Password:</Form.Label>
            <Form.Control type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} />
          </Form.Group> 
          {error && 
            <Form.Text className="text-danger">{error}</Form.Text>
          }
          {success && 
            <Form.Text className="text-success">{success}</Form.Text>
          }
          <Button variant='primary' type='submit' className="w-100 mt-3">Log In</Button>
        </Form>

        <hr className="my-4" />

        <Button 
          variant="secondary" 
          type="button" 
          className="w-100" 
          onClick={() => navigate('/register')}
        >
          Create Account
        </Button>
      </Container>
      
    </div>
  );
}

export default LoginPage;