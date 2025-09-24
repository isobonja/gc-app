import { Container, Spinner } from 'react-bootstrap';

function CenterSpinner({ height = '100vh' }) {

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: height }}>
      <Spinner animation="border" role="status"></Spinner>
    </Container>
  );
}

export default CenterSpinner;