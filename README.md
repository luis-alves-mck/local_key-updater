# Key Updater

A full-stack application for managing and updating AI service keys across different use cases and model configurations. Built with a Node.js/TypeScript backend and React frontend.

## Overview

The Key Updater is a monorepo containing both frontend and backend services designed to manage API keys for various AI services (OpenAI, Anthropic, Google) across different use cases like transcript processing, embeddings generation, chat responses, and more. It provides a centralized system for key rotation and priority management with a user-friendly web interface.

## Features

- **Multi-provider AI Key Management**: Supports OpenAI, Anthropic Claude, and Google AI services
- **Use Case-based Configuration**: Different AI models and keys for specific use cases
- **Priority-based Key Rotation**: Configurable priority system for key failover
- **RESTful API**: Express.js-based API for key management operations
- **MongoDB Integration**: Persistent storage for configuration and key data
- **React Frontend**: Modern web interface for key management
- **TypeScript Support**: Full TypeScript implementation for type safety

## Monorepo Structure

```
key-updater/
├── backend/                # Node.js/TypeScript API server
│   ├── src/               # Source code
│   ├── scripts/           # Utility scripts
│   └── package.json       # Backend dependencies
├── frontend/              # React/Vite web application
│   ├── src/               # React components
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── README.md              # This file
└── .gitignore            # Git ignore rules
```

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Development**: ts-node-dev for hot reloading
- **Testing**: Jest

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **HTTP Client**: Axios
- **Language**: TypeScript

## Prerequisites

- Node.js (v16 or higher)
- MongoDB instance
- npm or yarn package manager

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd key-updater

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 2. Environment Setup

Set up backend environment variables:
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env` with your configuration:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/key-updater
NODE_ENV=development
```

### 3. Start the Application

#### Option A: Run Both Services (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
This starts the API server on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
This starts the React app on `http://localhost:5173`

#### Option B: Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

### 4. Initialize Data (First Time Only)

Import the use case configurations:
```bash
cd backend
npm run set-usecases
```

## Development Workflow

### Backend Development
```bash
cd backend
npm run dev          # Start with hot reload
npm run build        # Build TypeScript
npm test             # Run tests
npm run set-usecases # Import use cases
```

### Frontend Development
```bash
cd frontend
npm run dev      # Start dev server with HMR
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## API Endpoints

### Use Cases Management
- `GET /api/use-cases` - Get all use cases
- `GET /api/use-cases/:name` - Get specific use case
- `POST /api/use-cases` - Create new use case
- `PUT /api/use-cases/:name` - Update use case
- `DELETE /api/use-cases/:name` - Delete use case

### Key Management
- `GET /api/keys` - Get all keys
- `POST /api/keys` - Add new key
- `PUT /api/keys/:id` - Update key
- `DELETE /api/keys/:id` - Delete key

## Use Case Configuration

Use cases are defined in `backend/scripts/files/use-cases.json` with the following structure:

```json
{
  "use_case_name": "genai_recommendations",
  "openai_keys": [
    {
      "key_name": "key_0f7f_azure",
      "model_name": "gpt-4o",
      "key_priority": 1
    }
  ]
}
```

### Supported Use Cases

- **GenAI Operations**: `genai_recommendations`, `genai_search`, `genai_transcript_processing`
- **Embeddings**: `embedding_generation`, `summary_master_embeddings`
- **Chat Services**: `chat_citation`, `chat_response`, `chat_topic_generation`
- **Transcript Processing**: `128k_4o_transcripts_processing`, `transcript_summaries_general_reports`
- **Summary Services**: `summary_worker_clients`, `summary_recommendations`
- **Specialized Tasks**: `qc_tool_vision`, `vault_synthesis`, `taxonomy`

### Supported AI Providers

- **OpenAI**: GPT-4, GPT-3.5, text-embedding-ada-002
- **Anthropic**: Claude-3.5-Sonnet
- **Google**: text-embedding-005
- **Azure OpenAI**: Azure-hosted OpenAI models

## Detailed Project Structure

```
key-updater/
├── backend/                    # API Server
│   ├── src/
│   │   ├── app.ts             # Main application file
│   │   ├── routes/            # API route handlers
│   │   ├── models/            # MongoDB models
│   │   ├── controllers/       # Business logic
│   │   └── middleware/        # Custom middleware
│   ├── scripts/
│   │   ├── files/
│   │   │   └── use-cases.json # Use case configurations
│   │   └── importUseCases.ts  # Use case import script
│   ├── dist/                  # Compiled JavaScript (generated)
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React Web App
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service calls
│   │   ├── types/             # TypeScript type definitions
│   │   ├── App.tsx            # Main App component
│   │   └── main.tsx           # React entry point
│   ├── public/                # Static assets
│   ├── dist/                  # Build output (generated)
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── README.md                   # This file
└── .gitignore                 # Git ignore rules
```

## Development

### Adding New Use Cases

1. Add the use case to `backend/scripts/files/use-cases.json`
2. Run the import script: `npm run set-usecases`
3. Update API handlers if needed

### Key Priority System

Keys are prioritized from 1 (highest) to N (lowest). The system attempts to use keys in priority order, falling back to lower priority keys if higher ones fail.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/key-updater` |
| `NODE_ENV` | Environment mode | `development` |

## Testing

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is proprietary. All rights reserved.

## Support

For support and questions, please contact the development team or create an issue in the project repository.