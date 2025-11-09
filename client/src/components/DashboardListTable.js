import React from "react";

import '../dashboard.css';

import { 
  OverlayTrigger, 
  Table, 
  Tooltip,
  Badge,
  Button,
} from "react-bootstrap";

import { capitalize, formatListUserDisplay } from "../util/utils";
import { DASHBOARD_TABLE_HEADERS, isOwner } from "../constants/constants";
import { useTheme } from "../context/ThemeContext";

/**
 * Displays a responsive, sortable table of grocery lists on the dashboard.
 *
 * Each row represents a grocery list and includes its name, sharing type, user role,
 * last updated date, and available actions (edit/delete). The table supports both
 * light and dark themes via the `useTheme` context.
 *
 * Shared lists display a tooltip listing other users the list is shared with.
 * Clicking on a row (outside the action buttons) triggers a navigation or detail view.
 *
 * @component
 * @param {Object} props
 * @param {Array<Object>} props.lists - Array of grocery list objects to display.
 * @param {number} props.lists[].id - Unique identifier of the grocery list.
 * @param {string} props.lists[].name - Name of the grocery list.
 * @param {string} props.lists[].role - Current user’s role in the list (e.g., `"Owner"`, `"Editor"`, `"Viewer"`).
 * @param {string} props.lists[].last_updated - ISO string or formatted date of last update.
 * @param {Array<Object>} props.lists[].other_users - List of other users the grocery list is shared with.
 * @param {string} props.lists[].other_users[].username - The username of a shared user.
 * @param {Function} props.handleListClick - Callback triggered when a table row is clicked.
 *   Receives the list’s `id` as an argument.
 * @param {Function} props.handleListEdit - Callback triggered when the Edit button is clicked.
 *   Receives the entire list object as an argument.
 * @param {Function} props.handleListDelete - Callback triggered when the Delete button is clicked.
 *   Receives the list’s `id` as an argument.
 * @param {Function} props.onSort - Callback triggered when a column header is clicked for sorting.
 *
 * @example
 * const lists = [
 *   {
 *     id: 1,
 *     name: "Weekly Groceries",
 *     role: "Owner",
 *     last_updated: "2025-10-08 14:30",
 *     other_users: [{ username: "Alice" }, { username: "Bob" }]
 *   },
 *   {
 *     id: 2,
 *     name: "Camping Supplies",
 *     role: "Viewer",
 *     last_updated: "2025-10-07 09:15",
 *     other_users: []
 *   }
 * ];
 *
 * <DashboardListTable
 *   lists={lists}
 *   handleListClick={(id) => console.log("Clicked list", id)}
 *   handleListEdit={(list) => console.log("Editing", list.name)}
 *   handleListDelete={(id) => console.log("Deleting list", id)}
 *   onSort={(column) => console.log("Sorting by", column)}
 * />
 */
function DashboardListTable({ lists, handleListClick, handleListEdit, handleListDelete, onSort}) {

  const { theme } = useTheme();

  return (
    <Table 
      bordered 
      hover 
      striped 
      variant={theme === "light" ? "secondary" : "dark"} 
      style={{ overflow: 'visible' }}
    >
      <colgroup>
        <col style={{ width: '20%' }} /> {/* List name */}
        <col style={{ width: '5%' }} /> {/* Type */}
        <col style={{ width: '5%' }} /> {/* Role */}
        <col style={{ width: '35%' }} /> {/* Last updated */}
        <col style={{ width: '25%' }} /> {/* Actions */}
      </colgroup>
      <thead 
        className={theme === "light" ? "table-primary" : "table-dark"} 
      >
        <tr>
          {DASHBOARD_TABLE_HEADERS.map((key) => (
            <th 
              key={key} 
              onClick={() => onSort(key)} 
              style={{ cursor: 'pointer' }}
            >
              {capitalize(key)}
            </th>
          ))}
          <th>Actions</th> {/* Edit (edit name and users) and Delete */}
        </tr>
      </thead>
      <tbody>
        {lists.map((list, idx) => (
          <tr 
            key={list.id || idx} 
            onClick={(e) => handleListClick(list.id)} 
            className="align-middle" 
            style={{ cursor: 'pointer' }}
          >
            {/* List Name */}
            <td>{list.name}</td>

            {/* List Type (Private or Shared) */}
            <td className="d-flex justify-content-center align-items-center position-relative">
              <div className="d-inline-block position-relative" style={{ overflow: "visible" }}>
                {list.other_users.length > 0 ? (
                  <OverlayTrigger
                    placement="right"
                    container={document.body}
                    popperConfig={{
                      strategy: "fixed",
                      modifiers: [{ name: "preventOverflow", options: { boundary: "viewport" } }],
                    }}
                    overlay={
                      <Tooltip id={`tooltip-${list.id}`}>
                        <i>{formatListUserDisplay(list.other_users)}</i>
                      </Tooltip>
                    }
                  >
                    <Badge
                      bg="success"
                      className="m-2"
                      style={{ cursor: "pointer" }}
                    >
                      Shared
                    </Badge>
                  </OverlayTrigger>
                ) : (
                  <Badge
                    bg="primary"
                    className="m-2"
                  >
                    Private
                  </Badge>
                )}
              </div>
            </td>

            {/* User Role for List */}
            <td>{list.role}</td>

            {/* Last Modified Date/Time */}
            <td>{list.last_updated}</td>

            {/* Actions */}
            <td className="" onClick={(e) => e.stopPropagation()}>
              <div className="d-flex flex-row gap-2">
                <Button
                  variant="warning"
                  size="sm"
                  className="flex-fill"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleListEdit(list);
                  }}
                  disabled={!isOwner(list.role)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-fill"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleListDelete(list.id);
                  }} 
                  disabled={!isOwner(list.role)}
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

export default DashboardListTable;