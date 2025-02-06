REASSIGN OWNED BY lramar TO postgres;
ALTER TABLE workflow_execution_steps OWNER TO postgres;
ALTER TABLE workflow_execution_streams OWNER TO postgres;
ALTER TABLE workflow_executions OWNER TO postgres; 