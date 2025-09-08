import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Nav, Navbar, Form, Button } from 'react-bootstrap'
import { UserContext } from './UserContext';

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    console.log(`Username: ${username}, Password: ${password}`);

    try {
      const response = await axios.post('http://localhost:5000/login', {
        username,
        password
      }, { withCredentials: true });

      if (response.data.success) {
        setUser({
          username: response.data.username,
          currentListId: response.data.currentListId
        });
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div id="main" data-bs-theme="dark">
      <Navbar expand="lg" className="bg-primary ps-3">
        <Navbar.Brand href="#home">Grocery List App</Navbar.Brand>
      </Navbar>
      <Form className="p-3 w-25 mx-auto" onSubmit={handleLogin}>
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
        <Button variant='primary' type='submit' className="w-100 mt-3">Log In</Button>
      </Form>
    </div>
  );
}

export default LoginPage;