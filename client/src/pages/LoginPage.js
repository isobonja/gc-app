import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar, Form, Button } from 'react-bootstrap';
import { UserContext } from '../context/UserContext';

import CenterSpinner from '../components/CenterSpinner';

import { 
  login as apiLogin,
  getSession,
} from '../api/requests';

/**
 * LoginPage Component
 *
 * @component
 * @returns {JSX.Element} The rendered login page for user authentication.
 *
 * @description
 * - Handles user authentication by validating credentials with the backend API.
 * - Automatically redirects authenticated users to the **Dashboard**.
 * - Displays status messages (e.g., from redirects after logout or registration).
 * - Provides a “Keep me logged in” toggle that controls session persistence.
 * - Uses **Bootstrap** components for responsive form layout and styling.
 * - Shows a centered loading spinner while verifying session status on mount.
 *
 * @uses useContext(UserContext) - For managing the logged-in user state.
 * @uses useNavigate - To redirect users after login or registration.
 * @uses useLocation - To access navigation state (e.g., success messages).
 * @uses CenterSpinner - To display a full-page loading indicator.
 *
 * @state
 * - `username`: Current username input value.
 * - `password`: Current password input value.
 * - `keepLoggedIn`: Boolean toggle for persistent login.
 * - `error`: Error message displayed when login fails.
 * - `success`: Message displayed after successful actions (e.g., registration).
 * - `loading`: Boolean tracking session check completion before rendering form.
 *
 * @example
 * // Example usage within a route:
 * <Route path="/login" element={<LoginPage />} />
 */
function LoginPage() {
  const navigate = useNavigate();

  const location = useLocation();
  const message = location.state?.message;

  const { setUser } = useContext(UserContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await getSession();
        if (data.loggedIn) {
          setUser({ username: data.username, currentListId: data.currentListId });
          navigate('/dashboard');
          return;
        }
      } catch (err) {
        console.error("Error checking session:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [setUser, navigate]);

  useEffect(() => {
    if (message) {
      setSuccess(message);
      window.history.replaceState({}, document.title);
    }
  }, [message]);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');

    try {
      const data = await apiLogin(username, password, keepLoggedIn);

      if (data.success) {
        console.log("Successful login");
        setUser({ username: data.username, currentListId: data.currentListId });
        navigate('/dashboard');
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  if (loading) {
    return <CenterSpinner height="100vh" />;
  }

  return (
    <div id="main">
      <Navbar expand="lg" className="bg-primary ps-3">
        <Navbar.Brand href="#home" className="text-light">Grocery List App</Navbar.Brand>
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
          <Form.Check
            type="switch"
            id="keep-logged-in-switch"
            label="Keep me logged in" 
            checked={keepLoggedIn} 
            onChange={e => setKeepLoggedIn(e.target.checked)}
          />
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