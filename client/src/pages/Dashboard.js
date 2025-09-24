import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
//import { BsGear } from "react-icons/bs";

import { 
  Container, 
  Row, 
  Col, 
  Nav, 
  Navbar,
  Table,
  Form,
  Button,
  Modal,
  Dropdown,
  Toast,
  ToastContainer,
  Spinner
} from 'react-bootstrap';

import ListTable from '../components/ListTable';
import CenterSpinner from '../components/CenterSpinner';
import { UserContext } from '../context/UserContext';

import {
  fetchCategories,
  fetchItems,
  addItem as apiAddItem,
  editItem as apiEditItem,
  deleteItem as apiDeleteItem,
  getSession,
  logout as apiLogOut,
} from '../api/requests';

import { useItemSuggestions } from "../hooks/useItemSuggestions";

const emptyItem = { name: "", category: "", quantity: 1, id: null };

function Dashboard() {
  const navigate = useNavigate();
  /** State Variables **/
  const { user, setUser } = useContext(UserContext);

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


  // restore user from session on refresh
  useEffect(() => {
    if (!user || !user.username) {   // only fetch if context is empty
      getSession()
        .then(data => {
          if (data?.username) {
            setUser({
              username: data.username,
              currentListId: data.currentListId,
            });
          }
        })
        .catch(err => console.error("Failed to fetch session", err));
    }
  }, [user, setUser]);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
      .then(data => setCategories(data.categories || []))
      .catch(err => console.error(err));
  }, []);

  // Fetch items in user's current grocery list and categories on component mount
  useEffect(() => {
    if (!user?.currentListId) return;   // safe guard

    console.log(`Current list ID: ${user.currentListId}`);
    fetchItems(user.currentListId)
      .then(data => setItemsInList(data.items || []))
      .catch(err => console.error(err));
  }, [reload, user?.currentListId]); // Run when component mounts or reload changes

  // Handle Add New Item form submission
  const handleAddItem = async (e) => {
    e.preventDefault();

    if(!user || !user.currentListId) {return;}

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
      const data = await apiAddItem(user.currentListId, addItem);

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

    if(!user || !user.currentListId) {return;}

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
      const data = await apiEditItem(user.currentListId, {
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
    
    if(!user || !user.currentListId) {return;}

    try {
      const data = await apiDeleteItem(user.currentListId, item.item_id);

      if (data.error) {
        //setError(response.data.error);
        //need to set up error visual for deleting item
        //probably a Toast?
        addToast('Error deleting item.', 'error');
      }

      setReload(!reload);
    } catch (err) {
      console.error(err);
      addToast(err, 'error');
    }
  };

  const handleLogOut = async () => {

    try {
      const data = await apiLogOut();

      if(data.success) {
        setUser(null);
        navigate('/');
      }
    } catch (err) {
      console.error("Unable to log out, please try again later.");
    }
  };

  // *** TOASTS ***
  const [toasts, setToasts] = useState([]);
  
  const addToast = (message, variant = 'info', delay = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, variant, delay, show: true }]);
  };

  const FADE_DURATION = 300;

  const requestCloseToast = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, show: false } : t));
    setTimeout(() => removeToast(id), FADE_DURATION);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  /*
  const baseSpinner = (container_height) => (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: container_height || '100%' }}>
      <Spinner animation="border" role="status"></Spinner>
    </Container>
  );*/

  // Spinner while loading dashboard
  if (!user) {
    return <CenterSpinner />;
  }

  return (
    <div id="main" data-bs-theme="dark">
      {/** Navigation Bar **/}
      <Navbar expand="lg" className="bg-primary ps-3">
        <Container fluid>
          <Navbar.Brand href="#home">
            {user ? `Welcome, ${user.username}` : "Welcome"}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="dashboard-nav" />
          <Navbar.Collapse id="dashboard-nav">
            <Nav className="me-auto">
              
            </Nav>
            <Nav>
              <Button type="button" variant="outline-light" onClick={() => handleLogOut()}>
                Log Out
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
        
        {/**<Container>
          <Navbar.Brand href="#home">Grocery List App</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#home">Home</Nav.Link>
              <Nav.Link href="#link">Link</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>*/}

      {/** Main Content **/}
      <Container fluid className="">
        <Row className="h-100">

          {/** Current Grocery List Table **/}
          <Col className="border mx-3">
            {itemsInList.length === 0 ? (
              <CenterSpinner height="50vh" />
            ) : (
              <ListTable 
                items={itemsInList}
                onItemEdit={handleShowEditItem}
                onItemDelete={handleDeleteItem}
              />
            )}
          </Col>

          {/** Add New Item Form **/}
          <Col className="border mx-3">
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
                  {addItemSuggestions.map((suggestion, idx) => (
                    <Dropdown.Item key={idx} onClick={() => handleSuggestionClick(suggestion)}> {/*Suggestion here is object with keys {item_id, name, category_id}*/}
                      {suggestion.name}
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
                  {editItemSuggestions.map((suggestion, idx) => (
                    <Dropdown.Item
                      key={idx}
                      onClick={() => handleEditSuggestionClick(suggestion)}
                    >
                      {suggestion.name}
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
      </Container>

      {/* Toasts */}
      <ToastContainer 
        className="p-3"
        position='bottom-end' 
        style={{ zIndex: 10 }}
      >
        {toasts.map(toast => {
          const variant =
            toast.variant === "success" ? "success" :
            toast.variant === "error"   ? "danger"  :
                                      "secondary";
          const textClass = variant === "secondary" ? "" : "text-white";

          return (
            <Toast
              key={toast.id} 
              show={toast.show} 
              onClose={() => requestCloseToast(toast.id)}
              autohide 
              delay={toast.delay} 
              bg={variant}
              className={textClass}
              style={{ minWidth: "250px", marginBottom: "10px" }}
              animation
            >
              <Toast.Body>{toast.message}</Toast.Body>
            </Toast>
          );
        })}
      </ToastContainer>
    </div>
  );
}

export default Dashboard;