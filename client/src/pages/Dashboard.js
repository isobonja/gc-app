import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from "react-router-dom";

import { UserContext } from '../context/UserContext';
import { useToasts } from '../context/ToastProvider';

import { 
  Container, 
  Row, 
  Col, 
  Card,
  Badge,
  Button,
  ButtonGroup
} from 'react-bootstrap';

import UserNavbar from '../components/UserNavbar';
import DashboardListGrid from '../components/DashboardListGrid';
import CenterSpinner from '../components/CenterSpinner';
import NewListModal from '../components/NewListModal';

import { fetchUserLists,
  deleteList as apiDeleteList,
  createNewList 
} from '../api/requests';
import { DASHBOARD_TABLE_HEADERS } from '../constants/constants';
import { convertUTCToLocal, sortArray } from '../util/utils';
import DashboardListTable from '../components/DashboardListTable';

function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToasts();

  // User context
  // user is object with username and currentListId
  const { user, setUser } = useContext(UserContext);

  // List of grocery lists user has access to
  const [lists, setLists] = useState([]);
  const [gotLists, setGotLists] = useState(false);
  //const listsRef = useRef(lists);

  const [showNewListModal, setShowNewListModal] = useState(false);
  const [reload, setReload] = useState(false);

  const [listViewActive, setListViewActive] = useState(true);

  // On mount, fetch lists user has access to
  useEffect(() => {
    const getLists = async () => {
      try {
        const data = await fetchUserLists();

        const processedLists = data.lists.map(l => ({
          ...l,
          last_updated: convertUTCToLocal(l.last_updated)
        }));

        setLists(processedLists);
        console.log("Fetched user lists:", processedLists);
        setGotLists(true);
      } catch (err) {
        console.error("Error fetching user lists:", err);
      }
    };
    getLists();
  }, [reload]);

  const handleListClick = (listId) => {
    console.log("Clicked list card with id:", listId);
    navigate(`/list/${listId}`);
  };

  const handleListDelete = async (listId, name) => {
    console.log("Delete list with id:", listId);
    try {
      const data = await apiDeleteList(listId);
      setReload((prev) => !prev);
      addToast(`List "${name}" deleted`, "success");
      
    } catch (err) {
      console.error("Error deleting list:", err);
    }
  };

  const [sortConfig, setSortConfig] = useState({ key: null, ascending: true });

  const handleSortLists = (sortBy) => {
    console.log(`sortBy is ${sortBy}`);
    setSortConfig((prev) => {
      const ascending = prev.key === sortBy ? !prev.ascending : true;

      return { key: sortBy, ascending };
    });
  };

  useEffect(() => {
    const sorted = DASHBOARD_TABLE_HEADERS.includes(sortConfig.key)
      ? sortArray(lists, sortConfig.key, sortConfig.ascending) 
      : lists;

    setLists(sorted);
  }, [sortConfig]);

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
      addToast(`List "${listName}" created`, "success");
    } catch (err) {
      console.error("Error creating new list:", err);
    }
  };

  // Spinner while loading dashboard
  if (!user) {
    return <CenterSpinner />;
  }

  return (
    <div data-bs-theme="dark" className="d-flex flex-column min-vh-100">
      <UserNavbar username={user ? user.username : null} />
      {!gotLists ? (
        <CenterSpinner />
      ) : (
        <>
          <Container fluid className="ps-3 pt-3 ">
            <Row className="px-3 align-items-center">
              <Col xs="auto">
                <h1>Your Lists</h1>
              </Col>
              <Col>
                <Button onClick={handleShowNewListModal}>Create New List</Button>
              </Col>
              <Col xs="auto">
                {/* EVENTUALLY REPLACE TEXT WITH ICONS */}
                <ButtonGroup className="gap-1">
                  <Button onClick={() => setListViewActive(true)}>List</Button>
                  <Button onClick={() => setListViewActive(false)}>Grid</Button>
                </ButtonGroup>
              </Col>
            </Row>
            
          </Container>
          {lists.length === 0 ? (
            <p className="text-center mt-4">You have no lists. Create one!</p>
          ) : (
            <Container 
              fluid 
              className="m-3 p-3 w-auto border d-flex flex-column flex-fill"
            >
              {listViewActive ? (
                <DashboardListTable
                  lists={lists} 
                  handleListClick={handleListClick}
                  handleListDelete={handleListDelete}
                  onSort={handleSortLists}
                />
              ) : (
                <DashboardListGrid
                  lists={lists} 
                  handleListClick={handleListClick}
                  handleListDelete={handleListDelete}
                />
              )}
              
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