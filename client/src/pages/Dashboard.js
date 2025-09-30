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
import NewListModal from '../components/NewListModal';

import { fetchUserLists } from '../api/requests';
import { createNewList } from '../api/requests';


function Dashboard() {
  const navigate = useNavigate();

  // User context
  // user is object with username and currentListId
  const { user, setUser } = useContext(UserContext);

  // List of grocery lists user has access to
  const [lists, setLists] = useState([]);
  const [gotLists, setGotLists] = useState(false);
  //const listsRef = useRef(lists);

  const [showNewListModal, setShowNewListModal] = useState(false);
  const [reload, setReload] = useState(false);

  // On mount, fetch lists user has access to
  useEffect(() => {
    const getLists = async () => {
      try {
        const data = await fetchUserLists();
        setLists(data.lists);
        console.log("Fetched user lists:", data.lists);
        setGotLists(true);
      } catch (err) {
        console.error("Error fetching user lists:", err);
      }
    };
    getLists();
  }, [reload]);

  const handleListCardClick = (listId) => {
    console.log("Clicked list card with id:", listId);
    navigate(`/list/${listId}`);
  };

  const handleShowNewListModal = () => setShowNewListModal(true);
  const handleCloseNewListModal = () => setShowNewListModal(false);
  
  const handleNewListFormSubmit = async ({ listName, otherUsers }) => {
    try {
      const data = await createNewList({ listName, otherUsers });
      
      /*if (data.success) {
        setLists((prev) => [...prev, newList]);
      } else {
        console.error("Error creating new list:", data.message);
      }*/
      setReload((prev) => !prev);     
    } catch (err) {
      console.error("Error creating new list:", err);
    }
  };

  return (
    <div data-bs-theme="dark" className="d-flex flex-column min-vh-100">
      <UserNavbar username={user ? user.username : null} />
      {!gotLists ? (
        <CenterSpinner />
      ) : (
        <>
          <Container fluid className="ps-3 pt-3">
            <Row className="ps-3 align-items-center">
              <Col xs="auto">
                <h1>Your Lists</h1>
              </Col>
              <Col>
                <Button onClick={handleShowNewListModal}>Create New List</Button>
              </Col>
            </Row>
            
          </Container>
          {lists.length === 0 ? (
            <p className="text-center mt-4">You have no lists. Create one!</p>
          ) : (
            <Container 
              fluid 
              className="m-3 p-3 w-auto d-flex flex-wrap gap-4 border"
            >
              {lists.map((list) => (
                <Card
                  key={list.id}
                  onClick={() => handleListCardClick(list.id)}
                  className="w-25 h-25 bg-dark shadow-lg border-0 p-3 position-relative"
                  role="button"
                >
                  <h2 className="mb-2">{list.name}</h2>
                  <p className="mb-1">Last updated: {list.updateDate}</p>
                  <hr />
                  <Button variant="danger" onClick={(e) => { e.stopPropagation(); /* delete action */ }}>
                    Delete
                  </Button>
                  <Badge 
                    bg={list.isShared ? "success" : "primary"}
                    className="position-absolute top-0 start-0 m-2"
                  >
                    {list.isShared ? "Shared" : "Private"}
                  </Badge>
                </Card>
              ))}
            </Container>
          )}
        </>
      )}

      {/* New List Modal */}
      <NewListModal
        show={showNewListModal}
        handleClose={handleCloseNewListModal}
        onFormSubmit={handleNewListFormSubmit}
      />
    </div>
  );
}

export default Dashboard;