# Chat-Service
An AI chat application built using Angular, Typescript, Tailwind CSS, and an Express backend integrated with OpenAI API.

## Features
- Responsive Chat UI
- Markdown support
- Conversation context
- System prompt customisation
- Rate limiting
- CORS restrictions
- User authentication
- Conversation history

## Live Demo
https://chat-service-murex.vercel.app

## How To Run
### Clone repo
```bash
git clone https://github.com/tommydoe1/Chat-Service.git
cd Chat-Service
```

### Install dependencies
**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### Add environment variables
Create a .env file in /server containing:
```env
OPENAI_API_KEY=your_api_key_here
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Run locally
**Start backend:**
```bash
cd server
npm run dev
```

**Start frontend**
```bash
cd client
ng serve
```

Open http://localhost:4200