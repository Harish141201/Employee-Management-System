CREATE TABLE IF NOT EXISTS employee_documents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    document_type VARCHAR(30) NOT NULL,
    uploaded_by BIGINT NOT NULL,
    uploaded_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_employee_document_stored_name UNIQUE (stored_file_name),
    CONSTRAINT fk_document_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_document_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
CREATE INDEX idx_employee_documents_employee_uploaded ON employee_documents(employee_id, uploaded_at);
