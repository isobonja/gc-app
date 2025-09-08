import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
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
  Dropdown
} from 'react-bootstrap'

import ListTable from './ListTable';
import { UserContext } from './UserContext';

axios.defaults.withCredentials = true; // Allow cookies to be sent with requests

function Dashboard() {
  /** State Variables **/
  const { user } = useContext(UserContext);

  // Page reload
  const [reload, setReload] = useState(false);

  // Currently displayed list ID
  const [currentListId, setCurrentListId] = useState(user.currentListId || null);

  // List of categories
  // each category is {name, category_id}
  const [categories, setCategories] = useState([]);

  // Items in user's current grocery list
  // each item is {name, category, quantity, item_id}
  const [itemsInList, setItemsInList] = useState([]);

  // New item form fields
  const [itemName, setItemName] = useState(''); // item name
  const [categoryName, setCategoryName] = useState(''); // item category
  const [quantity, setQuantity] = useState(1); // item quantity
  const [itemId, setItemId] = useState(null); // item ID (for existing items)

  // Edit item modal fields
  const [editItem, setEditItem] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);

  // Error message
  const [error, setError] = useState('');

  // Item suggestions for autofill
  const [itemSuggestions, setItemSuggestions] = useState([]);

  // Dropdown visibility for suggestions
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  // Edit Item Modal visibility
  const [editItemShow, setEditItemShow] = useState(false);


  // Fetch categories on component mount
  useEffect(() => {
    axios.get('http://localhost:5000/categories', { withCredentials: false })
      .then(response => setCategories(response.data.categories || []))
      .catch(err => console.error(err));
  }, []);

  // Fetch items in user's current grocery list and categories on component mount
  useEffect(() => {
    // TEMPORARILY MANUALLY SETTING LIST_ID HERE
    //const tmp_list_id = 1;
    //setCurrentListId(tmp_list_id);
    if (!currentListId) return;

    axios.get('http://localhost:5000/dashboard/home', {
      params: {list_id: currentListId }
    })
      .then(response => {
        setItemsInList(response.data.items || []);
        //setCategories(response.data.categories || []); //does the list of categories need to be fetched each time?
        setItemId(null);
      })
      .catch(error => console.error(error));
  }, [reload, currentListId]); // Run when component mounts or reload changes

  // For autofill suggestions when adding new item or editing item
  useEffect(() => {
    if (itemName.trim().length < 2) {
      setItemSuggestions([]);
      return;
    }

    const controller = new AbortController(); //AbortController used to prevent race conditions

    const fetchSuggestions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/dashboard/get_item_suggestions', {
          params: { query: itemName },
          signal: controller.signal,
          withCredentials: false
        });

        setItemSuggestions(res.data.items || []);
        setSuggestionsVisible(true);
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log('Request canceled', err.message);
        }

        console.error("Error fetching suggestions:", err);
      }
    };

    const timeout = setTimeout(fetchSuggestions, 300); // Debounce by 300ms
    return () => {
      clearTimeout(timeout);
      controller.abort(); // cancel previous request
    };
  }, [itemName]);

  const handleSuggestionClick = (suggestion) => {
    setItemName(suggestion.name);
    setCategoryName(categories.find(cat => cat.category_id === suggestion.category_id)?.name || '');
    setItemId(suggestion.item_id);
    setSuggestionsVisible(false);
  }

  const handleAddItem = async (e) => {
    e.preventDefault();

    if (!itemName.trim()) {
      setError('Item name is required');
      return;
    }
    if (!categoryName) {
      setError('Category is required');
      return;
    }

    try{
      const response = await axios.post('http://localhost:5000/dashboard/add_item', {
        currentListId,
        itemName,
        categoryName,
        quantity,
        itemId // can be null if new item
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setError('');
      }

      setItemName('');
      setCategoryName('');
      setQuantity(1);
      setItemId(null);
      
      setReload(!reload);
    } catch (err) {
      setError('Failed to add item');
    }
  }

  const handleEditItem = async (item) => {
    // Modal to edit item; then send updated data to server
    console.log(`Edit item: ${item.name}`);
    setEditItem(item.name);
    setEditCategory(item.category);
    setEditQuantity(item.quantity);
    setEditItemShow(true);
  }

  const handleEditItemSubmit = async (e) => {
    e.preventDefault();
  }

  const handleDeleteItem = async (item) => {
    // Delete grocery_list_item entry corresponding to item
    console.log(`Item nameL ${item.name}\tItem category: ${item.category}\tItem quantity: ${item.quantity}\tItem ID: ${item.item_id}`);
    try {
      const response = await axios.post('http://localhost:5000/dashboard/delete_item', {
        currentListId,
        item_id: item.item_id
      });

      if (response.data.error) {
        //setError(response.data.error);
      }

      setReload(!reload);
    } catch (err) {
      setError('Failed to delete item');
    }
  }

  const handleCloseEditItem = () => {
    setEditItemShow(false);
    setEditItem('')
    setEditCategory('')
    setEditQuantity(1)
  }

  //const handleShowEditItem = () => setEditItemShow(true);

  return (
    <div id="main" data-bs-theme="dark">
      {/** Navigation Bar **/}
      <Navbar expand="lg" className="bg-primary ps-3">
        <Navbar.Brand href="#home">Welcome, {user.username}</Navbar.Brand>
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
              <ListTable 
                items={itemsInList}
                onItemEdit={handleEditItem}
                onItemDelete={handleDeleteItem}
              />
            </Col>

            {/** Add New Item Form **/}
            <Col className="border mx-3">
              <Form className="p-3" onSubmit={handleAddItem}>
                <div className="position-relative w-100">
                  {/* Item name */}
                  <Form.Group className="mb-3" controlId="formItemName">
                    <Form.Label>Item Name:</Form.Label>
                    <Form.Control type="text" placeholder="Enter item name" value={itemName} onChange={e => setItemName(e.target.value)} />
                  </Form.Group>

                  {/* Suggestions Dropdown */}
                  <Dropdown.Menu
                    show={suggestionsVisible && itemSuggestions.length > 0}
                    style={{ position: 'absolute', zIndex: 1000, width: '100%', top: '100%', marginTop: 0 }}
                  >
                    {itemSuggestions.map((suggestion, idx) => (
                      <Dropdown.Item key={idx} onClick={() => handleSuggestionClick(suggestion)}> {/*Suggestion here is object with keys {item_id, name, category_id}*/}
                        {suggestion.name}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </div>

                {/* Category */}
                <Form.Group className="mb-3" controlId="formItemCategory">
                  <Form.Label>Category:</Form.Label>
                  <Form.Select value={categoryName} onChange={e => setCategoryName(e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map((cat, idx) => (
                      <option key={cat.category_id || idx} value={cat.name}>{cat.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Quantity */}
                <Form.Group className="mb-3" controlId="formItemQuantity">
                  <Form.Label>Quantity:</Form.Label>
                  <Form.Control type="number" placeholder="Enter quantity" value={quantity} onChange={e => setQuantity(e.target.value)}/>
                </Form.Group>

                {/* Error Message */}
                {error && 
                  <Form.Text className="text-danger">{error}</Form.Text>
                }
                <Button variant='primary' type='submit' className="w-100 mt-3">Add New Item to Current List</Button>
              </Form>
            </Col>
          </Row>

          {/** Edit Item Modal **/}
          <Modal show={editItemShow} onHide={handleCloseEditItem}>
            <Modal.Header closeButton>
              <Modal.Title>Edit Item</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {
                //Will need to have some kind of form similar to the add item form,
                //but will ideally use Modal.Footer to have the submit button.
              }
              <Form className="p-3" id="itemEditForm" onSubmit={handleEditItemSubmit}>
                <Form.Group className="mb-3" controlId="formEditItemName">
                  <Form.Label>Item Name:</Form.Label>
                  <Form.Control type="text" placeholder="Enter item name" value={editItem} onChange={e => setEditItem(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formEditItemCategory">
                  <Form.Label>Category:</Form.Label>
                  <Form.Select value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map((cat, idx) => (
                      <option key={cat.category_id || idx} value={cat.name}>{cat.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formEditItemQuantity">
                  <Form.Label>Quantity:</Form.Label>
                  <Form.Control type="number" placeholder="Enter quantity" value={editQuantity} onChange={e => setEditQuantity(e.target.value)}/>
                </Form.Group>
                {error && 
                  <Form.Text className="text-danger">{error}</Form.Text>
                }
                <Button variant='primary' type='submit' className="w-100 mt-3">Add New Item to Current List</Button>
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
    </div>
  );
}

export default Dashboard;