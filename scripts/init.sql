CREATE TABLE IF NOT EXISTS evaluation_annotations (
    email VARCHAR(255),
    dataset_idx INTEGER,
    data JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (email, dataset_idx)
);