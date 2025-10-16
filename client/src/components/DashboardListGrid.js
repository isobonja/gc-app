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

function DashboardListGrid({ lists, handleListClick, handleListDelete, onSort }) {

  return (
    <Row className="g-4">
      {lists.map((list) => (
        <Col key={list.id} xs={12} sm={6} md={4} lg={3}>
          <Card
            onClick={() => handleListClick(list.id)}
            className="h-100 bg-dark shadow-lg border-0 p-3 position-relative d-flex flex-column"
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
            <div className="mt-auto d-flex justify-content-between align-items-center">
              <Button 
                className="w-100" 
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleListDelete(list.id, list.name);
                }} 
                disabled={!isOwner(list.role)}
              >
                Delete
              </Button>
              <Badge 
                bg={list.other_users.length > 0 ? "success" : "primary"}
                className="position-absolute top-0 start-0 m-2"
              >
                {list.other_users.length > 0 ? "Shared" : "Private"}
              </Badge>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default DashboardListGrid;