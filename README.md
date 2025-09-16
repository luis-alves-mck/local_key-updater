# Key Updater Backend

A Node.js/TypeScript backend service for managing and updating AI service keys across different use cases and model configurations.

## Overview

The Key Updater Backend is designed to manage API keys for various AI services (OpenAI, Anthropic, Google) across different use cases like transcript processing, embeddings generation, chat responses, and more. It provides a centralized system for key rotation and priority management.

## Features

- **Multi-provider AI Key Management**: Supports OpenAI, Anthropic Claude, and Google AI services
- **Use Case-based Configuration**: Different AI models and keys for specific use cases
- **Priority-based Key Rotation**: Configurable priority system for key failover
- **RESTful API**: Express.js-based API for key management operations
- **MongoDB Integration**: Persistent storage for configuration and key data
- **TypeScript Support**: Full TypeScript implementation for type safety

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Development**: ts-node-dev for hot reloading
- **Testing**: Jest

## Prerequisites

- Node.js (v16 or higher)
- MongoDB instance
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd key-updater
```

2. Install dependencies:
```bash
cd backend
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/key-updater
NODE_ENV=development
```

## Usage

### Development Mode
```bash
npm run dev
```
Starts the server with hot reloading using ts-node-dev.

### Production Build
```bash
npm run build
npm start
```

### Import Use Cases
```bash
npm run set-usecases
```
Imports the use case configurations from `scripts/files/use-cases.json`.

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

## Project Structure

```
backend/
├── src/
│   ├── app.ts              # Main application file
│   ├── routes/             # API route handlers
│   ├── models/             # MongoDB models
│   ├── controllers/        # Business logic
│   └── middleware/         # Custom middleware
├── scripts/
│   ├── files/
│   │   └── use-cases.json  # Use case configurations
│   └── importUseCases.ts   # Use case import script
├── dist/                   # Compiled JavaScript (generated)
├── package.json
└── tsconfig.json
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