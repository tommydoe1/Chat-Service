# Chat-Service
An AI chat application built using Angular, Typescript, Tailwind CSS, and an Express backend integrated with OpenAI, Gemini, and Llama APIs.

## Features
- Responsive Chat UI
- Markdown support
- Conversation context
- Rate limiting
- CORS restrictions
- User authentication
- Conversation history
- Multiple AI models (OpenAI, Llama, Gemini)

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
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=your_google_callback_url
GEMINI_API_KEY=your_gemini_api_key_here

# Used for Llama models (served via Groq API)
GROQ_API_KEY=your_llama_api_key_here
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