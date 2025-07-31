# Secure Chat

A real-time secure chat application with end-to-end encryption, inspired by secure communication systems in modern espionage films. Because why send a regular text when you can encrypt it like you're planning to overthrow a small European nation?

**Current Development Status:** 13% complete - Which is basically a proof of concept with delusions of grandeur

![Register Page](assets/Screenshot%202025-07-31%20112350.png)

## Overview

This project aims to create a secure, real-time messaging platform with robust encryption capabilities. Think WhatsApp, but for people who wear sunglasses indoors and order coffee with fake names. While currently in early development (and by early, I mean "barely functional but surprisingly not broken"), the foundation includes user authentication, encrypted messaging, and real-time communication features.

## Features

### Implemented
- User registration and authentication using JWT tokens (because plain text passwords are so 2003)
- Real-time messaging via WebSocket connections (faster than my responses to important emails)
- End-to-end message encryption (your secrets are safe from everyone except your rubber duck)
- Message read status tracking (know when you're being ignored in real-time)
- Unread message counter (for those who like their anxiety quantified)
- Message and conversation deletion (perfect for "did I really send that at 3 AM?" moments)
- User search functionality (find people worthy of your encrypted wisdom)
- MongoDB integration for persistent storage (because forgetting conversations is for amateurs)
- CORS-enabled API (cross-origin requests welcome, unlike my jokes at dinner parties)

### User Interface
The application supports real-time conversations between users with encrypted message delivery:

**User Perspective 1:**
![Chat User 1](assets/Screenshot%202025-07-31%20112350.png)

**User Perspective 2:**  
![Chat User 2](assets/Screenshot%202025-07-31%20112620.png)

## Technical Stack

- **Frontend:** React with TypeScript (because any other choice would be TypeWrong)
- **Backend:** Node.js with Express (fast, reliable, and caffeinated like its developer)
- **Real-time Communication:** WebSocket (for when HTTP is too slow for your impatience)
- **Database:** MongoDB with Mongoose ODM (document-based, like my coding documentation)
- **Authentication:** JSON Web Tokens (tokens that expire faster than New Year's resolutions)
- **Encryption:** Custom encryption service (homemade encryption, like grandma's cookies but for data)
- **Security:** CORS middleware, input validation (protecting you from yourself since 2024)

## Recent Updates

### WebSocket Implementation Improvements

Recent development focused on resolving real-time messaging issues:

**Issues Resolved:**
1. **Duplicate WebSocket Connections:** Consolidated multiple WebSocket useEffect hooks that were creating more chaos than a JavaScript conference debate about semicolons
2. **Message Broadcasting:** Updated server to properly broadcast messages to both sender and receiver (because talking to yourself shouldn't be the only option)
3. **Message Display Logic:** Improved client-side conditions for displaying messages in real-time (messages now appear faster than my regret after pushing to main)
4. **Error Handling:** Added comprehensive logging and error handling (more logs than a Canadian lumber mill)

**Technical Improvements:**
- Unified WebSocket connection management (one connection to rule them all)
- Enhanced message handling with immediate feedback (instant gratification for the digital age)
- Comprehensive debugging logs for development (more detailed than my browser history)
- Duplicate message prevention (because saying things twice is annoying, twice)
- Improved error recovery mechanisms (bouncing back from failures like a developer's career)

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher) - Because we're not animals using v12
- MongoDB Atlas account or local MongoDB installation (cloud preferred, unless you enjoy database maintenance)
- npm or yarn package manager (choose your poison, they both work)

### Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a new cluster (free tier available)
3. Configure database access with appropriate user permissions
4. Set up network access (whitelist your IP address)
5. Obtain your connection string and update the `MONGODB_URI` in your `.env` file

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/secure_chat?retryWrites=true&w=majority
```

### Common Setup Issues

**SSL/TLS Connection Errors:**
If you encounter SSL-related errors (and you probably will, because technology loves to humble us), verify:
- Connection string formatting is correct (spacing matters more than it should)
- Network access is properly configured in MongoDB Atlas (your IP needs to be on the VIP list)
- Database credentials are valid (username does not equal password, shocking revelation)
- Specified database name exists (imaginary databases are not yet supported by MongoDB)

### Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd secure-chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   *Watch your node_modules folder grow like a digital tumor*

3. Configure environment variables (see Environment Configuration above)

4. Start the development server:
   ```bash
   npm run start
   ```
   *Pray to the JavaScript gods for a successful startup*

5. Open multiple browser windows to test real-time messaging between users
   *Talk to yourself like a proper developer*

## Project Structure

```
src/
├── server/
│   ├── index.ts         # Main server application
│   └── models/
│       └── User.js      # User data model
├── shared/
│   ├── types.ts         # Shared TypeScript definitions
│   └── encryption.ts    # Encryption service implementation
```

## Development Roadmap

### Planned Features
- Enhanced user interface and user experience design
- File sharing and media message support
- Group chat functionality
- Message editing and history
- Advanced security features and audit logging
- Mobile-responsive design
- Message search and filtering
- User presence indicators
- Push notifications

### Security Enhancements
- Key rotation mechanisms
- Perfect forward secrecy
- Message integrity verification
- Rate limiting and abuse prevention
- Enhanced authentication methods

## Development Status

This project is currently on pause while the developer battles the final boss known as "academic commitments." Like any good spy operation, development will resume when you least expect it - or when professors finally release me from educational captivity, whichever comes first.

The current implementation provides a solid foundation for secure messaging, though significant development remains to achieve production readiness. Think of it as a really secure skeleton waiting for some digital muscle.

## Inspiration

The project draws inspiration from secure communication systems depicted in modern espionage films, particularly "The Day of the Jackal." While not intended for actual covert operations (please don't overthrow governments with this), it explores the implementation of secure, encrypted communication channels. Perfect for discussing weekend plans with the paranoia level of international espionage.

## Contributing

This project is currently in "single-player mode" while I figure out what I'm doing. Future contributions may be welcomed once the core feature set is more complete and I've stopped breaking things on a daily basis.

## License

WTFPL - Do What The F*ck You Want To Public License

## Author

**sh13y** - Full-stack developer, part-time student, full-time dreamer, occasional code whisperer

---

## Disclaimer

This application is a development project and is not intended for production use in its current state. The encryption implementation should be thoroughly audited before any security-critical applications - or before you start planning anything that might interest three-letter agencies.

*Note: No actual espionage activities were conducted during development (that we can legally admit to), and the application is not endorsed by any intelligence agencies. Side effects may include feeling like a secret agent, increased paranoia about digital privacy, and an inexplicable urge to check over your shoulder while coding.*