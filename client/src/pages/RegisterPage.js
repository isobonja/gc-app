import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Navbar, Form, Button } from 'react-bootstrap';
import { register as apiRegister } from '../api/requests';

/**
 * RegisterPage Component
 *
 * @component
 * @returns {JSX.Element} The rendered registration page for creating a new account.
 *
 * @description
 * - Provides a form for users to **create a new account** by entering a username and password.
 * - Validates input fields (username, password confirmation, and password requirements).
 * - Displays descriptive error messages when validation or registration fails.
 * - Redirects to the **LoginPage** upon successful registration, displaying a success message.
 * - Includes optional password strength rules (currently disabled during development).
 * - Uses **Bootstrap** components for layout, form structure, and responsive design.
 *
 * @uses useNavigate - For navigating back to the login page or onward after registration.
 * @uses apiRegister - Backend API request function to register a new user.
 *
 * @state
 * - `username`: Current username input value.
 * - `password`: Current password input value.
 * - `confirmPassword`: Re-entered password for confirmation.
 * - `error`: Message displayed when validation or registration fails.
 *
 * @example
 * // Example usage within a route:
 * <Route path="/register" element={<RegisterPage />} />
 */
function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const passwordRules = {
    length: {
      test: (pw) => pw.length >= 8,
      label: "At least 8 characters",
    },
    upper: {
      test: (pw) => /[A-Z]/.test(pw),
      label: "At least one uppercase letter",
    },
    lower: {
      test: (pw) => /[a-z]/.test(pw),
      label: "At least one lowercase letter",
    },
    number: {
      test: (pw) => /\d/.test(pw),
      label: "At least one number",
    },
    special: {
      test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw),
      label: "At least one special character",
    },
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username) {
      setError("Username is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    /* Password requirements - DISABLED DURING DEVELOPMENT */
    /*const allValid = Object.values(passwordRules).every(rule => rule.test(password));
    if (!allValid) {
      setError("Password does not meet all requirements.");
      return;
    }*/

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
    <div id="main">
      <Navbar expand="lg" className="bg-primary ps-3">
        <Navbar.Brand href="#home" className="text-light">Grocery List App</Navbar.Brand>
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

            {/* Password requirements - DISABLED DURING DEVELOPMENT */}
            {/*<ul className="mt-2 ps-3 small">
              {Object.entries(passwordRules).map(([key, rule]) => {
                const valid = rule.test(password);
                return (
                  <li
                    key={key}
                    className={valid ? "text-success" : "text-danger"}
                  >
                    {valid ? "✔️" : "❌"} {rule.label}
                  </li>
                );
              })}
            </ul>*/}
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
        <Button variant='secondary' className="mt-3 w-100" onClick={() => navigate('/')}>Back to Login</Button>
      </Container>
    </div>
  );
}

export default RegisterPage;
