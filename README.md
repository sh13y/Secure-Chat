# Secure Chat: The 13% Complete Edition 🚀

A real-time chat application with end-to-end encryption. Because your messages deserve to be as secure as a secret spy dossier, not a sticky note on the fridge.

> **Project Status:** Currently hibernating while I battle the final boss-my degree. This project is about 13% done, which in developer years is basically a full season of a TV show. I’ll be back when my professors release me from academic captivity, whichever comes first\!

-----

### Inspiration

Ever watched "Day of The Jackal" and thought, "Hey, those USB-based encrypted chats look cool?" Well, same here\! While I can't guarantee this app will help you in international espionage (and I legally have to advise against that), it's my humble attempt at creating something similar. Just remember: with great encryption comes great responsibility... and occasionally forgotten passwords.

*Disclaimer: No jackals were harmed in the making of this chat app. 🦊*

-----

### Features

  - User registration and authentication with **JWT** (because we need to know who you are before you start sending encrypted messages).
  - Real-time messaging using **WebSockets** (no more refreshing the page to see if someone replied).
  - End-to-end message encryption (so only you and the recipient can read the messages).
  - Message read status tracking (for when you need to know if you're being ignored).
  - Unread message counter (for when you're popular but too busy to reply).
  - Delete messages and entire chat conversations (because some things are better left unsaid).
  - User search functionality (to find your chat buddy in the wild).
  - **MongoDB** integration for message persistence (your secrets are safe, even if you close the app).
  - CORS enabled (so the frontend and backend can be friends).

-----

### Tech Stack

  - **Frontend:** React (TypeScript) - Because who doesn't love strongly-typed code?
  - **Backend:** Node.js with Express - The backbone of our secret communication service.
  - **WebSocket:** `ws` library - The magic that makes it all real-time.
  - **Database:** MongoDB - Where all the secrets are stored (securely, of course).
  - **Authentication:** JWT - Our bouncer for the secure club.
  - **Encryption:** A custom encryption service - Because why use an off-the-shelf solution when you can build your own?

-----

### Demo

This is what a top-secret chat app looks like when you're not an international spy.

#### Register Page

![Register Page](assets/Screenshot%202025-07-31%20112856.png)


#### Sample Chat (Two Users)

The application supports real-time conversations between users with encrypted message delivery:

**User Perspective 1:**
![Chat User 1](assets/Screenshot%202025-07-31%20112350.png)

**User Perspective 2:**  
![Chat User 2](assets/Screenshot%202025-07-31%20112620.png)

-----

### Getting Started

To get this whole operation running on your local machine, follow these highly classified steps.

1.  **Clone the repository:**
    `git clone https://github.com/sh13y/Secure-Chat.git`
2.  **Install dependencies:**
    `npm install`
3.  **Set up environment variables:** Create a `.env` file with the following, and fill in the blanks like you're cracking a code.

<!-- end list -->

```
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

#### MongoDB Atlas Setup

  - **Create a MongoDB Atlas account** at [mongodb.com/atlas](https://mongodb.com/atlas).
  - **Create a new cluster** (the free tier is plenty for your clandestine needs).
  - **Set up database access:** Create a user with read/write permissions.
  - **Set up network access:** Add your current IP address. (Or use `0.0.0.0/0` for all IPs, but that's like leaving the front door unlocked. Not recommended for a "secure" chat app.)
  - **Get your connection string:** Copy the string and replace `<username>`, `<password>`, and `<database-name>` with your details.

**Example connection string format:**
`mongodb+srv://username:password@cluster.aslazkn.mongodb.net/secure_chat?retryWrites=true&w=majority`

-----

### Recent Updates (The Grand Return\!)

After a brief hibernation, I've re-emerged to squash some bugs and make this a smoother ride.

#### 🔧 Live Message Updating Fixed\!

I've identified and fixed the issues with live message updating in your Secure Chat application. Now messages will appear instantly for both the sender and receiver.

**🐛 Issues Found & Fixed:**

  - **Duplicate `useEffect` Hooks:** There were two identical WebSocket `useEffect` hooks fighting each other. I've consolidated them into a single, improved WebSocket handler.
  - **Server Not Broadcasting to Sender:** The server was only sending messages to the receiver, not back to the sender for immediate display. I've updated the server to send messages to both parties.
  - **Restrictive Message Display Condition:** The client's condition for displaying messages was too picky. I've updated it to include `data.senderId === currentUser` so your sent messages appear instantly, not after a secret squirrel dance.

**✨ Improvements Made:**

  - **Single WebSocket Connection:** One hook to rule them all.
  - **Better Message Handling:** The message display conditions are now more welcoming.
  - **Immediate Feedback:** You'll see your message appear instantly.
  - **Enhanced Logging:** Added detailed console logs for debugging future issues (for when things inevitably go wrong again).

Now, go ahead and send some messages. They'll pop up in real-time, just like magic\! ✨

-----

### Future Improvements (The Roadmap to 100%)

This is just the beginning. I've got a whole list of upgrades planned for when I'm not drowning in academic texts.

  - Enhanced UI/UX (because a good spy app should look cool).
  - File sharing capabilities (for sharing top-secret memes).
  - Group chat functionality (for spy teams and family reunions).
  - Message editing (for when you make a typo in a classified message).
  - Mobile responsiveness (for on-the-go espionage).

-----

### Project Structure

```
src/
├── server/
│   ├── index.ts         # Main server file
│   └── models/
│       └── User.js      # User model
├── shared/
│   ├── types.ts         # Shared type definitions
│   └── encryption.ts    # Encryption service
```

-----

### License

**WTFPL** - Do What The F\*ck You Want To Public License. Go wild.

### Author

**sh13y** - Full-Stack copy-cat, part-time student, full-time dreamer, occasional code whisperer

*Note: This is a fun development project and not intended for production use in its current state. Also, definitely not approved by any secret intelligence agencies... or is it? 🕵️‍♂️*