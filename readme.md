# Checklist Manifesto

A modern task management application built with Meteor v3, React, and the FHIR Task data schema.

## Features

- FHIR-compliant Task data model
- Complete CRUD operations for tasks
- User authentication
- Task filtering and search
- Task notes and history
- Priority-based task organization
- Due date tracking
- Modern Material UI interface

## Getting Started

### Prerequisites

- Node.js (v14+)
- Meteor v3.0
- MongoDB (optional, Meteor comes with built-in MongoDB)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/checklist-manifesto.git
cd checklist-manifesto
```

2. Install dependencies:
```bash
meteor npm install
```

3. Run the application:
```bash
meteor run
```

4. Open your browser and navigate to http://localhost:3000

### Default Login

```
Username: admin
Password: password
```

## Environment Variables

The application follows the 12-factor app methodology and can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SEED_USERNAME` | Default admin username | `admin` |
| `SEED_PASSWORD` | Default admin password | `password` |
| `MAX_TASKS_PER_USER` | Maximum tasks per user | `100` |
| `DUE_SOON_DAYS` | Days threshold for "due soon" | `7` |
| `API_ENABLED` | Enable REST API | `false` |
| `API_AUTH_SECRET` | JWT secret for API auth | `default-secret-change-me` |
| `LOG_LEVEL` | Application logging level | `info` |




## FHIR Compliance

This application implements a simplified version of the [FHIR Task Resource](https://www.hl7.org/fhir/task.html). The schema includes core elements such as:

- `resourceType`: Always "Task"
- `status`: Task status (draft, requested, in-progress, completed, etc.)
- `description`: Task description
- `priority`: Task priority (routine, urgent, asap, stat)
- `authoredOn`: Creation timestamp
- `lastModified`: Last update timestamp
- `requester`: User who created the task
- `owner`: User assigned to complete the task
- `executionPeriod`: Start/end dates
- `note`: Array of notes on the task

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Meteor](https://www.meteor.com/)
- UI components from [Material UI](https://mui.com/)
- Date handling with [Moment.js](https://momentjs.com/)
- Utility functions from [Lodash](https://lodash.com/)
- FHIR standards by [HL7](https://www.hl7.org/fhir/)