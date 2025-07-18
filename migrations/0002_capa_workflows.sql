
CREATE TABLE IF NOT EXISTS capa_workflows (
    id SERIAL PRIMARY KEY,
    capa_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    current_step VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (capa_id) REFERENCES capas(id)
);
