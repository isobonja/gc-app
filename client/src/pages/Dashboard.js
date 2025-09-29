import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from "react-router-dom";

import { UserContext } from '../context/UserContext';

import { 
  Container, 
  Row, 
  Col, 
  Card,
  Badge,
  Button
} from 'react-bootstrap';

import UserNavbar from '../components/UserNavbar';
import CenterSpinner from '../components/CenterSpinner';

import { fetchUserLists } from '../api/requests';


function Dashboard() {
  const navigate = useNavigate();

  // User context
  // user is object with username and currentListId
  const { user, setUser } = useContext(UserContext);

  // List of grocery lists user has access to
  const [lists, setLists] = useState([]);
  const [gotLists, setGotLists] = useState(false);
  //const listsRef = useRef(lists);

  // On mount, fetch lists user has access to
  useEffect(() => {
    const getLists = async () => {
      try {
        const data = await fetchUserLists();
        setLists(data.lists);
        setGotLists(true);
      } catch (err) {
        console.error("Error fetching user lists:", err);
      }
    };
    getLists();
  }, []);

  const handleListCardClick = (listId) => {
    navigate(`/list/${listId}`);
  };

  return (
    <div data-bs-theme="dark" className="d-flex flex-column min-vh-100">
      <UserNavbar username={user ? user.username : null} />
      { !gotLists ? (
        <CenterSpinner />
      ) : lists.length === 0 ? (
          <p className="text-center mt-4">You have no lists. Create one!</p>
      ) : ( 
        <Container className="d-flex flex-wrap gap-4 h-100">
          {lists.map((list) => (
            <Button
              key={list.id}
              variant="primary"
              className="w-25 h-25 bg-dark shadow-lg border-0 p-3"
              onClick={() => handleListCardClick(list.id)}
            >
              <Card className="h-100 position-relative bg-transparent border-0">
                <h2 className="mb-2">{list.name}</h2>
                <p className="mb-1">Last updated: {list.updateDate}</p>
                <Badge 
                  bg={list.isShared ? "success" : "primary"}
                  className="position-absolute top-0 end-0 m-2"
                >
                  {list.isShared ? "Shared" : "Private"}
                </Badge>
              </Card>
            </Button>
          ))}
        </Container>
      )}
    </div>
  );
}

export default Dashboard;