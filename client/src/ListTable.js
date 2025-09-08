import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

import { 
  Table,
  Button
} from 'react-bootstrap'

function ListTable({ items, onItemEdit, onItemDelete }) {
  // items is an array of objects, each object has keys: name, category, quantity, item_id

  const headers = ["name", "category", "quantity"];

  return (
    <Table bordered hover>
      <thead>
        <tr>
          {headers.map((key) => (
            <th key={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</th>
          ))}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr key={idx}>
            {headers.map((key) => (
              <td key={key}>{item[key]}</td>
            ))}
            <td>
              <Button variant="warning" size="sm" onClick={() => onItemEdit(item)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => onItemDelete(item)}>
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default ListTable;

