# PrepLab - Personal Aptitude & Banking Exam Practice Platform

PrepLab is a high-performance, single-user exam practice web application built to master rapid mental calculations and quantitative agility for banking and competitive aptitude examinations (SBI PO/Clerk, IBPS PO/Clerk, RBI Grade B, SSC CGL, RRB, and campus placements).

The platform focuses on building split-second speed through deterministic, client-side calculation drills, near-base adjustment techniques, and persistent performance analytics using Supabase PostgreSQL.

---

## Key Highlights

- **Speed Math Focus**: Initial fully functional topic: **Fast Addition & Subtraction**, engineered with real banking exam calculation patterns (near-base adjustments like $483 + 297$ or $625 - 198$).
- **Deterministic Math Engine**: All questions are generated in pure JavaScript with zero repetitive patterns and guaranteed valid non-negative results for subtraction. **Zero AI models or external AI APIs are used anywhere in the codebase.**
- **High-Precision Timing**: Millisecond-accurate reaction timing tracks your exact time per calculation to monitor cognitive speed gains.
- **Keyboard-First Workflow**: Streamlined numerical entry with automatic focus and instant `Enter ↵` submission for rapid-fire drilling.
- **Persistent Analytics**: Tests and per-question attempt histories are persisted to Supabase PostgreSQL, powering real accuracy trends, speed trajectories, and drill breakdowns.
- **No Dummy Content**: Zero fake stats, zero dummy charts, zero fake streaks, and zero placeholder questions. When no tests have been completed, proper, meaningful empty states are presented.
- **Modular Architecture**: Built with an extensible topic registry allowing new topics (Percentages, Ratio & Proportion, Number System, etc.) to be added with zero rewrites to existing UI, routing, or analytics infrastructure.
- **Offline / Local Fallback**: Gracefully functions in local storage mode if Supabase credentials are not configured or the network is unavailable.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 (SPA) |
| **Build Tool & Dev Server** | Vite 6 |
| **Language** | JavaScript (ESModules) |
| **Styling** | Tailwind CSS 3.4 & PostCSS |
| **Routing** | React Router 6 |
| **Database & Persistence** | Supabase (PostgreSQL 15) |
| **Charts & Visualizations** | Recharts (Responsive SVG) |
| **Icons** | Lucide React |
| **Deployment Target** | Vercel (SPA-ready via `vercel.json`) |

---

## Project Structure

```
PrepLab/
├── public/                 # Static assets
├── supabase/
│   └── schema.sql          # Complete PostgreSQL schema, RLS policies, & topic seed
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Alert.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── EmptyState.jsx
│   │   ├── Footer.jsx
│   │   ├── Navbar.jsx
│   │   └── SupabaseStatusBanner.jsx
│   ├── data/               # Static configurations and seeds
│   ├── generators/         # Extensible question generator modules (Pure JS)
│   │   ├── additionSubtraction.js
│   │   └── index.js        # Central generator registry
│   ├── hooks/              # Custom hooks (e.g. useTimer)
│   │   └── useTimer.js
│   ├── layouts/            # Page layouts
│   │   └── RootLayout.jsx
│   ├── lib/                # Third-party client instances
│   │   └── supabase.js     # Supabase client with safety validations
│   ├── pages/              # Application views
│   │   ├── Dashboard.jsx   # Real metrics, charts, & attempt history
│   │   ├── Home.jsx        # Landing page with topic spotlight
│   │   ├── NotFound.jsx    # 404 handler
│   │   ├── Practice.jsx    # Test configuration & interactive runner
│   │   ├── Results.jsx     # Detailed review & score breakdown
│   │   └── Topics.jsx      # Topic catalog loaded from database
│   ├── services/           # Data access and business logic
│   │   ├── statsService.js
│   │   ├── testsService.js
│   │   └── topicsService.js
│   ├── styles/             # Global CSS & Tailwind layers
│   │   └── index.css
│   ├── utils/              # Calculation & formatting helpers
│   │   └── formatters.js
│   ├── App.jsx             # Route definitions
│   └── main.jsx            # Application entry point
├── .env.example            # Environment variable template
├── index.html              # HTML shell with Google Fonts
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Custom theme & typography
├── vercel.json             # Vercel SPA rewrite configuration
└── vite.config.js          # Vite configuration with chunk splitting
```

---

## Node.js Requirements

- **Node.js**: `v18.0.0` or higher (tested on Node v20 and v24)
- **npm**: `v9.0.0` or higher

---

## Environment Variables

PrepLab reads credentials exclusively through Vite environment variables. Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Populate the values from your Supabase Project Settings (**Project Settings -> API**):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key
```

> **Security Note**: Never commit `.env` or `.env.local` to version control. PrepLab utilizes only the browser-safe anonymous/publishable key (`anon` key). Never use the `service_role` secret key.

---

## Supabase Database Setup

1. Create a new project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Paste and run the entire contents of [`supabase/schema.sql`](./supabase/schema.sql).

### Database Schema Overview

#### `topics`
Stores available practice modules.
```sql
CREATE TABLE topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

#### `test_attempts`
Stores completed test sessions.
```sql
CREATE TABLE test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    question_count INTEGER NOT NULL CHECK (question_count > 0),
    correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
    accuracy NUMERIC(5, 2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
    total_time_ms BIGINT NOT NULL CHECK (total_time_ms >= 0),
    average_time_ms BIGINT NOT NULL CHECK (average_time_ms >= 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

#### `question_attempts`
Stores individual question answers and response times.
```sql
CREATE TABLE question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL CHECK (question_number > 0),
    operation TEXT NOT NULL,
    question TEXT NOT NULL,
    correct_answer INTEGER NOT NULL,
    user_answer INTEGER,
    is_correct BOOLEAN NOT NULL,
    time_taken_ms BIGINT NOT NULL CHECK (time_taken_ms >= 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

#### Row Level Security (RLS)
The database enforces RLS with permissive policies for the single-user `anon` role, allowing reads, inserts, and deletes without requiring user authentication or a users table.

---

## Local Development

1. **Clone or navigate to the repository:**
   ```bash
   cd "d:/Personal Folders/Aptitude Training/PrepLab"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Ensure `.env.local` contains valid Supabase project credentials. If unconfigured, the application runs in local browser storage mode.

4. **Start Vite development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Build for production:**
   ```bash
   npm run build
   ```

6. **Preview production build locally:**
   ```bash
   npm run preview
   ```

---

## Deployment to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. Configure Environment Variables in the Vercel project settings:
   - `VITE_SUPABASE_URL` = `https://<your-project>.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `<your-anon-key>`
4. Build & Output settings are automatically detected:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Deploy. The included `vercel.json` ensures all client-side routes (`/practice`, `/dashboard`, `/results/:id`) resolve properly to `index.html`.

---

## How to Add a New Topic in the Future

PrepLab is architected to be completely extensible. Adding a new topic (e.g., *Percentage Drills* or *Number System*) requires **zero modifications** to the core test runner, UI layouts, database models, or dashboard.

Follow these 3 steps:

### Step 1: Add Topic to Supabase
Run an insert statement in your Supabase SQL editor:
```sql
INSERT INTO topics (id, name, category)
VALUES ('percentages', 'Percentages & Fraction Equivalence', 'Quantitative Aptitude');
```

### Step 2: Create Generator Module
Create `src/generators/percentages.js`:
```javascript
export const percentagesTopic = {
  id: 'percentages',
  name: 'Percentages & Fraction Equivalence',
  category: 'Quantitative Aptitude',
  description: 'Practice rapid percentage calculations, base fractions, and conversion drills.',
  config: {
    questionCounts: [5, 10, 20, 50],
    defaultCount: 10,
    operations: [
      { id: 'fractions', label: 'Fraction to Percentage', symbol: '%' },
      { id: 'percentage-of', label: 'X% of Y', symbol: 'x%' }
    ],
    defaultOperation: 'percentage-of',
    difficulties: [
      { id: 'easy', label: 'Standard Bases (1/2 to 1/10)', description: 'Core benchmark percentages' },
      { id: 'hard', label: 'Complex Bases (1/11 to 1/20)', description: 'Advanced speed conversions' }
    ],
    defaultDifficulty: 'easy',
    styles: [
      { id: 'standard', label: 'Standard', description: 'Direct calculations' }
    ],
    defaultStyle: 'standard'
  },
  generateQuestions({ count = 10, operation = 'percentage-of', difficulty = 'easy' } = {}) {
    // Generate valid question objects:
    // { id, questionNumber, question: "25% of 480", num1: 25, num2: 480, operatorSymbol: "%", correctAnswer: 120 }
    return questionsArray;
  }
};

export default percentagesTopic;
```

### Step 3: Register in Central Registry
Import and add it to `src/generators/index.js`:
```javascript
import additionSubtractionTopic from './additionSubtraction';
import percentagesTopic from './percentages';

const generatorRegistry = {
  [additionSubtractionTopic.id]: additionSubtractionTopic,
  [percentagesTopic.id]: percentagesTopic,
};
```

The new topic immediately appears on the **Topics** catalog, links to the **Practice** configuration screen, generates questions, and saves results to the **Dashboard** with zero further code changes.

---

## License

Personal exam-practice application. Created for personal banking & aptitude preparation.
