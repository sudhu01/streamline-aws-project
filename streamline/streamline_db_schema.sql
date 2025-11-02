-- Streamline Workflow Automation System - Database Schema
-- PostgreSQL Database Schema with all entities, relationships, and indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- WORKFLOWS TABLE
-- ============================================================================
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    trigger_type VARCHAR(50) NOT NULL, -- 'schedule', 'webhook', 'manual'
    trigger_config JSONB, -- Stores trigger-specific configuration
    nodes JSONB NOT NULL DEFAULT '[]', -- Array of React Flow nodes
    edges JSONB NOT NULL DEFAULT '[]', -- Array of React Flow edges
    version INTEGER DEFAULT 1,
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_run_status VARCHAR(20), -- 'success', 'failed', 'running'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for workflows
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_is_active ON workflows(is_active);
CREATE INDEX idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX idx_workflows_last_run_at ON workflows(last_run_at DESC);
CREATE INDEX idx_workflows_updated_at ON workflows(updated_at DESC);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);
CREATE INDEX idx_workflows_user_active ON workflows(user_id, is_active);

-- ============================================================================
-- WORKFLOW_NODES TABLE (Optional normalized structure)
-- ============================================================================
CREATE TABLE workflow_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL, -- Unique within workflow
    node_type VARCHAR(50) NOT NULL, -- 'trigger', 'action', 'condition', 'integration'
    node_config JSONB NOT NULL DEFAULT '{}',
    position_x DECIMAL(10, 2),
    position_y DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_id, node_id)
);

-- Indexes for workflow_nodes
CREATE INDEX idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX idx_workflow_nodes_type ON workflow_nodes(node_type);

-- ============================================================================
-- INTEGRATIONS TABLE
-- ============================================================================
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL, -- 'slack', 'email', 'http', 'github', etc.
    name VARCHAR(255) NOT NULL, -- User-defined name
    config JSONB NOT NULL DEFAULT '{}', -- Encrypted credentials and configuration
    is_active BOOLEAN DEFAULT true,
    auth_type VARCHAR(50) NOT NULL, -- 'api_key', 'oauth', 'basic_auth', 'custom'
    last_used_at TIMESTAMP WITH TIME ZONE,
    connection_status VARCHAR(20) DEFAULT 'active', -- 'active', 'error', 'expired'
    last_test_at TIMESTAMP WITH TIME ZONE,
    last_test_status VARCHAR(20), -- 'success', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for integrations
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_type ON integrations(integration_type);
CREATE INDEX idx_integrations_is_active ON integrations(is_active);
CREATE INDEX idx_integrations_user_type ON integrations(user_id, integration_type);
CREATE INDEX idx_integrations_last_used ON integrations(last_used_at DESC);

-- ============================================================================
-- INTEGRATION_TYPES TABLE (Reference/Catalog)
-- ============================================================================
CREATE TABLE integration_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_code VARCHAR(50) UNIQUE NOT NULL, -- 'slack', 'github', etc.
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    logo_url TEXT,
    auth_type VARCHAR(50) NOT NULL,
    config_schema JSONB NOT NULL DEFAULT '{}', -- JSON schema for configuration
    category VARCHAR(50), -- 'communication', 'storage', 'productivity', 'custom'
    is_available BOOLEAN DEFAULT true,
    oauth_config JSONB, -- OAuth specific configuration
    documentation_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for integration_types
CREATE INDEX idx_integration_types_category ON integration_types(category);
CREATE INDEX idx_integration_types_available ON integration_types(is_available);

-- ============================================================================
-- API_KEYS TABLE
-- ============================================================================
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    key_value TEXT NOT NULL, -- Encrypted API key
    key_hash VARCHAR(255) NOT NULL, -- Hash for quick lookup
    masked_value VARCHAR(50), -- Last 4 chars visible: 'sk_***...1234'
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for api_keys
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_integration_id ON api_keys(integration_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- ============================================================================
-- EXECUTION_LOGS TABLE
-- ============================================================================
CREATE TABLE execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    execution_id VARCHAR(100) UNIQUE NOT NULL, -- Unique execution identifier
    status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'running', 'cancelled', 'timeout'
    trigger_type VARCHAR(50) NOT NULL,
    trigger_data JSONB, -- Data that triggered the workflow
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER, -- Duration in milliseconds
    error_message TEXT,
    error_stack TEXT,
    input_data JSONB, -- Complete input data
    output_data JSONB, -- Complete output data
    metadata JSONB DEFAULT '{}', -- Additional execution metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for execution_logs
CREATE INDEX idx_execution_logs_workflow_id ON execution_logs(workflow_id);
CREATE INDEX idx_execution_logs_user_id ON execution_logs(user_id);
CREATE INDEX idx_execution_logs_execution_id ON execution_logs(execution_id);
CREATE INDEX idx_execution_logs_status ON execution_logs(status);
CREATE INDEX idx_execution_logs_started_at ON execution_logs(started_at DESC);
CREATE INDEX idx_execution_logs_workflow_status ON execution_logs(workflow_id, status);
CREATE INDEX idx_execution_logs_user_started ON execution_logs(user_id, started_at DESC);
CREATE INDEX idx_execution_logs_status_started ON execution_logs(status, started_at DESC);

-- ============================================================================
-- EXECUTION_STEPS TABLE
-- ============================================================================
CREATE TABLE execution_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_log_id UUID NOT NULL REFERENCES execution_logs(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    node_id VARCHAR(100) NOT NULL,
    node_name VARCHAR(255),
    node_type VARCHAR(50) NOT NULL, -- 'trigger', 'action', 'condition', 'integration'
    status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'skipped', 'running'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    error_stack TEXT,
    retry_count INTEGER DEFAULT 0,
    logs TEXT, -- Text logs from step execution
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for execution_steps
CREATE INDEX idx_execution_steps_log_id ON execution_steps(execution_log_id);
CREATE INDEX idx_execution_steps_status ON execution_steps(status);
CREATE INDEX idx_execution_steps_log_step ON execution_steps(execution_log_id, step_number);

-- ============================================================================
-- WEBHOOKS TABLE
-- ============================================================================
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    webhook_url VARCHAR(500) UNIQUE NOT NULL,
    webhook_token VARCHAR(255) UNIQUE NOT NULL, -- Secret token for validation
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for webhooks
CREATE INDEX idx_webhooks_workflow_id ON webhooks(workflow_id);
CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_token ON webhooks(webhook_token);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);

-- ============================================================================
-- SCHEDULES TABLE
-- ============================================================================
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cron_expression VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for schedules
CREATE INDEX idx_schedules_workflow_id ON schedules(workflow_id);
CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_schedules_next_run ON schedules(next_run_at) WHERE is_active = true;
CREATE INDEX idx_schedules_is_active ON schedules(is_active);

-- ============================================================================
-- OAUTH_TOKENS TABLE
-- ============================================================================
CREATE TABLE oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL, -- Encrypted
    refresh_token TEXT, -- Encrypted
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for oauth_tokens
CREATE INDEX idx_oauth_tokens_integration_id ON oauth_tokens(integration_id);
CREATE INDEX idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'workflow', 'integration', 'execution', etc.
    entity_id UUID,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'execute', etc.
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================================
-- WORKFLOW_USAGE_STATS TABLE (For dashboard statistics)
-- ============================================================================
CREATE TABLE workflow_usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    total_duration_ms BIGINT DEFAULT 0,
    avg_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, workflow_id, date)
);

-- Indexes for workflow_usage_stats
CREATE INDEX idx_usage_stats_user_date ON workflow_usage_stats(user_id, date DESC);
CREATE INDEX idx_usage_stats_workflow_date ON workflow_usage_stats(workflow_id, date DESC);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'workflow_failed', 'integration_error', 'system', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT,
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
    is_read BOOLEAN DEFAULT false,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- WORKFLOW_TAGS TABLE
-- ============================================================================
CREATE TABLE workflow_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_id, tag)
);

-- Indexes for workflow_tags
CREATE INDEX idx_workflow_tags_workflow_id ON workflow_tags(workflow_id);
CREATE INDEX idx_workflow_tags_tag ON workflow_tags(tag);

-- ============================================================================
-- WORKFLOW_VERSIONS TABLE (For version control)
-- ============================================================================
CREATE TABLE workflow_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name VARCHAR(255),
    description TEXT,
    nodes JSONB NOT NULL,
    edges JSONB NOT NULL,
    trigger_config JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_id, version_number)
);

-- Indexes for workflow_versions
CREATE INDEX idx_workflow_versions_workflow_id ON workflow_versions(workflow_id);
CREATE INDEX idx_workflow_versions_created_at ON workflow_versions(created_at DESC);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_usage_stats_updated_at BEFORE UPDATE ON workflow_usage_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for workflow summary with execution stats
CREATE OR REPLACE VIEW workflow_summary AS
SELECT 
    w.id,
    w.user_id,
    w.name,
    w.description,
    w.is_active,
    w.trigger_type,
    w.last_run_at,
    w.last_run_status,
    w.created_at,
    w.updated_at,
    COUNT(DISTINCT el.id) as total_executions,
    COUNT(DISTINCT CASE WHEN el.status = 'success' THEN el.id END) as successful_executions,
    COUNT(DISTINCT CASE WHEN el.status = 'failed' THEN el.id END) as failed_executions,
    AVG(el.duration_ms) as avg_duration_ms
FROM workflows w
LEFT JOIN execution_logs el ON w.id = el.workflow_id
GROUP BY w.id;

-- View for user dashboard stats
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT w.id) as total_workflows,
    COUNT(DISTINCT CASE WHEN w.is_active = true THEN w.id END) as active_workflows,
    COUNT(DISTINCT el.id) as total_executions,
    COUNT(DISTINCT CASE WHEN el.status = 'success' THEN el.id END) as successful_executions,
    COUNT(DISTINCT CASE WHEN el.status = 'failed' THEN el.id END) as failed_executions,
    CASE 
        WHEN COUNT(DISTINCT el.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN el.status = 'success' THEN el.id END)::numeric / COUNT(DISTINCT el.id)::numeric) * 100, 2)
        ELSE 0 
    END as success_rate_percentage
FROM users u
LEFT JOIN workflows w ON u.id = w.user_id
LEFT JOIN execution_logs el ON u.id = el.user_id
GROUP BY u.id;

-- ============================================================================
-- INITIAL DATA (Integration Types Catalog)
-- ============================================================================

INSERT INTO integration_types (type_code, display_name, description, auth_type, category, is_available) VALUES
('http', 'HTTP/REST API', 'Make HTTP requests to any REST API endpoint', 'custom', 'custom', true),
('webhook', 'Webhook', 'Receive data from external services via webhooks', 'custom', 'custom', true),
('email', 'Email (SMTP)', 'Send emails using SMTP protocol', 'basic_auth', 'communication', true),
('slack', 'Slack', 'Send messages and interact with Slack workspaces', 'oauth', 'communication', true),
('github', 'GitHub', 'Interact with GitHub repositories and workflows', 'oauth', 'productivity', true),
('google_sheets', 'Google Sheets', 'Read and write data to Google Sheets', 'oauth', 'storage', true),
('stripe', 'Stripe', 'Process payments and manage Stripe data', 'api_key', 'productivity', true),
('twilio', 'Twilio', 'Send SMS and make phone calls', 'api_key', 'communication', true),
('sendgrid', 'SendGrid', 'Send transactional emails via SendGrid', 'api_key', 'communication', true);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'Stores user account information synced from Clerk authentication';
COMMENT ON TABLE workflows IS 'Main workflows table containing workflow definitions and configurations';
COMMENT ON TABLE integrations IS 'User-connected integrations with encrypted credentials';
COMMENT ON TABLE execution_logs IS 'Logs of all workflow executions with status and timing';
COMMENT ON TABLE execution_steps IS 'Detailed step-by-step execution logs for each workflow run';
COMMENT ON TABLE api_keys IS 'Encrypted API keys and credentials storage';
COMMENT ON TABLE webhooks IS 'Webhook endpoints for triggering workflows';
COMMENT ON TABLE schedules IS 'Scheduled workflow triggers with cron expressions';
COMMENT ON TABLE oauth_tokens IS 'OAuth access and refresh tokens for integrations';
COMMENT ON TABLE audit_logs IS 'System audit trail for security and compliance';
COMMENT ON TABLE workflow_usage_stats IS 'Aggregated statistics for dashboard and analytics';
COMMENT ON TABLE notifications IS 'User notifications for workflow events and system alerts';

-- ============================================================================
-- PERFORMANCE OPTIMIZATION NOTES
-- ============================================================================

-- Consider partitioning large tables by date:
-- - execution_logs (by started_at)
-- - execution_steps (by created_at)
-- - audit_logs (by created_at)

-- For production, consider additional indexes based on query patterns:
-- - Composite indexes for frequently joined columns
-- - Partial indexes for status-based queries
-- - GIN indexes on JSONB columns if querying JSON fields frequently

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================