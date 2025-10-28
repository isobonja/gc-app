import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

import { 
  Table,
  Button
} from 'react-bootstrap';

import { capitalize } from '../util/utils';

import { LIST_TABLE_HEADERS } from '../constants/constants';

function ListTable({ items, onItemEdit, onItemDelete, disableButtons, onSort }) {
  // items is an array of objects, each object has keys: name, category, quantity, item_id

  return (
    <Table bordered hover>
      <thead>
        <tr>
          {LIST_TABLE_HEADERS.map((key) => (
            <th key={key} onClick={() => onSort(key)} style={{ cursor: 'pointer' }}>{capitalize(key)}</th>
          ))}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr key={idx}>
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

