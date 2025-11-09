import { Container, Spinner } from 'react-bootstrap';

/**
 * A centered loading spinner component.
 *
 * This component displays a Bootstrap spinner perfectly centered 
 * both vertically and horizontally within a container. The height 
 * of the container can be customized via a prop.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.height='100vh'] - The height of the container (e.g., `'100vh'`, `'50%'`, `'400px'`).
 */
function CenterSpinner({ height = '100vh' }) {

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: height }}>
      <Spinner animation="border" role="status"></Spinner>
    </Container>
  );
}

export default CenterSpinner;