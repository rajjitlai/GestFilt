# AI Operating System

A production-ready AI Operating System built with Next.js 14, TypeScript, and Google's Gemini AI. Features include multi-skill selection, document analysis, streaming responses, and intelligent memory management.

## 🚀 Features

- **Chat Interface** with streaming Gemini AI responses
- **12 Predefined Business Skills** (Idea Validation, Business Model Design, GTM Strategy, etc.)
- **Model Selection** (Gemini 1.5 Pro / Flash)
- **File Upload & Analysis** (PDF, DOCX, TXT, MD)
- **Smart Memory Management** (Short-term + Structured long-term memory)
- **Admin Panel** for skill management (CRUD operations)
- **Dark Mode UI** with TailwindCSS

## 📁 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **AI**: @google/generative-ai
- **File Processing**: pdf-parse, mammoth
- **Storage**: JSON file persistence (no database)

## 🛠️ Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Steps

1. **Clone the repository**
   ```bash
   cd application
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Create required directories**
   ```bash
   mkdir -p uploads data/memory
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Main Chat Interface

1. **Select a Model**: Choose between Gemini 1.5 Pro or Flash
2. **Select Skills**: Check one or more skills to activate (e.g., "Idea Validation")
3. **Upload Documents** (Optional): Upload PDF, DOCX, TXT, or MD files for context
4. **Start Chatting**: Type your message and press Send

The AI will use the selected skills to provide structured, step-by-step analysis.

### Admin Panel

Access the admin panel at [http://localhost:3000/admin](http://localhost:3000/admin) to:

- View all skills
- Edit skill prompts, steps, and output formats
- Toggle strict mode
- Create new custom skills
- Delete skills

## 🧠 How It Works

### Skill System

Each skill has:
- **System Prompt**: Instructions for the AI
- **Process Steps**: Sequential reasoning steps
- **Output Format**: Structure for responses
- **Strict Mode**: Enforces step-by-step processing

When you select multiple skills, the system merges their instructions into a comprehensive prompt.

### Memory Management

**Short-term Memory**:
- Stores last 15 messages
- Token-aware trimming (~40k chars max)

**Structured Memory**:
- Automatically extracts goals, constraints, decisions, preferences, and facts
- Persisted per session in JSON files
- Continuously updated after each interaction

### File Processing

Uploaded files are:
1. Validated (type, size)
2. Stored in `/uploads`
3. Text extracted (PDF via pdf-parse, DOCX via mammoth)
4. Truncated to 50,000 chars
5. Included in AI context

## 🔐 Security

- File type validation (only PDF, DOCX, TXT, MD allowed)
- Max file size: 10MB
- Filename sanitization (prevents path traversal)
- API key never exposed client-side

## 📦 Project Structure

```
application/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # Streaming chat endpoint
│   │   ├── upload/route.ts     # File upload
│   │   └── skills/             # Skill CRUD APIs
│   ├── admin/page.tsx          # Admin panel
│   ├── page.tsx                # Main chat interface
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   ├── ChatWindow.tsx
│   ├── ChatInput.tsx
│   ├── FileUploader.tsx
│   ├── UploadedFilesList.tsx
│   ├── SkillSelector.tsx
│   ├── ModelSelector.tsx
│   └── SkillEditor.tsx
├── lib/
│   ├── gemini.ts               # Gemini AI integration
│   ├── skillEngine.ts          # Skill loading & prompt building
│   ├── memory.ts               # Memory management
│   ├── fileProcessor.ts        # File upload & text extraction
│   └── types.ts                # TypeScript types
├── data/
│   ├── skills.json             # Predefined skills
│   └── memory/                 # Session memory files
└── uploads/                     # Uploaded files
```

## 🎯 Available Skills

1. **Idea Validation** - Evaluate business ideas
2. **Business Model Design** - Design sustainable business models
3. **Go-To-Market Strategy** - Plan product launches
4. **Fundraising Strategy** - Guide capital raising
5. **Product Specification Writing** - Create detailed specs
6. **Growth & Metrics** - Design growth strategies
7. **Sales Strategy** - Build sales processes
8. **Marketing & Branding** - Develop brand positioning
9. **Customer Success** - Build retention programs
10. **Operations Setup** - Design operational frameworks
11. **Financial Planning** - Create financial models
12. **Legal Foundations** - Guide legal structure

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🐛 Troubleshooting

**Gemini API errors**: Ensure your API key is valid and has quota remaining

**File upload fails**: Check file size (<10MB) and type (PDF, DOCX, TXT, MD only)

**Skills not loading**: Ensure `data/skills.json` exists and is valid JSON

**Memory not persisting**: Ensure `data/memory/` directory has write permissions

## 📄 License

MIT

## 🤝 Contributing

This is a production-ready MVP. Feel free to extend with additional skills, integrations, or features!

---

Built with ❤️ using Next.js 14 and Gemini AI
