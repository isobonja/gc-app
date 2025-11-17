import React, { useEffect, useState } from 'react';
import { Modal, Form, Button, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { makePrettyFilename } from '../util/utils';

function ExportListDataModal({ show, handleClose, items }) {
  const [exportType, setExportType] = useState('txt');
  const [exportData, setExportData] = useState('');

  useEffect(() => {
    setExportData('');
    switch (exportType) {
      case 'txt':
        items.forEach((i) => (
          setExportData(prev => prev + `${i.name} (${i.category}) - ${i.quantity}\n`)
        ));
        break;
      case 'json':
        setExportData(JSON.stringify(items));
        break;
      case 'csv':
        setExportData(() => {
          const csvFields = ["name", "category", "quantity"];
          const csvRows = [
            csvFields,
            ...items.map(item => csvFields.map(f => item[f]))
          ];

          return csvRows.map(r => r.join(",")).join("\n");
        });
        break;
      default:
        setExportData('none');
    }
  }, [exportType]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportData);
    console.log("Data copied!");
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    switch (exportType) {
      case 'txt':
        const txtBlob = new Blob([exportData], { type: "text/plain" });
        const txtUrl = URL.createObjectURL(txtBlob);

        const txtA = document.createElement("a");
        txtA.href = txtUrl;
        txtA.download = makePrettyFilename() + '.txt';
        txtA.click();

        URL.revokeObjectURL(txtUrl);
        break;
      case 'json':
        const jsonBlob = new Blob([exportData], { type: "application/json" });
        const jsonUrl = URL.createObjectURL(jsonBlob);

        const jsonA = document.createElement("a");
        jsonA.href = jsonUrl;
        jsonA.download = makePrettyFilename() + '.json';
        jsonA.click();

        URL.revokeObjectURL(jsonUrl);
        break;
      case 'csv':
        const csvBlob = new Blob([exportData], { type: "text/csv" });
        const csvUrl = URL.createObjectURL(csvBlob);

        const csvA = document.createElement("a");
        csvA.href = csvUrl;
        csvA.download = makePrettyFilename() + '.csv';
        csvA.click();

        URL.revokeObjectURL(csvUrl);
        break;
      default:
        console.log("Illegal!");
    }

    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Export List Data</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form className="p-3" id="exportListDataForm" onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formListName">
            <Form.Label className="pe-3">Export Type:</Form.Label>
            <ToggleButtonGroup 
              type="radio"
              name="export-type-btn-group" 
              value={exportType} 
              onChange={setExportType}
            >
              <ToggleButton id="export-type-txt" value="txt">TXT</ToggleButton>
              <ToggleButton id="export-type-json" value="json">JSON</ToggleButton>
              <ToggleButton id="export-type-csv" value="csv">CSV</ToggleButton>
              <ToggleButton id="export-type-pdf" value="pdf">PDF</ToggleButton>
              <ToggleButton id="export-type-email" value="email">Email</ToggleButton>
            </ToggleButtonGroup>
          </Form.Group>

          {['txt','json','csv'].includes(exportType) && (
            <>
              <Form.Group className="mb-3" controlId="txtExportField">
                <Form.Label>Text export</Form.Label>
                <Form.Control as="textarea" rows={12} value={exportData} readOnly />
              </Form.Group>
            </>
          )}
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="light" type="button" onClick={copyToClipboard}>
          Copy to Clipboard
        </Button>
        <Button variant="primary" type="submit" form="exportListDataForm">
          Export to File
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ExportListDataModal;