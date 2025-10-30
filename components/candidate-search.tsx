'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, FileText, ExternalLink, Menu, Plus, Sparkles } from 'lucide-react'

type Candidate = {
  id: string
  name: string
  accuracy: number
  reason: string
  linkedinUrl?: string
  cvUrl?: string
}

type SearchHistory = {
  id: string
  query: string
  timestamp: Date
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  candidates?: Candidate[]
  timestamp: Date
}

// Mock data
const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    accuracy: 95,
    reason: 'Strong background in React and TypeScript with 5+ years experience. Previously led frontend teams at tech startups. Excellent communication skills demonstrated through technical blog posts.',
    linkedinUrl: 'https://linkedin.com/in/sarahchen',
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    accuracy: 92,
    reason: 'Senior full-stack developer with expertise in Next.js and Node.js. Has experience building scalable applications and mentoring junior developers. Strong problem-solving skills.',
    cvUrl: '/cv/marcus-johnson.pdf',
  },
  {
    id: '3',
    name: 'Priya Patel',
    accuracy: 89,
    reason: 'Experienced frontend engineer with a focus on performance optimization and accessibility. Contributed to open-source projects and has a proven track record of delivering high-quality code.',
    linkedinUrl: 'https://linkedin.com/in/priyapatel',
    cvUrl: '/cv/priya-patel.pdf',
  },
  {
    id: '4',
    name: 'Alex Rivera',
    accuracy: 87,
    reason: 'Full-stack developer with strong design sensibility. Experience with modern web technologies and agile methodologies. Quick learner with excellent collaboration skills.',
    linkedinUrl: 'https://linkedin.com/in/alexrivera',
  },
  {
    id: '5',
    name: 'Emily Watson',
    accuracy: 84,
    reason: 'Mid-level developer with solid React experience and growing expertise in backend technologies. Passionate about clean code and continuous learning. Good cultural fit based on values alignment.',
    cvUrl: '/cv/emily-watson.pdf',
  },
]

const mockHistory: SearchHistory[] = [
  { id: '1', query: 'Senior React Developer', timestamp: new Date(Date.now() - 3600000) },
  { id: '2', query: 'Full-stack Engineer with Node.js', timestamp: new Date(Date.now() - 7200000) },
  { id: '3', query: 'Frontend Lead with team experience', timestamp: new Date(Date.now() - 86400000) },
]

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

export function CandidateSearch() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [history] = useState<SearchHistory[]>(mockHistory)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSearching) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsSearching(true)

    // Simulate API call
    setTimeout(() => {
      const results = mockCandidates.slice(0, 5)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I found ${results.length} candidates matching your criteria. Here are the top matches ranked by relevance:`,
        candidates: results,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsSearching(false)
    }, 1500)
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 border-r border-sidebar-border bg-sidebar flex flex-col overflow-hidden`}
      >
        <div className="p-3 border-b border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-9 px-3 text-sm font-normal hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => {
              setMessages([])
              setInput('')
            }}
          >
            <Plus className="h-4 w-4" />
            New Search
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <div className="px-3 py-2 text-xs font-medium text-sidebar-muted-foreground uppercase tracking-wider">
              Recent Searches
            </div>
            {history.map((item) => (
              <button
                key={item.id}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-sidebar-accent text-sm text-sidebar-foreground transition-colors group"
                onClick={() => setInput(item.query)}
              >
                <div className="truncate font-medium group-hover:text-sidebar-accent-foreground">{item.query}</div>
                <div className="text-xs text-sidebar-muted-foreground mt-0.5">
                  {formatTimestamp(item.timestamp)}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 px-4 h-12">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-base font-semibold">Candidate Search</h1>
          </div>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="w-full max-w-3xl mx-auto">
            {messages.length === 0 && !isSearching && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-foreground">Find Your Perfect Candidates</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Describe the role you're hiring for, and I'll help you find the best candidates.
                </p>
                <div className="mt-8 grid grid-cols-1 gap-3 w-full max-w-md">
                  {[
                    'Senior React Developer with TypeScript experience',
                    'Full-stack Engineer with Node.js and React',
                    'Frontend Lead with team management experience',
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(suggestion)}
                      className="text-left px-4 py-3 rounded-lg border border-border bg-card hover:bg-accent text-sm transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="py-6 px-4 space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="flex gap-4">
                  {message.role === 'user' ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary-foreground">U</span>
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 pt-1 space-y-4">
                        <p className="text-foreground leading-relaxed">{message.content}</p>
                        {message.candidates && message.candidates.length > 0 && (
                          <div className="space-y-3">
                            {message.candidates.map((candidate, index) => (
                              <Card key={candidate.id} className="p-5 border-border/50 bg-card/50 hover:bg-card transition-colors">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded bg-muted">#{index + 1}</span>
                                      <h3 className="text-base font-semibold text-card-foreground">{candidate.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                      {candidate.linkedinUrl && (
                                        <a
                                          href={candidate.linkedinUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          LinkedIn
                                        </a>
                                      )}
                                      {candidate.cvUrl && (
                                        <a
                                          href={candidate.cvUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                                        >
                                          <FileText className="h-3 w-3" />
                                          View CV
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <div className="text-xl font-bold text-primary">{candidate.accuracy}%</div>
                                    <div className="text-xs text-muted-foreground">Match</div>
                                  </div>
                                </div>
                                <div className="pt-3 border-t border-border/50">
                                  <p className="text-sm text-muted-foreground leading-relaxed">{candidate.reason}</p>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}

              {isSearching && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm ml-2">Searching candidates...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="w-full max-w-3xl mx-auto p-4">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative">
                <Textarea
                  placeholder="Describe the role you're hiring for..."
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e as any)
                    }
                  }}
                  className="min-h-[60px] max-h-[200px] pr-12 resize-none text-base"
                  rows={1}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isSearching}
                  className="absolute right-2 bottom-2 h-8 w-8 rounded-md"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to search, Shift+Enter for new line
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
