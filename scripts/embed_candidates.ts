import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!openai.apiKey) {
  throw new Error('OPENAI_API_KEY is not set')
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function embedAllCandidates() {
  console.log('Fetching candidates from Supabase...')
  
  const { data: candidates, error: fetchError } = await supabase
    .from('candidates')
    .select('id, cv_info')

  if (fetchError) {
    throw new Error(`Error fetching candidates: ${fetchError.message}`)
  }

  if (!candidates || candidates.length === 0) {
    console.log('No candidates found in database.')
    return
  }

  console.log(`Found ${candidates.length} candidates. Generating embeddings...`)

  for (const candidate of candidates) {
    if (!candidate.cv_info) {
      console.warn(`Skipping candidate ${candidate.id} - no cv_info`)
      continue
    }

    try {
      console.log(`Processing candidate ${candidate.id}...`)
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: candidate.cv_info,
      })

      const embedding = response.data[0].embedding

      const { error: updateError } = await supabase
        .from('candidates')
        .update({ embedding })
        .eq('id', candidate.id)

      if (updateError) {
        console.error(`Error updating candidate ${candidate.id}:`, updateError.message)
      } else {
        console.log(`✅ Updated candidate ${candidate.id}`)
      }
    } catch (error) {
      console.error(`Error processing candidate ${candidate.id}:`, error)
    }
  }

  console.log('✅ Embeddings populated!')
}

embedAllCandidates().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

