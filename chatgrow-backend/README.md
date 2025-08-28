# ChatGrow Backend

A Node.js backend API for the ChatGrow application.

## Features

- Express.js REST API
- Environment-based configuration
- Security middleware (Helmet, CORS)
- Development and production ready

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chatgrow-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Testing
```bash
npm test
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
NODE_ENV=development
```

## Project Structure

```
chatgrow-backend/
├── src/                 # Source code
├── package.json         # Dependencies and scripts
├── .env                 # Environment variables
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## API Endpoints

The API endpoints will be documented here as they are implemented.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License 