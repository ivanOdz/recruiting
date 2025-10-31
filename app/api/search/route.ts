import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase, supabaseAdmin } from '@/lib/supabase'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

if (!openai.apiKey) {
  console.warn('OPENAI_API_KEY is not set')
}

type SearchResponse = {
  id: string
  full_name: string  // Changed from 'name' to 'full_name' to match your Supabase schema
  cv_info: string
  similarity: number
  linkedin_url?: string | null
  cv_url?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    if (!openai.apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })

    const queryEmbedding = embeddingResponse.data[0].embedding

    // Use admin client if available, otherwise fall back to regular client
    // Note: For production, ensure RLS policies allow reading candidates or use service role key
    const client = supabaseAdmin ?? supabase

    // First, check if there are any candidates with embeddings
    const { count, error: countError } = await client
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null)

    if (countError) {
      console.error('Error checking candidates:', countError)
    } else {
      console.log(`Found ${count || 0} candidates with embeddings`)
    }

    // Try with a very low threshold first to see if we get any results
    // We'll filter client-side if needed, but this ensures we see matches
    const { data, error } = await client.rpc('match_candidates', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3, // Very low threshold to catch more matches
      match_count: 5,
    })

    console.log('RPC call result:', {
      dataLength: data?.length || 0,
      hasError: !!error,
      error: error?.message,
    })

    if (data && data.length > 0) {
      console.log('Top match similarity:', data[0]?.similarity)
    }

    if (error) {
      console.error('Supabase RPC error:', error)
      // Check if the function exists
      if (error.message?.includes('function') || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database function match_candidates not found. Please run the SQL setup from README.md' 
          },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: error.message || 'Failed to search candidates' },
        { status: 500 }
      )
    }

    // Log if no results found and try a fallback
    if (!data || data.length === 0) {
      console.log('No candidates found with threshold 0.3. Trying with threshold 0.0...')
      
      // Try with threshold 0.0 to see what the actual similarity scores are
      const { data: fallbackData, error: fallbackError } = await client.rpc('match_candidates', {
        query_embedding: queryEmbedding,
        match_threshold: 0.0, // No threshold - get all candidates
        match_count: 5,
      })
      
      if (fallbackError) {
        console.error('Fallback query error:', fallbackError)
      } else if (fallbackData && fallbackData.length > 0) {
        console.log('Found candidates with 0.0 threshold:')
        fallbackData.forEach((item: SearchResponse, idx: number) => {
          console.log(`  ${idx + 1}. Similarity: ${item.similarity?.toFixed(4)} - ${item.full_name}`)
        })
        
        // Return results even with low similarity, generating reasons for each
        const fallbackCandidates = await Promise.all(
          fallbackData.map(async (item: SearchResponse) => {
            // Generate a summary explaining why this candidate matches
            let reason = 'No additional information available'
            
            if (item.cv_info && item.cv_info.trim()) {
              try {
                const reasonResponse = await openai.chat.completions.create({
                  model: 'gpt-4o-mini',
                  messages: [
                    {
                      role: 'system',
                      content: 'You are a recruiter assistant. Generate a brief, professional summary explaining why a candidate matches a job search query. Focus on relevant skills, experience, and qualifications. Keep it concise (2-3 sentences).',
                    },
                    {
                      role: 'user',
                      content: `Search query: "${query}"\n\nCandidate CV information:\n${item.cv_info}\n\nGenerate a brief summary explaining why this candidate is a good match for this search query.`,
                    },
                  ],
                  max_tokens: 150,
                  temperature: 0.7,
                })
                
                reason = reasonResponse.choices[0]?.message?.content?.trim() || item.cv_info
              } catch (error) {
                console.error(`Error generating reason for candidate ${item.id}:`, error)
                // Fallback to original cv_info if OpenAI call fails
                reason = item.cv_info
              }
            }

            return {
              id: item.id,
              name: item.full_name || 'Unknown',
              accuracy: Math.round((item.similarity || 0) * 100),
              reason,
              ...(item.linkedin_url && { linkedinUrl: item.linkedin_url }),
              ...(item.cv_url && { cvUrl: item.cv_url }),
            }
          })
        )
        
        return NextResponse.json(fallbackCandidates)
      } else {
        console.log('No candidates found even with 0.0 threshold. Possible issues:')
        console.log('- Embeddings might not be generated correctly')
        console.log('- Query embedding might not match any candidate embeddings')
        console.log('- Database function might have an issue')
      }
    }

    // Transform the results and generate reasons for each candidate
    const candidates = await Promise.all(
      (data || []).map(async (item: SearchResponse) => {
        // Generate a summary explaining why this candidate matches
        let reason = 'No additional information available'
        
        if (item.cv_info && item.cv_info.trim()) {
          try {
            const reasonResponse = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'You are a recruiter assistant. Generate a brief, professional summary explaining why a candidate matches a job search query. Focus on relevant skills, experience, and qualifications. Keep it concise (2-3 sentences).',
                },
                {
                  role: 'user',
                  content: `Search query: "${query}"\n\nCandidate CV information:\n${item.cv_info}\n\nGenerate a brief summary explaining why this candidate is a good match for this search query.`,
                },
              ],
              max_tokens: 150,
              temperature: 0.7,
            })
            
            reason = reasonResponse.choices[0]?.message?.content?.trim() || item.cv_info
          } catch (error) {
            console.error(`Error generating reason for candidate ${item.id}:`, error)
            // Fallback to original cv_info if OpenAI call fails
            reason = item.cv_info
          }
        }

        return {
          id: item.id,
          name: item.full_name || 'Unknown',
          accuracy: Math.round((item.similarity || 0) * 100),
          reason,
          ...(item.linkedin_url && { linkedinUrl: item.linkedin_url }),
          ...(item.cv_url && { cvUrl: item.cv_url }),
        }
      })
    )

    return NextResponse.json(candidates)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

