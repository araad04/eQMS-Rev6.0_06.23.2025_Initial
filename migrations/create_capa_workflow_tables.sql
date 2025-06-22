-- Create CAPA workflow state enum type
CREATE TYPE capa_workflow_state AS ENUM (
  'CORRECTION',
  'ROOT_CAUSE_ANALYSIS',
  'CORRECTIVE_ACTION',
  'EFFECTIVENESS_VERIFICATION'
);

-- Create CAPA workflows table
CREATE TABLE IF NOT EXISTS capa_workflows (
  id SERIAL PRIMARY KEY,
  capa_id INTEGER NOT NULL REFERENCES capas(id),
  current_state capa_workflow_state NOT NULL DEFAULT 'CORRECTION',
  assigned_to INTEGER REFERENCES users(id),
  due_date TIMESTAMP,
  transition_date TIMESTAMP,
  transitioned_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create CAPA workflow history table
CREATE TABLE IF NOT EXISTS capa_workflow_history (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES capa_workflows(id),
  from_state capa_workflow_state,
  to_state capa_workflow_state NOT NULL,
  transition_date TIMESTAMP NOT NULL DEFAULT NOW(),
  transitioned_by INTEGER NOT NULL REFERENCES users(id),
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create CAPA corrections table
CREATE TABLE IF NOT EXISTS capa_corrections (
  id SERIAL PRIMARY KEY,
  capa_id INTEGER NOT NULL REFERENCES capas(id),
  description TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  implemented_by INTEGER NOT NULL REFERENCES users(id),
  implementation_date TIMESTAMP NOT NULL,
  evidence TEXT,
  containment_type TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);