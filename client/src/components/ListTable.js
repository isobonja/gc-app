import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

import { 
  Table,
  Button,
  Form
} from 'react-bootstrap';

import { capitalize } from '../util/utils';

import { LIST_TABLE_HEADERS } from '../constants/constants';
import { useTheme } from '../context/ThemeContext';

/**
 * Displays a table of grocery list items with sorting and action controls.
 *
 * Each row represents an individual item in the current grocery list,
 * showing its name, category, and quantity. The table also includes "Edit"
 * and "Delete" action buttons for each item (optionally disabled based on permissions).
 *
 * The table supports light and dark themes through the `useTheme` context
 * and allows column sorting via clickable headers.
 *
 * @component
 * @param {Object} props
 * @param {Array<Object>} props.items - Array of item objects to display.
 * @param {string} props.items[].name - The name of the grocery item.
 * @param {string} props.items[].category - The category of the grocery item.
 * @param {string|number} props.items[].quantity - The quantity or amount of the item.
 * @param {number} props.items[].item_id - Unique identifier for the item.
 * @param {Function} props.onItemEdit - Callback fired when the Edit button is clicked.  
 *   Receives the full `item` object as an argument.
 * @param {Function} props.onItemDelete - Callback fired when the Delete button is clicked.  
 *   Receives the full `item` object as an argument.
 * @param {boolean} props.disableButtons - If true, disables Edit/Delete buttons (e.g., for read-only roles).
 * @param {Function} props.onSort - Callback fired when a column header is clicked for sorting.  
 *   Receives the header key (string) as an argument.
 *
 * @example
 * const items = [
 *   { name: "Apples", category: "Fruit", quantity: 6, item_id: 1 },
 *   { name: "Milk", category: "Dairy", quantity: 1, item_id: 2 },
 * ];
 *
 * <ListTable
 *   items={items}
 *   onItemEdit={(item) => console.log("Editing", item.name)}
 *   onItemDelete={(item) => console.log("Deleting", item.item_id)}
 *   disableButtons={false}
 *   onSort={(key) => console.log("Sorting by", key)}
 * />
 */
function ListTable({ items, onItemEdit, onItemDelete, disableButtons, onSort }) {
  // items is an array of objects, each object has keys: name, category, quantity, item_id

  const { theme } = useTheme();

  return (
    <Table bordered hover striped variant={theme === "light" ? "secondary" : "dark"} className="table-fixed">
      <thead className={theme === "light" ? "table-primary" : "table-dark"} >
        <tr>
          <th style={{ width: '5%' }}>✓</th>
          {LIST_TABLE_HEADERS.map((key) => (
            <th key={key} style={{ position: "relative" }}>
              <div onClick={() => onSort(key)} style={{ cursor: "pointer" }}>
                {capitalize(key)}
              </div>
            </th>
          ))}
          <th style={{ width: '20%' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr key={idx} className="align-middle">
            <td className=''>
              <Form.Check />
            </td>
            {LIST_TABLE_HEADERS.map((key) => (
              <td key={key}>{capitalize(item[key])}</td>
            ))}
            <td>
              <div className="d-flex flex-row gap-2">
                <Button 
                  variant="warning" 
                  size="sm" 
                  className="flex-fill"
                  onClick={() => onItemEdit(item)}
                  disabled={disableButtons}
                >
                  Edit
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="flex-fill" 
                  onClick={() => onItemDelete(item)}
                  disabled={disableButtons}
                >
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default ListTable;

