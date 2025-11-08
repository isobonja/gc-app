import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
//import { BsGear } from "react-icons/bs";

import { 
  Container, 
  Row, 
  Col, 
  Form,
  Button,
  Modal,
  Dropdown
} from 'react-bootstrap';

import ListTable from '../components/ListTable';
import UserNavbar from '../components/UserNavbar';
import CenterSpinner from '../components/CenterSpinner';
import ManageUsersModal from '../components/ManageUsersModal';
import { UserContext } from '../context/UserContext';
import { useToasts } from '../context/ToastProvider';

import {
  fetchCategories,
  fetchListData,
  addItem as apiAddItem,
  editItem as apiEditItem,
  deleteItem as apiDeleteItem,
  getSession,
  manageUsersOfList
} from '../api/requests';

import { useItemSuggestions } from "../hooks/useItemSuggestions";

import { categoryIdToName, convertUTCToLocal, sortArray } from '../util/utils';

import { 
  SUGGESTIONS_MAX_SHOW, 
  canManageUsers,
  canEdit,
 } from '../constants/constants';
import { useTheme } from '../context/ThemeContext';


const emptyItem = { name: "", category: "", quantity: 1, id: null };

function ListView() {
  //const navigate = useNavigate();
  const { listId } = useParams();
  /** State Variables **/
  const { user, setUser } = useContext(UserContext);
  const [userRole, setUserRole] = useState("Viewer");

  const { theme } = useTheme();

  const { addToast } = useToasts();

  // Page reload
  const [reload, setReload] = useState(false);

  // Currently displayed list ID
  //const [currentListId, setCurrentListId] = useState(user.currentListId || null);

  // List of categories
  // each category is {name, category_id}
  const [categories, setCategories] = useState([]);

  // Items in user's current grocery list
  // each item is {name, category, quantity, item_id}
  const [itemsInList, setItemsInList] = useState([]);
  const [listName, setListName] = useState('');
  const [listModifiedDate, setListModifiedDate] = useState(null);
  const [listOtherUsers, setListOtherUsers] = useState([]); // list of objects with keys 'user_id', 'username', 'role'

  // State for item to be added
  // Object with keys 'name', 'category', 'quantity', and 'id'
  const [addItem, setAddItem] = useState(emptyItem);

  // State for item to be edited
  // Object with keys 'name', 'category', 'quantity', and 'id'
  const [editItem, setEditItem] = useState(emptyItem);

  // Snapshot of original values when Edit Item Modal opens
  const originalEdit = useRef({ name: '', category: '', quantity: 1, id: null });

  // Error message
  // *** Need to make more specific
  const [addItemError, setAddItemError] = useState('');

  // Add item suggestions
  const {
    suggestions: addItemSuggestions,
    visible: addItemSuggestionsVisible,
    handleClick: handleSuggestionClick,
  } = useItemSuggestions(addItem.name, categories, setAddItem);

  // Edit item suggestions
  const {
    suggestions: editItemSuggestions,
    visible: editItemSuggestionsVisible,
    handleClick: handleEditSuggestionClick,
  } = useItemSuggestions(editItem.name, categories, setEditItem);

  // Edit Item modal show & errors
  const [editItemShow, setEditItemShow] = useState(false);
  const [editItemError, setEditItemError] = useState('');

  const [showManageUsersModal, setShowManageUsersModal] = useState(false);


  // restore user from session on refresh
  useEffect(() => {
    if (!user || !user.username) {   // only fetch if context is empty
      console.log("Fetching user session...");
      getSession()
        .then(data => {
          if (data?.username) {
            setUser({
              username: data.username,
              currentListId: listId || data.currentListId || null,
            });
          }
        })
        .catch(err => console.error("Failed to fetch session", err));
      console.log(`Fetched session; currentListId: ${user?.currentListId}`);
    }
  }, [user, setUser, listId]);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
      .then(data => setCategories(data.categories || []))
      .catch(err => console.error(err));
  }, []);

  // Fetch items in user's current grocery list and categories on component mount
  useEffect(() => {
    if (!listId) {
      if (!user?.currentListId) {
        console.error("No current list ID in user context");
      }
      return;   // safe guard
    }

    console.log(`Current list ID: ${listId}`);

    fetchListData(listId)
      .then(data => {
        setItemsInList(data.items || []);
        setListName(data.listName || '');
        setUserRole(data.userRole || 'Viewer');
        
        setListModifiedDate(convertUTCToLocal(data.modified));

        setListOtherUsers(data.otherUsers || []);
      })
      .catch(err => console.error(err));
  }, [reload, listId]); // Run when component mounts or reload changes

  // Handle Add New Item form submission
  const handleAddItem = async (e) => {
    e.preventDefault();

    if(!user || !listId) {return;}

    console.log(`item name: ${addItem.name}\tcategory: ${addItem.category}\tquantity: ${addItem.quantity}`);

    if (!addItem.name.trim()) {
      setAddItemError('Item name is required');
      addToast('Item name is required', 'error');
      return;
    }

    if (!addItem.category.trim()) {
      setAddItemError('Category is required');
      addToast('Category is required', 'error');
      return;
    }

    try{
      //const data = await apiAddItem(user.currentListId, addItem);
      const data = await apiAddItem(listId, addItem);

      if (data.error) {
        setAddItemError(data.error);
        addToast(data.error, 'error');
      } else {
        addToast(`Item ${addItem.name} added successfully!`, 'success');
        setAddItemError('');
        setAddItem(emptyItem);
        setReload(!reload);
      }
    } catch (err) {
      setAddItemError('Failed to add item');
      addToast('Failed to add item', 'error');
    }
  };

  const handleShowEditItem = async (item) => {
    // Modal to edit item
    console.log(`Edit item: ${item.name}, ${item.category}, ${item.quantity}, ${item.item_id}`);

    setEditItem(prev => ({
      ...prev,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      id: item.item_id,
    }));

    originalEdit.current = {
      name: item.name ?? '',
      category: item.category ?? '',
      quantity: item.quantity ?? 1,
      id: item.item_id ?? null,
    };

    setEditItemShow(true);
  };

  const handleEditItemSubmit = async (e) => {
    e.preventDefault();

    if(!user || !listId) {return;}

    console.log("Edit item modal Submit button pressed");

    if (!editItem.name.trim() || !editItem.category.trim()) {
      setEditItemError("Item name and category are required.");
      addToast('Item name and category are required.', 'error');
      return;
    }

    const hasNoChanges =
      editItem.name.trim() === (originalEdit.current.name || '').trim() &&
      editItem.category.trim() === (originalEdit.current.category || '').trim() &&
      Number(editItem.quantity) === Number(originalEdit.current.quantity);

    if (hasNoChanges) {
      // Probably edit this to just close the Modal w/o making a request
      setEditItemError('No changes to any fields.');
      addToast('No changes to any fields.', 'error');
      console.log('no changes');
      return;
    }

    try {
      //const data = await apiEditItem(user.currentListId, {
      const data = await apiEditItem(listId, {
        name: originalEdit.current.name,
        category: originalEdit.current.category,
        quantity: originalEdit.current.quantity,
        id: originalEdit.current.id,
      }, {
        name: editItem.name.trim(),
        category: editItem.category.trim(),
        quantity: Number(editItem.quantity),
        id: editItem.id,
      });

      if (data.error) {
        setEditItemError(data.error);
        addToast(data.error, 'error');
        return;
      }

      handleCloseEditItem();
      setReload(!reload);
      addToast(`Item updated successfully!`, 'success');

    } catch (err) {
      setEditItemError('Failed to update item.');
      addToast('Failed to update item.', 'error');
    }
  };

  const handleCloseEditItem = () => {
    setEditItem(emptyItem);
    setEditItemError('');
    setEditItemShow(false);
    originalEdit.current = { name: '', category: '', quantity: 1 };
  };

  const handleDeleteItem = async (item) => {
    // Delete grocery_list_item entry corresponding to item
    console.log(`Item name: ${item.name}\tItem category: ${item.category}\tItem quantity: ${item.quantity}\tItem ID: ${item.item_id}`);
    
    if(!user || !listId) {return;}

    try {
      //const data = await apiDeleteItem(user.currentListId, item.item_id);
      const data = await apiDeleteItem(listId, item.item_id);

      if (data.error) {
        //setError(response.data.error);
        //need to set up error visual for deleting item
        //probably a Toast?
        addToast('Error deleting item.', 'error');
      }

      setReload(!reload);
      addToast(`Item "${item.name}" deleted successfully!`, 'success');
    } catch (err) {
      console.error(err);
      addToast(err, 'error');
    }
  };

  const [sortConfig, setSortConfig] = useState({ key: null, ascending: true });

  const handleSortItems = (sortBy) => {
    setSortConfig((prev) => {
      const ascending = prev.key === sortBy ? !prev.ascending : true;

      return { key: sortBy, ascending };
    });
  };

  useEffect(() => {
    const sorted = sortArray(itemsInList, sortConfig.key, sortConfig.ascending);

    setItemsInList(sorted);
  }, [sortConfig]);

  const handleShowManageUsersModal = () => setShowManageUsersModal(true);
  const handleCloseManageUsersModal = () => setShowManageUsersModal(false);
  
  const handleAddUsersFormSubmit = async ({ otherUsers }) => {
    console.log("Adding users to list...");

    try {
      const data = await manageUsersOfList({ listId, otherUsers });
      
      setReload((prev) => !prev);
      addToast("Users added to list!", "success");
    } catch (err) {
      console.error("Error creating new list:", err);
    }
  };

  // Spinner while loading dashboard
  if (!user || !listModifiedDate) {
    return <CenterSpinner />;
  }

  return (
    <div id="main" className="d-flex flex-column min-vh-100">
      {/*
        <div id="main" data-bs-theme="dark" className="bg-dark text-light min-vh-100">
        THIS IS HOW TO MAKE THE PAGE ACTUALLY DARK MODE
        WOULD NEED TO MAKE CHANGES TO ALL PAGES, OR FIND A WAY TO ONLY IMPLEMENT A DARK MODE SWITCH ONCE

        ALSO NEED TO SET UP LIGHT/DARK MODE SWITCH OPTION IN GENERAL
        ALSO LOOK INTO CUSTOM COLORS
      */}
      {/** Navigation Bar **/}
      <UserNavbar username={user.username} />

      {/** Main Content **/}
      <Container fluid className="d-flex flex-column flex-fill">

        {/* List Info */}
        <Row 
          className={[
            "mx-1 my-3 p-3 align-items-center border rounded-3 shadow-sm justify-content-between",
            theme === "light" ? "bg-dark text-light" : "bg-light text-primary"
          ].join(" ")}
        >
          <Col>
            <Row className="align-items-center">
              <Col xs="auto">
                <h3 className="mb-0 fw-bold">{listName}</h3>
              </Col>
              <Col>
                <small className="mb-0">
                  Last Modified: {listModifiedDate}
                </small>
              </Col>
            </Row>
          </Col>

          <Col xs="auto">
            <div className="d-flex align-items-center">
              <div className="d-flex align-items-center flex-wrap">
                {/* NEED TO FIGURE OUT HOW TO PREEVENT THIS LABEL FROM CHANGING WHEN MODAL OPEN */}
                {(listOtherUsers.length > 0) ? (
                  <>
                    <small className="me-1">Shared with:</small>
                    {listOtherUsers.map((user, idx) => (
                      <small key={user.user_id || idx} className="me-1">
                        {user.username}
                        {idx < listOtherUsers.length - 1 ? ',' : ''}
                      </small>
                    ))}
                  </>
                ) : (
                  <small className="text-muted me-3">Private List</small>
                )}
              </div>

              {canManageUsers(userRole) &&
                <Button 
                  variant="primary" 
                  size="sm"
                  className="ms-3"
                  onClick={handleShowManageUsersModal}
                >
                  Add Users
                </Button>
              }
              
            </div>
          </Col>
        </Row>

        <Row className="flex-fill">

          {/** Current Grocery List Table **/}
          <Col className="border mx-3 pt-3"  style={{ overflowY: 'scroll' }}>
            {itemsInList.length === 0 ? (
              <Container className="d-flex flex-column align-items-center justify-content-center p-5">
                <p>No items.</p>
              </Container>
            ) : (
              <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                <ListTable 
                  items={itemsInList}
                  onItemEdit={handleShowEditItem}
                  onItemDelete={handleDeleteItem} 
                  disableButtons={!canEdit(userRole)} 
                  onSort={handleSortItems}
                />
              </div>
            )}
          </Col>

          {/** Add New Item Form **/}
          <Col className="border mx-3">
            {canEdit(userRole) ? (
              <Form className="p-3" onSubmit={handleAddItem}>
                <div className="position-relative w-100">
                  {/* Item name */}
                  <Form.Group className="mb-3" controlId="formItemName">
                    <Form.Label>Item Name:</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter item name" 
                      value={addItem.name} 
                      onChange={e => setAddItem(prev => ({...prev, name: e.target.value}))} 
                    />
                  </Form.Group>

                  {/* Suggestions Dropdown */}
                  <Dropdown.Menu
                    show={addItemSuggestionsVisible && addItemSuggestions.length > 0}
                    style={{ position: 'absolute', zIndex: 1000, width: '100%', top: '100%', marginTop: 0 }}
                  >
                    {addItemSuggestions.slice(0, SUGGESTIONS_MAX_SHOW).map((suggestion, idx) => (
                      <Dropdown.Item key={idx} onClick={() => handleSuggestionClick(suggestion)}> {/*Suggestion here is object with keys {item_id, name, category_id}*/}
                        <Container className="p-0 m-0">
                          <Row>
                            <Col>{suggestion.name}</Col>
                            <Col className="text-end text-muted">
                              <small><i>{categoryIdToName(suggestion.category_id, categories)}</i></small>
                            </Col>
                          </Row>
                        </Container>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </div>

                {/* Category */}
                <Form.Group className="mb-3" controlId="formItemCategory">
                  <Form.Label>Category:</Form.Label>
                  <Form.Select 
                    value={addItem.category} 
                    onChange={e => setAddItem(prev => ({...prev, category: e.target.value}))}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat, idx) => (
                      <option key={cat.category_id || idx} value={cat.name}>{cat.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Quantity */}
                <Form.Group className="mb-3" controlId="formItemQuantity">
                  <Form.Label>Quantity:</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="Enter quantity" 
                    value={addItem.quantity} 
                    onChange={e => setAddItem(prev => ({...prev, quantity: e.target.value}))}
                  />
                </Form.Group>

                {/* Error Message */}
                {addItemError && 
                  <Form.Text className="text-danger">{addItemError}</Form.Text>
                }
                <Button 
                  variant='primary' 
                  type='submit' 
                  className="w-100 mt-3"
                  disabled={!addItem.name.trim() || !addItem.category}
                >
                  Add New Item to Current List
                </Button>
              </Form>
              ) : (
                <p>Viewer Mode</p>
              )
            }
            
          </Col>
        </Row>



        {/** Edit Item Modal **/}
        <Modal show={editItemShow} onHide={handleCloseEditItem}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Item</Modal.Title>
          </Modal.Header>
          
          <Modal.Body>
            <Form className="p-3" id="itemEditForm" onSubmit={handleEditItemSubmit}>
              <div className="position-relative w-100">
                <Form.Group className="mb-3" controlId="formEditItemName">
                  <Form.Label>Item Name:</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Enter item name" 
                    value={editItem.name} 
                    onChange={e => setEditItem(prev => ({...prev, name: e.target.value}))} 
                  />
                </Form.Group>

                <Dropdown.Menu
                  show={editItemSuggestionsVisible && editItemSuggestions.length > 0}
                  style={{
                    position: "absolute",
                    zIndex: 1000,
                    width: "100%",
                    top: "100%",
                    marginTop: 0,
                  }}
                >
                  {editItemSuggestions.slice(0, SUGGESTIONS_MAX_SHOW).map((suggestion, idx) => (
                    <Dropdown.Item
                      key={idx}
                      onClick={() => handleEditSuggestionClick(suggestion)}
                    >
                      <Container className="p-0 m-0">
                        <Row>
                          <Col>{suggestion.name}</Col>
                          <Col className="text-end text-muted">
                            <small><i>{categoryIdToName(suggestion.category_id, categories)}</i></small>
                          </Col>
                        </Row>
                      </Container>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </div>

              <Form.Group className="mb-3" controlId="formEditItemCategory">
                <Form.Label>Category:</Form.Label>
                <Form.Select 
                  value={editItem.category} 
                  onChange={e => setEditItem(prev => ({...prev, category: e.target.value}))}
                >
                  <option value="">Select category</option>
                  {categories.map((cat, idx) => (
                    <option key={cat.category_id || idx} value={cat.name}>{cat.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formEditItemQuantity">
                <Form.Label>Quantity:</Form.Label>
                <Form.Control 
                  type="number" 
                  placeholder="Enter quantity" 
                  value={editItem.quantity} 
                  onChange={e => setEditItem(prev => ({...prev, quantity: e.target.value}))}
                />
              </Form.Group>

              {editItemError && 
                <Form.Text className="text-danger">{editItemError}</Form.Text>
              }
            </Form>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseEditItem}>
              Cancel
            </Button>
            <Button type="submit" form="itemEditForm" variant="primary">
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/** Add Users Modal **/}
        <ManageUsersModal
          show={showManageUsersModal}
          handleClose={handleCloseManageUsersModal}
          onFormSubmit={handleAddUsersFormSubmit}
          listName={listName} 
          currentUserRole={userRole}
          otherUsers={listOtherUsers} 
          setOtherUsers={setListOtherUsers}
        />  

      </Container>
    </div>
  );
}

export default ListView;