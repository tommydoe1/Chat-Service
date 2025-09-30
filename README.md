# Chat-Service
An AI chat application built using Angular, Typescript, Tailwind CSS, and an Express backend integrated with OpenAI API.

## Features
- Responsive Chat UI
- Markdown support
- Conversation context
- System prompt customisation
- Rate limiting
- CORS restrictions

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