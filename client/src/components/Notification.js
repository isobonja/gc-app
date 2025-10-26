import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';

function Notification({ text, isUnread, icon = null, requiresAction = false, onConfirm = null, onDismiss = null, onDelete = null }) {

  /*
  DISPLAY DATE OF WHEN NOTIF WAS CREATED


  */


  return (
    <Container className="m-0 py-2 border-top" onClick={(e) => e.stopPropagation()}>
      <Row className="align-items-center">
        <Col xs="auto" className="pe-0">
          {icon && <span className="me-2">{icon}</span>}
        </Col>
        <Col>
          <Row>
            <Col>
              <span style={{ fontWeight: isUnread ? 'bold' : 'normal' }}>{text}</span>
            </Col>
            <Col xs='auto'>
              <i 
                className="bi bi-trash-fill text-danger fs-6"
                onClick={onDelete}
              ></i>
            </Col>
          </Row>
        </Col>
      </Row>
      {requiresAction && (
        <Row className="">
          <Col xs={6} className="mt-2">
            {onConfirm && <Button className="w-100 btn btn-sm btn-primary" onClick={onConfirm}>Confirm</Button>}
          </Col>
          <Col xs={6} className="mt-2">
            {onDismiss && <Button className="w-100 btn btn-sm btn-secondary" onClick={onDismiss}>Dismiss</Button>}
          </Col>
        </Row>
      )}
      
    </Container>
  );
}

export default Notification;