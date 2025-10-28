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
  ButtonGroup,
  Dropdown,
  Form
} from 'react-bootstrap';

import UserNavbar from '../components/UserNavbar';
import DashboardListGrid from '../components/DashboardListGrid';
import CenterSpinner from '../components/CenterSpinner';
import ManageListModal from '../components/ManageListModal';

import { fetchUserLists,
  deleteList as apiDeleteList,
  createNewList,
  editList as apiEditList
} from '../api/requests';
import { DASHBOARD_TABLE_HEADERS } from '../constants/constants';
import { capitalize, convertUTCToLocal, sortArray } from '../util/utils';
import DashboardListTable from '../components/DashboardListTable';

function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToasts();

  // User context
  // user is object with username and currentListId
  const { user, setUser } = useContext(UserContext);

  // List of grocery lists user has access to
  // Array of objects with keys 'id', 'name', 'type', 'role', 'last_updated', 'other_users'
  //   'other_users' is array of objects with keys 'user_id', 'username', 'role'
  const [lists, setLists] = useState([]);
  const [displayLists, setDisplayLists] = useState([]);
  const [gotLists, setGotLists] = useState(false);
  //const listsRef = useRef(lists);

  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [editListModalList, setEditListModalList] = useState(null);
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

  const [sortConfig, setSortConfig] = useState({ key: 'last updated', ascending: false });

  const handleSortLists = (sortBy = null, ascending = null) => {
    console.log(`sortBy is ${sortBy}`);
    if (sortBy === null && ascending !== null) {
      setSortConfig(prev => ({...prev, ascending: !prev.ascending}));
    } else if (sortBy !== null && ascending == null) {
      setSortConfig((prev) => {
        const ascending = prev.key === sortBy ? !prev.ascending : true;

        return { key: sortBy, ascending };
      });
    }
  };

  useEffect(() => {
    if (!lists.length) return;

    const sorted = DASHBOARD_TABLE_HEADERS.includes(sortConfig.key)
      ? sortArray(lists, sortConfig.key, sortConfig.ascending) 
      : lists;

    setDisplayLists(sorted);
  }, [sortConfig, lists]);

  const handleShowNewListModal = () => setShowNewListModal(true);
  const handleCloseNewListModal = () => setShowNewListModal(false);
  
  const handleNewListFormSubmit = async ({ listId, listName, otherUsers }) => {
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

  const handleShowEditListModal = (list) => {
    setEditListModalList(list);
    setShowEditListModal(true);
  };

  const handleCloseEditListModal = () => setShowEditListModal(false);

  const handleEditListFormSubmit = async ({ listId, listName, otherUsers }) => {
    console.log("Edit Item Submit");
    console.log(`New list name: ${listName}`);
    try {
      const data = await apiEditList({ listId, listName, otherUsers });

      setReload((prev) => !prev);
      addToast(`List "${listName}" edited successfully!`, "success");
    } catch (err) {
      console.error("Error editing list:", err);
    }
  };

  // Spinner while loading dashboard
  if (!user) {
    return <CenterSpinner />;
  }

  return (
    <div className="d-flex flex-column min-vh-100">
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
              {!listViewActive && 
                <>
                  <Col xs="auto" className="ps-0 pe-2">
                    Sort By: 
                  </Col>
                  <Col xs="auto" className="ps-0 pe-2">
                    <Form.Select
                      value={sortConfig.key} 
                      onChange={e => handleSortLists(e.target.value)}
                    >
                      {DASHBOARD_TABLE_HEADERS.map((sortBy, idx) => (
                        <option key={idx} value={sortBy}>{capitalize(sortBy)}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col xs="auto" className="p-0">
                    <Form.Select
                      value={sortConfig.ascending ? "true" : "false"} 
                      onChange={e => handleSortLists(null, e.target.value)}
                    >
                      <option value={true}>Ascending</option>
                      <option value={false}>Descending</option>
                    </Form.Select>
                  </Col>
                </>
              }
              
              <Col xs="auto">
                {/* EVENTUALLY REPLACE TEXT WITH ICONS */}
                <ButtonGroup className="gap-1">
                  <Button onClick={() => setListViewActive(true)}>List</Button>
                  <Button onClick={() => setListViewActive(false)}>Grid</Button>
                </ButtonGroup>
              </Col>
            </Row>
            
          </Container>
          {displayLists.length === 0 ? (
            <p className="text-center mt-4">You have no lists. Create one!</p>
          ) : (
            <Container 
              fluid 
              className="m-3 p-3 w-auto border d-flex flex-column flex-fill"
            >
              {listViewActive ? (
                <DashboardListTable
                  lists={displayLists} 
                  handleListClick={handleListClick}
                  handleListEdit={handleShowEditListModal} 
                  handleListDelete={handleListDelete}
                  onSort={handleSortLists}
                />
              ) : (
                <DashboardListGrid
                  lists={displayLists} 
                  handleListClick={handleListClick}
                  handleListEdit={handleShowEditListModal}
                  handleListDelete={handleListDelete}
                />
              )}
              
            </Container>
          )}
        </>
      )}

      {/* New List Modal */}
      <ManageListModal
        show={showNewListModal}
        handleClose={handleCloseNewListModal} 
        title={"Create New List"} 
        submitButtonText={"Create List"} 
        onFormSubmit={handleNewListFormSubmit}
      />

      {/* Edit List Modal */}
      <ManageListModal
        show={showEditListModal}
        handleClose={handleCloseEditListModal}
        title={"Edit List"} 
        submitButtonText={"Update List"} 
        onFormSubmit={handleEditListFormSubmit} 
        list={editListModalList}
      />
    </div>
  );
}

export default Dashboard;