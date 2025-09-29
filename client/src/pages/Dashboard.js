import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from "react-router-dom";

import { UserContext } from '../context/UserContext';

import { 
  Container, 
  Row, 
  Col, 
  Nav, 
  Navbar,
  Card,
  Table,
  Form,
  Button,
  Modal,
  Dropdown,
  Toast,
  ToastContainer,
  Spinner,
  Badge
} from 'react-bootstrap';

function Dashboard() {
  const navigate = useNavigate();

  // User context
  // user is object with username and currentListId
  const { user, setUser } = useContext(UserContext);

  // List of grocery lists user has access to
  const [lists, setLists] = useState([]);

  const handleListCardClick = (listId) => {
    navigate(`/list/${listId}`);
  };

  return (
    <div data-bs-theme="dark" className="d-flex flex-column min-vh-100">
      <Container className="grid grid-cols-3 gap-4">
        <p>Temp</p>
        {lists.map((list) => (
          <Card key={list.id} onClick={() => handleListCardClick(list.id)}>
            <h2>{list.name}</h2>
            <p>Owner: {list.owner}</p>
            <p>Users: {list.users.join(", ")}</p>
            <p>Last updated: {list.lastModified}</p>
            <Badge>{list.isShared ? "Shared" : "Private"}</Badge>
          </Card>
        ))}
      </Container>
    </div>
  );
}

export default Dashboard;