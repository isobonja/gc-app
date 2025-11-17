import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

import { 
  Container, 
  Row, 
  Col, 
  Form,
  Button,
  Modal,
  Dropdown
} from 'react-bootstrap';

import { UserContext } from '../context/UserContext';
import { useToasts } from '../context/ToastProvider';
import { useTheme } from '../context/ThemeContext';

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

import ListTable from '../components/ListTable';
import UserNavbar from '../components/UserNavbar';
import CenterSpinner from '../components/CenterSpinner';
import ManageUsersModal from '../components/ManageUsersModal';

import { categoryIdToName, convertUTCToLocal, sortArray } from '../util/utils';
import { 
  SUGGESTIONS_MAX_SHOW, 
  canManageUsers,
  canEdit,
 } from '../constants/constants';
import ExportListDataModal from '../components/ExportListDataModal';

// TODO: Move this to /constants/
const emptyItem = { name: "", category: "", quantity: 1, id: null };

/**
 * ListView Component
 *
 * @component
 * @returns {JSX.Element} The rendered grocery list view page.
 *
 * @description
 * - Displays the contents of a selected grocery list for the logged-in user.
 * - Allows users with appropriate permissions to **add**, **edit**, and **delete** items.
 * - Supports **category filtering**, **item sorting**, and **auto-suggestions** for item names.
 * - Provides a modal for **managing shared users** and their permissions.
 * - Dynamically updates when the list or its items change.
 * - Integrates loading spinners and toast notifications for user feedback.
 *
 * @uses useContext(UserContext) - For accessing the current user and list info.
 * @uses useToasts - For showing success and error notifications.
 * @uses useParams - To retrieve the current list ID from the URL.
 * @uses useItemSuggestions - For intelligent item name auto-completion.
 * @uses useSortableData - For sorting the displayed list items.
 * @uses useUserSuggestions - For searching and adding list collaborators.
 *
 * @state
 * - `items`: Array of all items in the current grocery list.
 * - `categories`: Available category options for the list.
 * - `users`: Array of users who have access to the list.
 * - `currentItem`: Object for storing the item currently being edited or added.
 * - `loading`: Boolean indicating whether data is being fetched.
 * - `showEditModal` / `showUserModal`: Control modal visibility states.
 * - `sortConfig`: Current sorting configuration (key, ascending).
 * - `error`: Stores any error messages for failed data operations.
 *
 * @example
 * // Example usage within a route:
 * <Route path="/list/:listId" element={<ListView />} />
 */
function ListView() {
  const { listId } = useParams();
  
  // User context
  const { user, setUser } = useContext(UserContext);
  const [userRole, setUserRole] = useState("Viewer");

  // User's preferred app theme
  const { theme } = useTheme();

  // Toast provider
  const { addToast } = useToasts();

  // Page reload flag
  const [reload, setReload] = useState(false);

  // List of categories
  // each category is {name, category_id}
  const [categories, setCategories] = useState([]);

  // Items in user's current grocery list
  // each item is {name, category, quantity, item_id}
  const [itemsInList, setItemsInList] = useState([]);

  // List data
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

  // Error message when adding item
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

  // Show manage users modal flag
  const [showManageUsersModal, setShowManageUsersModal] = useState(false);

  // Show export list data modal
  const [showExportListDataModal, setShowExportListDataModal] = useState(false);

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

  // Fetch items in user's current grocery list and categories
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
        //setItemsInList(data.items || []);
        setItemsInList(() => (
          data.items ? 
          data.items.map((i) => (
            { name: i.name, category: i.category, quantity: i.quantity, item_id: i.item_id, selected: false }
          )) : []
        ));
        setListName(data.listName || '');
        setUserRole(data.userRole || 'Viewer');
        
        setListModifiedDate(convertUTCToLocal(data.modified));

        setListOtherUsers(data.otherUsers || []);
      })
      .catch(err => console.error(err));
  }, [reload, listId]); // Run when component mounts, reload changes, or listId changes

  // Handle Add New Item form submission
  const handleAddItem = async (e) => {
    e.preventDefault();

    if(!user || !listId) {return;}

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
      const data = await apiAddItem(listId, addItem);
      if (data.success) {
        addToast(`Item ${addItem.name} added successfully!`, 'success');
        setAddItemError('');
        setAddItem(emptyItem);
        setReload(!reload);
      }
    } catch (err) {
      const backendError = err.response?.data?.error;
      if (backendError) {
        setAddItemError(backendError);
      } else {
        setAddItemError('Failed to add item');
      }
    }
  };

  // Handle showing Edit Item modal
  const handleShowEditItem = async (item) => {
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

  // Handle Edit Item form submission
  const handleEditItemSubmit = async (e) => {
    e.preventDefault();

    if(!user || !listId) {return;}

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
      setEditItemError('No changes to any fields.');
      addToast('No changes to any fields.', 'error');
      console.log('No changes in Edit Item Modal...');
      return;
    }

    try {
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

  // Handle closing Edit Item Modal
  const handleCloseEditItem = () => {
    setEditItem(emptyItem);
    setEditItemError('');
    setEditItemShow(false);
    originalEdit.current = { name: '', category: '', quantity: 1 };
  };

  // Handle deleting item
  const handleDeleteItem = async (item) => {
    if(!user || !listId) {return;}

    try {
      const data = await apiDeleteItem(listId, item.item_id);

      if (data.error) {
        addToast('Error deleting item.', 'error');
      }

      setReload(!reload);
      addToast(`Item "${item.name}" deleted successfully!`, 'success');
    } catch (err) {
      console.error(err);
      addToast(err, 'error');
    }
  };

  const handleItemSelect = (item) => {
    setItemsInList((prev) => 
      prev.map((i) => 
        i.item_id === item.item_id
        ? {...i, selected: !i.selected}
        : i
      )
    );
  };

  // Handle sorting logic of grocery list items
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
  
  // Handle Add Users Form Submit
  // TODO: RENAME TO 'handleManageUsersFormSubmit'
  const handleAddUsersFormSubmit = async ({ otherUsers }) => {
    try {
      const data = await manageUsersOfList({ listId, otherUsers });
      
      setReload((prev) => !prev);
      addToast("Users added to list!", "success");
    } catch (err) {
      console.error("Error creating new list:", err);
    }
  };

  const handleShowExportListDataModal = () => setShowExportListDataModal(true);
  const handleCloseExportListDataModal = () => setShowExportListDataModal(false);

  // Spinner while loading dashboard
  if (!user || !listModifiedDate) {
    return <CenterSpinner />;
  }

  return (
    <div id="main" className="d-flex flex-column min-vh-100">
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
          <Col xs='auto'>
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
          <Col xs='auto'>
            <Button>Import Items</Button>
          </Col>
          <Col xs='auto'>
            <Button>Create List from Selected</Button>
          </Col>
          <Col>
            <Button variant='outline-primary' className='py=0' onClick={() => handleShowExportListDataModal()}>Export Selected</Button>
          </Col>

          <Col xs="auto">
            <div className="d-flex align-items-center">
              <div className="d-flex align-items-center flex-wrap">
                {/* TODO: FIGURE OUT HOW TO PREVENT THIS LABEL FROM CHANGING WHEN MODAL OPEN */}
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
                  <small className="me-3">Private List</small>
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
          <Col className="border mx-3 pt-3"  style={{ overflowY: 'hidden' }}>
            {itemsInList.length === 0 ? (
              <Container className="d-flex flex-column align-items-center justify-content-center p-5">
                <p>No items.</p>
              </Container>
            ) : (
              <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                <ListTable 
                  items={itemsInList}
                  onItemSelect={handleItemSelect}
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
                <>
                  <p>Viewer Mode</p>
                  {/* TODO: This is a temporary solution. If user has 'Viewer' role or lower prio role, 
                    need to avoid showing Add Items form, either by removing it, or disabling the whole form */}
                </>
              )
            }
          </Col>
        </Row>

        {/** Edit Item Modal **/}
        {/* TODO: Move to own component script, similar to ManageUsersModal */}
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

        {/** Export List Data Modal */} 
        <ExportListDataModal 
          show={showExportListDataModal}
          handleClose={handleCloseExportListDataModal}
          items={itemsInList}
        />
      </Container>
    </div>
  );
}

export default ListView;