import React from "react";

import '../dashboard.css';

import { 
  OverlayTrigger, 
  Table, 
  Tooltip,
  Badge,
  Button,
} from "react-bootstrap";

import { capitalize, convertUTCToLocal, formatListUserDisplay } from "../util/utils";

import { DASHBOARD_TABLE_HEADERS, isOwner } from "../constants/constants";

function DashboardListTable({ lists, handleListClick, handleListEdit, handleListDelete, onSort}) {

  return (
    <Table bordered hover style={{ overflow: 'visible' }}>
      <colgroup>
        <col style={{ width: '20%' }} /> {/* List name */}
        <col style={{ width: '5%' }} /> {/* Type */}
        <col style={{ width: '5%' }} /> {/* Role */}
        <col style={{ width: '35%' }} /> {/* Last updated */}
        <col style={{ width: '25%' }} /> {/* Actions */}
      </colgroup>
      <thead>
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
            style={{ cursor: 'pointer' }}
          >
            {/* List Name */}
            <td>{list.name}</td>

            {/* List Type (Private or Shared) */}
            <td className="position-relative">
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