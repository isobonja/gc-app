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

  const capitalize = (s) => {
    if (s === null || s === undefined) return '';
    return String(s)
      .split(/([ /])/g) // split by space or '/' but keep the delimiters
      .map(part => {
        // only capitalize non-delimiter parts
        return part === ' ' || part === '/' ? part : part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join('');
  };

  return (
    <Table bordered hover>
      <thead>
        <tr>
          {headers.map((key) => (
            <th key={key}>{capitalize(key)}</th>
          ))}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr key={idx}>
            {headers.map((key) => (
              <td key={key}>{capitalize(item[key])}</td>
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

