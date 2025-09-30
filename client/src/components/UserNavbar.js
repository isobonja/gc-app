import React from 'react';
import { useNavigate } from "react-router-dom";
import { useLogout } from '../hooks/useLogout';

import {
  Navbar,
  Container,
  Nav,
  Button
} from 'react-bootstrap';

function UserNavbar({ username }) {

  const logout = useLogout();
  const navigate = useNavigate();

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <Navbar expand="lg" className="bg-primary ps-3">
      <Container fluid>
        <Navbar.Brand href="#home">
          {username ? `Welcome, ${username}` : "Welcome"}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="dashboard-nav" />
        <Navbar.Collapse id="dashboard-nav">
          <Nav>
            <Button type="button" variant="outline-light" onClick={goToDashboard} className="me-2">
              My Dashboard
            </Button>
          </Nav>
          <Nav className="me-auto">
            
          </Nav>
          
          <Nav>
            <Button type="button" variant="outline-light" onClick={logout}>
              Log Out
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default UserNavbar;