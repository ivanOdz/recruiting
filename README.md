# AI-Powered Candidate Search

A Next.js application for searching candidates using AI-powered semantic search with OpenAI embeddings and Supabase vector similarity search.

## Features

- **Semantic Candidate Search**: Find candidates using natural language queries
- **Vector Similarity Search**: Powered by OpenAI embeddings and Supabase pgvector
- **Real-time Results**: Fast candidate matching with relevance scoring

## Prerequisites

- Node.js 18+ 
- Supabase account and project
- OpenAI API key
- PostgreSQL database with pgvector extension enabled

## Setup

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### 2. Supabase Database Setup

Create a `candidates` table with the following structure:

```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cv_info TEXT NOT NULL,
  embedding vector(1536), -- 1536 dimensions for text-embedding-3-small
  linkedin_url TEXT,
  cv_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Enable the pgvector extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Create the `match_candidates` function for similarity search:

```sql
CREATE OR REPLACE FUNCTION match_candidates(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  cv_info text,
  similarity float,
  linkedin_url text,
  cv_url text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    candidates.id,
    candidates.name,
    candidates.cv_info,
    1 - (candidates.embedding <=> query_embedding) AS similarity,
    candidates.linkedin_url,
    candidates.cv_url
  FROM candidates
  WHERE candidates.embedding IS NOT NULL
    AND 1 - (candidates.embedding <=> query_embedding) > match_threshold
  ORDER BY candidates.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 3. Populate Embeddings

After adding candidate data to your database, run the embedding script:

```bash
npm run embed
```

This script will:
- Fetch all candidates from the `candidates` table
- Generate embeddings using OpenAI's `text-embedding-3-small` model
- Store the embeddings back in the database

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

1. Enter a search query describing the role you're hiring for (e.g., "backend engineer with AWS experience")
2. The system will:
   - Generate an embedding for your query
   - Find the top 5 matching candidates using vector similarity
   - Display results ranked by relevance

## Project Structure

```
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts          # API endpoint for candidate search
│   └── ...
├── components/
│   └── candidate-search.tsx      # Main search component
├── lib/
│   └── supabase.ts               # Supabase client configuration
└── scripts/
    └── embed_candidates.ts       # Script to populate embeddings
```

## Technologies

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **OpenAI** - Embeddings generation
- **Supabase** - Database and vector search
- **Tailwind CSS** - Styling

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Vector Search](https://supabase.com/docs/guides/ai/vector-columns)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
