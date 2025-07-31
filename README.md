# Secure Chat

A real-time secure chat application with end-to-end encryption.

## Features

- User registration and authentication using JWT
- Real-time messaging using WebSocket
- End-to-end message encryption
- Message read status tracking
- Unread message counter
- Delete messages and entire chat conversations
- User search functionality
- MongoDB integration for message persistence
- CORS enabled

## Tech Stack

- Frontend: React (TypeScript)
- Backend: Node.js with Express
- WebSocket: ws library
- Database: MongoDB
- Authentication: JWT
- Encryption: Custom encryption service

## Environment Variables

Create a `.env` file with the following:

```
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Project Structure

```
src/
├── server/
│   ├── index.ts         # Main server file
│   └── models/
│       └── User.js      # User model
├── shared/
│   ├── types.ts         # Shared type definitions
│   └── encryption.ts    # Encryption service
```

## Current Status

This project is currently paused due to academic commitments. I'll revisit and continue development when I'm free from my degree studies. Future improvements planned:

- Enhanced UI/UX
- File sharing capabilities
- Group chat functionality
- Message editing
- Enhanced security features
- Mobile responsiveness

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the server: `npm run start`

## License

WTFPL - Do What The F*ck You Want To Public License

## Author

sh13y

---
*Note: This is a development project and not intended for production use in its current state.*
