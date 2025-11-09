import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';

/**
 * A component that displays a single notification entry with optional actions and styling.
 *
 * This component renders a notification item that can include text, an icon, action buttons
 * (e.g., Confirm/Dismiss), and a delete option. Unread notifications are visually highlighted.
 *
 * Intended for use inside a notification list or dropdown, where it can be customized
 * depending on the type of notification (e.g., informational, actionable, alert).
 *
 * @component
 * @param {Object} props
 * @param {string} props.text - The main notification message to display.
 * @param {boolean} props.isUnread - Whether the notification is unread.  
 *   If true, the text appears in bold to visually distinguish it.
 * @param {React.ReactNode} [props.icon=null] - Optional icon element displayed to the left of the text.
 * @param {boolean} [props.requiresAction=false] - Whether this notification requires user action.  
 *   If true, confirm/dismiss buttons are shown.
 * @param {Function} [props.onConfirm=null] - Callback fired when the Confirm button is clicked.  
 *   Only applies if `requiresAction` is true.
 * @param {Function} [props.onDismiss=null] - Callback fired when the Dismiss button is clicked.  
 *   Only applies if `requiresAction` is true.
 * @param {Function} [props.onDelete=null] - Callback fired when the delete icon is clicked.
 *
 * @example
 * <Notification
 *   text="John shared a new list with you!"
 *   isUnread={true}
 *   icon={<i className="bi bi-bell-fill text-primary"></i>}
 *   requiresAction={true}
 *   onConfirm={() => console.log("Confirmed")}
 *   onDismiss={() => console.log("Dismissed")}
 *   onDelete={() => console.log("Deleted")}
 * />
 */
function Notification({ text, isUnread, icon = null, requiresAction = false, onConfirm = null, onDismiss = null, onDelete = null }) {

  /* TODO: DISPLAY DATE OF WHEN NOTIF WAS CREATED */

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