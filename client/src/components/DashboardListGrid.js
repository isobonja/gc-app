import React, { useState } from 'react';

import {
  Row,
  Col,
  Button,
  Badge,
  Card
} from 'react-bootstrap';

import { formatListUserDisplay } from '../util/utils';

import { isOwner } from '../constants/constants';

/**
 * A responsive grid layout for displaying grocery lists on the dashboard.
 *
 * Each list is shown as a Bootstrap card with its name, last update time,
 * sharing status, and action buttons for editing or deleting (if the user is an owner).
 *
 * @component
 * @param {Object} props
 * @param {Array<Object>} props.lists - Array of grocery list objects to display.
 * @param {number} props.lists[].id - The unique ID of the list.
 * @param {string} props.lists[].name - The name of the grocery list.
 * @param {string} props.lists[].last_updated - The last updated date/time of the list.
 * @param {Array<Object>} props.lists[].other_users - Users the list is shared with.
 * @param {string} props.lists[].role - The current user's role in the list (e.g., `"Owner"`, `"Editor"`, `"Viewer"`).
 * @param {Function} props.handleListClick - Function to handle when a list card is clicked.
 * @param {Function} props.handleListEdit - Function to handle when the edit button is clicked.
 * @param {Function} props.handleListDelete - Function to handle when the delete button is clicked.
 *
 * @example
 * const lists = [
 *   {
 *     id: 1,
 *     name: "Weekly Groceries",
 *     last_updated: "2025-10-08",
 *     other_users: [{ username: "Alice" }, { username: "Bob" }],
 *     role: "Owner"
 *   },
 *   {
 *     id: 2,
 *     name: "Camping Supplies",
 *     last_updated: "2025-10-07",
 *     other_users: [],
 *     role: "Viewer"
 *   }
 * ];
 *
 * <DashboardListGrid
 *   lists={lists}
 *   handleListClick={(id) => console.log("Open list", id)}
 *   handleListEdit={(list) => console.log("Edit list", list)}
 *   handleListDelete={(id, name) => console.log("Delete list", id, name)}
 *   onSort={() => console.log("Sort lists")}
 * />
 */
function DashboardListGrid({ lists, handleListClick, handleListEdit, handleListDelete }) {

  return (
    <Row className="g-4">
      {lists.map((list) => (
        <Col key={list.id} xs={12} sm={6} md={4} lg={3}>
          <Card
            onClick={() => handleListClick(list.id)}
            className="h-100 shadow-lg border-0 p-3 position-relative d-flex flex-column"
            role="button"
          >
            <div className="text-center mt-4 mb-1 flex-grow-1">
              <h2 className="mb-2">{list.name}</h2>
              <p className="mb-1">Last updated: {list.last_updated}</p>
              <small className="text-muted"><i>
                {list.other_users.length > 0 
                  ? <>Shared with: {formatListUserDisplay(list.other_users)}</>
                  : ""}
              </i></small>
            </div>
            <hr />
            <div className="mt-auto d-flex flex-row gap-2 align-items-center">
              <Button
                className="w-50" 
                variant="warning" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleListEdit(list);
                }}
                disabled={!isOwner(list.role)}
              >
                Edit
              </Button>
              <Button 
                className="w-50" 
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleListDelete(list.id, list.name);
                }} 
                disabled={!isOwner(list.role)}
              >
                Delete
              </Button>
            </div>
            <Badge 
              bg={list.other_users.length > 0 ? "success" : "primary"}
              className="position-absolute top-0 start-0 m-2"
            >
              {list.other_users.length > 0 ? "Shared" : "Private"}
            </Badge>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default DashboardListGrid;