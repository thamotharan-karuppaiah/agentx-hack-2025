
pip install -r requirement.txt
uvicorn app.main:app --reload



Spin up the postgres

Create Database workflow_db;


-- Create workflow_executions table
CREATE TABLE workflow_executions (
    id BIGINT PRIMARY KEY,
    apps_execution_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    raw_execution_json JSONB,
    status VARCHAR(50) DEFAULT 'RUNNING' NOT NULL,
    thread_id VARCHAR
);

-- Create workflow_execution_steps table
CREATE TABLE workflow_execution_steps (
    step_id BIGINT PRIMARY KEY,
    execution_id BIGINT NOT NULL,
    step_name VARCHAR,
    error_message TEXT,
    input_data TEXT,
    output_data TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    finished BOOLEAN DEFAULT FALSE,
    credits_used INTEGER,
    logs JSONB,
    traces JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_workflow_executions_apps_execution_id ON workflow_executions(apps_execution_id);
CREATE INDEX idx_workflow_execution_steps_execution_id ON workflow_execution_steps(execution_id);



Run the Application : 
uvicorn app.main:app --reload --port 8080