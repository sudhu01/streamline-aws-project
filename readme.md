# Streamline - Workflow Automation System

<div align="center">

![Streamline Logo](https://img.shields.io/badge/Streamline-Workflow%20Automation-6576f3?style=for-the-badge)

**A powerful, no-code workflow automation platform built with modern technologies**

[Features](#-features) • [Quick Start](#-quick-start) • [Usage Guides](#-usage-guides) • [AWS Deployment](#-aws-deployment) • [Architecture](#-architecture)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Usage Guides](#-usage-guides)
  - [Creating & Managing Workflows](#creating--managing-workflows)
  - [Adding & Managing Integrations](#adding--managing-integrations)
  - [Checking Execution Logs](#checking-execution-logs)
- [AWS Deployment](#-aws-deployment)
- [Environment Variables](#-environment-variables)
- [Development](#-development)
- [Contributing](#-contributing)

---

## 🎯 Overview

Streamline is a comprehensive no-code workflow automation platform that enables users to create, manage, and monitor automated workflows through an intuitive visual interface. Built with a modern tech stack, Streamline provides enterprise-grade features including secure authentication, integration management, and detailed execution logging.

### Key Capabilities

- **Visual Workflow Builder**: Drag-and-drop interface powered by React Flow
- **Multiple Trigger Types**: Schedule, Webhook, and Manual triggers
- **Rich Integration Ecosystem**: Connect with popular services (Slack, GitHub, Stripe, etc.)
- **Comprehensive Logging**: Detailed execution history with step-by-step debugging
- **Secure Credential Management**: AES-256 encryption for API keys and sensitive data
- **Real-time Monitoring**: Dashboard with live statistics and execution tracking

---

## ✨ Features

### 🔐 Authentication & Security
- **Clerk Authentication**: Secure user authentication and session management
- **Protected Routes**: Route-level authentication with automatic redirects
- **API Key Encryption**: AES-256 encryption for stored credentials
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Helmet Security**: HTTP header security best practices

### 📊 Dashboard
- **Real-time Statistics**: Total workflows, active workflows, execution counts, success rates
- **Recent Activity**: Quick access to recent workflows and executions
- **Quick Actions**: One-click access to common operations
- **Auto-refresh**: Live updates for execution status

### 🔄 Workflow Management
- **Visual Canvas**: Intuitive drag-and-drop workflow builder
- **Multiple Node Types**: Triggers, Actions, Conditions, Integrations
- **Connection Validation**: Prevents invalid workflow configurations
- **Workflow Templates**: Save and duplicate workflows
- **Status Management**: Activate/deactivate workflows with one click
- **Inline Editing**: Quick edits without leaving the list view

### 🔌 Integration System
- **Pre-built Integrations**: 
  - HTTP/REST API
  - Webhook
  - Email (SMTP)
  - Slack
  - Google Sheets
  - GitHub
  - Stripe
  - Twilio
  - SendGrid
- **OAuth 2.0 Support**: Secure OAuth flow for third-party services
- **API Key Management**: Store, rotate, and manage API credentials
- **Connection Testing**: Verify integrations before use
- **Dynamic Forms**: Configuration forms adapt to integration type

### 📝 Execution Logging
- **Detailed History**: Complete execution logs with timestamps
- **Step-by-step Timeline**: Visual representation of workflow execution
- **Input/Output Capture**: Full data capture for debugging
- **Error Tracking**: Comprehensive error logging with stack traces
- **Performance Metrics**: Execution duration and success rate tracking
- **Export Capabilities**: CSV and JSON export options
- **Advanced Filtering**: Filter by workflow, status, date range, and more

### 🎨 User Interface
- **Dark Theme**: Modern dark theme with smooth transitions
- **Responsive Design**: Mobile, tablet, and desktop support
- **Accessible Components**: WCAG-compliant UI components
- **Loading States**: Skeleton screens and progress indicators
- **Error Boundaries**: Graceful error handling and recovery

---

## 🛠 Tech Stack

### Frontend
- **React 19+**: Modern React with TypeScript
- **Vite**: Lightning-fast build tool and dev server
- **React Router v6**: Client-side routing
- **Tailwind CSS v4**: Utility-first CSS framework
- **React Flow**: Visual workflow canvas
- **React Query**: Data fetching and caching
- **Axios**: HTTP client with interceptors
- **Lucide React**: Beautiful icon library
- **Clerk React**: Authentication SDK

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **TypeScript**: Type-safe JavaScript
- **Prisma ORM**: Database toolkit
- **PostgreSQL**: Relational database
- **Clerk Express**: Authentication middleware
- **Winston**: Logging library
- **Svix**: Webhook verification

### DevOps & Infrastructure
- **pnpm**: Fast, disk-efficient package manager
- **Monorepo**: Workspace-based project structure
- **TypeScript**: End-to-end type safety

---

## 🏗 Architecture

### Project Structure

```
streamline/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── dashboard/  # Dashboard widgets
│   │   │   ├── workflows/  # Workflow editor components
│   │   │   ├── integrations/ # Integration management
│   │   │   ├── logs/       # Execution logs viewer
│   │   │   └── shared/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # Global styles and themes
│   └── package.json
│
├── server/                 # Express backend application
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── package.json
│
└── database/               # Database configuration
    └── prisma/
        └── schema.prisma   # Database schema
```

### Data Flow

```
User Interaction
    ↓
React Component
    ↓
API Service (Axios)
    ↓
Express Middleware (Auth, CORS, Rate Limit)
    ↓
Route Handler
    ↓
Service Layer
    ↓
Prisma ORM
    ↓
PostgreSQL Database
```

### Security Layers

1. **Authentication**: Clerk handles user authentication
2. **Authorization**: Express middleware validates tokens
3. **Encryption**: AES-256 for sensitive data storage
4. **Rate Limiting**: Prevents API abuse
5. **Input Validation**: Server-side validation for all inputs
6. **SQL Injection Protection**: Prisma parameterized queries

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18+ 
- **pnpm**: Latest version (`npm install -g pnpm`)
- **PostgreSQL**: v14+ (local or cloud instance)
- **Clerk Account**: For authentication ([clerk.com](https://clerk.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd streamline
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create `.env` files in both `client/` and `server/` directories:
   
   **`server/.env`**:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/streamline"
   CLERK_SECRET_KEY="sk_test_..."
   CLERK_WEBHOOK_SECRET="whsec_..."
   PORT=4000
   ENCRYPTION_KEY="your-32-character-encryption-key-here"
   CLIENT_URL="http://localhost:5173"
   ```
   
   **`client/.env`**:
   ```env
   VITE_API_BASE_URL="http://localhost:4000"
   VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
   ```

4. **Set up the database**
   ```bash
   cd server
   pnpm prisma:generate
   pnpm prisma:migrate
   ```

5. **Start development servers**
   
   Terminal 1 (Server):
   ```bash
   cd server
   pnpm dev
   ```
   
   Terminal 2 (Client):
   ```bash
   cd client
   pnpm dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - API Health Check: http://localhost:4000/api/health

### Setting Up Clerk Webhooks (Development)

1. **Install ngrok** (for local webhook testing)
   ```bash
   cd server
   pnpm add -D ngrok
   ```

2. **Start ngrok tunnel**
   ```bash
   cd server
   pnpm ngrok
   # Or manually: npx ngrok http 4000
   ```

3. **Configure Clerk Webhook**
   - Go to Clerk Dashboard → Webhooks
   - Add endpoint: `https://your-ngrok-url.ngrok.io/api/auth/webhook`
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`
   - Copy webhook secret to `server/.env` as `CLERK_WEBHOOK_SECRET`

---

## 📖 Usage Guides

### Creating & Managing Workflows

#### Creating a New Workflow

1. **Navigate to Workflows**
   - Click "Workflows" in the navigation bar
   - Or use the "Create New Workflow" button from the dashboard

2. **Create Workflow**
   - Click the "+ Create Workflow" button
   - Enter a name for your workflow (e.g., "Daily Report Generator")
   - Optionally add a description

3. **Workflow Editor Interface**
   
   The editor consists of three main sections:
   
   **Left Sidebar - Trigger & Actions Library**
   - Browse available triggers and actions
   - Search by name or category
   - Drag items onto the canvas
   
   **Center Canvas - Visual Builder**
   - Drag and drop nodes to create your workflow
   - Connect nodes by dragging from output handles to input handles
   - Use zoom controls (mouse wheel or buttons)
   - Pan by holding spacebar and dragging
   
   **Right Sidebar - Node Configuration**
   - Select any node to configure its settings
   - Form fields adapt based on node type
   - Test individual nodes before saving

4. **Adding a Trigger**
   - Drag a trigger type from the library (Schedule, Webhook, or Manual)
   - Click the trigger node to configure it:
     - **Schedule**: Set cron expression or pick from presets
     - **Webhook**: Generate unique webhook URL
     - **Manual**: Add "Run" button in the UI

5. **Adding Actions**
   - Drag action nodes onto the canvas
   - Connect them to the trigger or previous actions
   - Configure each action:
     - **HTTP Request**: Set method, URL, headers, body
     - **Send Email**: Configure SMTP settings and template
     - **Transform Data**: Write JavaScript transformation code
     - **Condition**: Set if/else logic branches
     - **Integration**: Select connected integration

6. **Saving Your Workflow**
   - Click "Save" in the top toolbar
   - The workflow auto-saves every 30 seconds
   - Unsaved changes show a warning icon

#### Managing Workflows

**From the Workflows List Page:**

- **Search**: Use the search bar to find workflows by name
- **Filter**: Filter by status (All, Active, Inactive)
- **Sort**: Sort by Name, Created Date, Last Modified, or Last Run
- **View Toggle**: Switch between Grid and List view

**Workflow Actions:**

- **Edit**: Click "Edit" or the workflow name to open the editor
- **Duplicate**: Use the actions menu to duplicate a workflow
- **Toggle Status**: Activate/deactivate a workflow
- **Delete**: Remove a workflow (with confirmation)
- **View Logs**: See all executions for this workflow

**Bulk Actions:**

- Select multiple workflows using checkboxes
- Activate/Deactivate all selected
- Delete multiple workflows at once

#### Workflow Best Practices

- **Naming**: Use descriptive names (e.g., "Send Daily Sales Report")
- **Documentation**: Add descriptions explaining the workflow's purpose
- **Testing**: Use "Test Workflow" before activating
- **Incremental Building**: Start with a simple workflow, then add complexity
- **Error Handling**: Add error handling nodes for critical paths
- **Versioning**: Duplicate before making major changes

---

### Adding & Managing Integrations

#### Available Integrations

Streamline supports the following integrations out of the box:

- **HTTP/REST API**: Make custom HTTP requests to any API
- **Webhook**: Receive webhooks from external services
- **Email (SMTP)**: Send emails via SMTP servers
- **Slack**: Send messages, create channels, get users
- **Google Sheets**: Read/write spreadsheet data
- **GitHub**: Create issues, manage repositories, webhooks
- **Stripe**: Process payments, manage customers
- **Twilio**: Send SMS, make phone calls
- **SendGrid**: Transactional email delivery

#### Adding an Integration

1. **Navigate to Integrations**
   - Click "Integrations" in the navigation bar

2. **Browse Available Integrations**
   - View all integrations in the "Available" tab
   - See categories: Communication, Storage, Productivity, Custom
   - Click "Connect" on any integration

3. **Configure Integration**
   
   The configuration modal adapts based on integration type:
   
   **For API Key Authentication:**
   - Enter integration name
   - Provide API key
   - Set API base URL (if required)
   - Add custom headers (optional)
   
   **For OAuth (Slack, GitHub, etc.):**
   - Enter integration name
   - Click "Authorize with [Service]"
   - Complete OAuth flow in popup
   - Integration auto-configures after authorization
   
   **For SMTP (Email):**
   - Enter SMTP host, port
   - Provide username and password
   - Enable TLS/SSL if required
   
   **For Webhook:**
   - Enter webhook URL
   - Select HTTP method
   - Configure headers and authentication

4. **Test Connection**
   - Click "Test Connection" before saving
   - Review request/response details
   - Ensure connection succeeds

5. **Save Integration**
   - Click "Save" to store the integration
   - Credentials are encrypted automatically
   - Integration appears in "Connected" tab

#### Managing Connected Integrations

**From the Connected Tab:**

- **View Status**: See Active/Error indicators
- **Last Used**: Check when integration was last used
- **Test Connection**: Re-verify integration works
- **Edit**: Update configuration or credentials
- **Disconnect**: Remove integration (with confirmation)

**API Key Management:**

- **View Keys**: See masked API keys (shows last 4 characters)
- **Rotate Keys**: Generate new keys and revoke old ones
- **Delete Keys**: Remove unused API keys
- **Security Notice**: All keys are encrypted with AES-256

#### Integration Best Practices

- **Naming**: Use descriptive names (e.g., "Production Slack Workspace")
- **Security**: Rotate API keys regularly
- **Testing**: Test connections after any configuration changes
- **Monitoring**: Check "Last Used" to identify unused integrations
- **Documentation**: Note which workflows use each integration

---

### Checking Execution Logs

#### Viewing Execution Logs

1. **Navigate to Logs**
   - Click "Logs" in the navigation bar
   - Or use "View All Logs" from the dashboard

2. **Understanding the Logs Table**
   
   The table shows:
   - **Status**: Success (green), Failed (red), Running (blue), Cancelled (gray)
   - **Workflow Name**: Clickable link to workflow editor
   - **Trigger Type**: How the workflow was triggered
   - **Started At**: Timestamp with relative time (e.g., "2 hours ago")
   - **Duration**: Execution time in mm:ss format
   - **Actions**: "View Details" button

3. **Filtering Logs**
   
   Use the filter bar:
   - **Search**: Search by workflow name
   - **Status Filter**: Filter by Success, Failed, Running, or All
   - **Date Range**: Select Today, Last 7 days, Last 30 days, or Custom range
   - **Workflow**: Filter by specific workflow
   - **Clear Filters**: Reset all filters

4. **Sorting**
   - Click column headers to sort
   - Default sort: Most recent first
   - Sortable columns: Status, Workflow, Started At, Duration

#### Viewing Execution Details

1. **Open Execution Details**
   - Click "View Details" on any execution
   - Or click the row to expand details

2. **Execution Overview Tab**
   - **Header**: Workflow name, execution ID, status badge
   - **Timestamps**: Started and finished times
   - **Duration**: Total execution time
   - **Summary Statistics**: Success rate, steps completed

3. **Execution Timeline Tab**
   
   Visual timeline showing:
   - **Each Node Step**: Node name, type, icon
   - **Status Indicators**: ✓ Success, ✗ Failed, ⏱ Running, ⊘ Skipped
   - **Duration**: Per-step execution time
   - **Expandable Details**: Click to see input/output data
   - **Error Messages**: Red-highlighted failed steps with error details

4. **Input/Output Tab**
   - **Input Data**: JSON viewer showing workflow input
   - **Output Data**: Final workflow output
   - **Data Viewer Features**:
     - Syntax highlighting
     - Collapsible nested objects
     - Copy to clipboard
     - Search within JSON
     - Raw/Formatted toggle

5. **Logs Tab**
   - **Text Logs**: Console output from execution
   - **Step-by-step Logs**: Detailed logs for each node
   - **Error Stack Traces**: Full error information

6. **Performance Tab**
   - **Execution Time Breakdown**: Chart showing time per step
   - **Bottleneck Identification**: Slowest steps highlighted
   - **Performance Metrics**: Average, min, max durations

#### Execution Actions

**From Execution Details:**

- **Retry Failed Execution**: 
  - Click "Retry" button (only for failed executions)
  - Choose to use same input or edit input data
  - New execution starts immediately
  
- **Download Execution Data**:
  - Export execution data as JSON
  - Includes all steps, inputs, outputs, errors
  
- **View Workflow**:
  - Navigate to workflow editor
  - Pre-selects the executed workflow

#### Exporting Logs

1. **Export Options**
   - Click "Export" in the logs page header
   - Choose CSV or JSON format
   - Exports up to 1000 most recent logs

2. **CSV Export**
   - Includes: ID, Workflow, Status, Started At, Finished At, Duration
   - Compatible with Excel and Google Sheets

3. **JSON Export**
   - Full execution data including steps
   - Suitable for programmatic analysis

#### Auto-Refresh

- **Enable Auto-Refresh**: Toggle in the logs page header
- **Refresh Interval**: Updates every 10 seconds
- **Real-time Updates**: See new executions as they complete
- **Manual Refresh**: Click refresh button anytime

#### Log Statistics

**View on Dashboard:**
- Total executions today
- Success rate percentage
- Average execution time
- Failed executions count

**View on Logs Page:**
- Summary statistics card
- Success rate with circular progress
- Trends over time

---
