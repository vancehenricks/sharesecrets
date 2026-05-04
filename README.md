# OneTimeShare

Share secrets via one-time links. Links expire in 5 minutes.

## Features

- 🔒 Share sensitive information securely
- ⏱️ Automatic expiration (5 minutes)
- 🔑 One-time access per secret
- 📝 No database required (in-memory storage)
- ⚡ Fast and lightweight

## Tech Stack

- **Frontend**: TypeScript, Vite, Vanilla CSS
- **Backend**: Express.js, TypeScript, Node.js
- **Storage**: In-memory (expires automatically)

## Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

The application will be available at `http://localhost:3000`

## Development

```bash
# Install dependencies
npm install

# Start development server (builds and runs)
npm run dev

# For frontend development only:
npm run build:client

# For backend development only:
npm run build:server
```

## API Documentation

### Create a Secret

**POST** `/api/secrets`

Request:
```json
{
  "content": "Your secret message"
}
```

Response:
```json
{
  "id": "abc123...",
  "shareUrl": "http://localhost:3000/share/abc123...",
  "expiresAt": 1234567890,
  "expiresIn": 300000
}
```

### Retrieve a Secret

**GET** `/api/secrets/:id`

Response (first access):
```json
{
  "content": "Your secret message"
}
```

Response (subsequent access):
```json
{
  "error": "Secret not found or has expired"
}
```

### Check Secret Validity

**GET** `/api/secrets/:id/check`

Response:
```json
{
  "valid": true
}
```

## How to Use

1. Visit `http://localhost:3000`
2. Enter your secret message
3. Click "Generate Share Link"
4. Share the generated URL with others
5. They can access it once - after viewing, it's deleted

## License

ISC
