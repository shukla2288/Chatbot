"use client"

import { useState, useEffect, useRef } from "react"
import { MessageList } from "@/components/message-list"
import { MessageComposer } from "@/components/message-composer"
import { Avatar } from "@/components/ui/avatar"
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Moon, Sun, X, ArrowLeft, Phone, Video, MoreHorizontal, Info, MessageCircle, Paperclip, Smile, Send, FileText } from "lucide-react"
import { useTheme } from "next-themes"
import { SuggestionPanel } from "@/components/suggestion-panel"
import type { Message as AIMsg } from "ai"

const customers = [
  { id: "1", name: "Luis Easton", company: "Github", preview: "Hey! I have a question...", avatar: "L" },
  { id: "2", name: "Ivan", company: "Nike", preview: "Hi there, I have a question...", avatar: "I" },
  { id: "3", name: "Lead from New York", company: "", preview: "Good morning, let me...", avatar: "L" },
  { id: "4", name: "Luis", company: "Small Crafts", preview: "Bug report", avatar: "L" },
  { id: "5", name: "Miracle", company: "Exemplary Bank", preview: "Hey there, I'm here to...", avatar: "M" },
]

const initialConversations = {
  "1": [
    { sender: "customer", content: "I bought a product from your store in November as a Christmas gift for a member of my family. However, it turns out they have something very similar already. I was hoping you'd be able to refund me, as it is un-opened.", timestamp: 0 },
  ],
  "2": [
    { sender: "customer", content: "I ordered shoes last week but received the wrong size. Can I exchange them?", timestamp: 0 },
  ],
  "3": [
    { sender: "customer", content: "Good morning, I'm interested in your premium plan. Can you tell me more about the features?", timestamp: 0 },
  ],
  "4": [
    { sender: "customer", content: "I found a bug in your booking API. The confirmation emails are not being sent.", timestamp: 0 },
  ],
  "5": [
    { sender: "customer", content: "Hey there, I'm here to discuss our partnership opportunities.", timestamp: 0 },
  ],
}

function loadConversations() {
  try {
    const stored = localStorage.getItem('conversations')
    return stored ? JSON.parse(stored) : initialConversations
  } catch {
    return initialConversations
  }
}

function saveConversations(conversations: any) {
  try {
    localStorage.setItem('conversations', JSON.stringify(conversations))
  } catch (error) {
    console.error('Failed to save conversations:', error)
  }
}

// Avatar color palette
const avatarColors = [
  "#4F8CFF", // blue
  "#34C759", // green
  "#FF9500", // orange
  "#AF52DE", // purple
  "#FF375F", // red
  "#FFD60A", // yellow
];

function getAvatarColor(name: string, idx: number) {
  return avatarColors[idx % avatarColors.length];
}

const adminAvatarUrl = "/admin-avatar.png"; // Use a real image path or placeholder

export default function ChatInterface() {
  // 1. All hooks at the top
  const [mounted, setMounted] = useState(false)
  const [loggedIn, setLoggedIn] = useState<null | 'admin' | { role: 'customer', id: string }>(null)
  const [conversations, setConversations] = useState<{ [key: string]: { sender: string; content: string; timestamp: number }[] }>(initialConversations)
  const [currentCustomerId, setCurrentCustomerId] = useState<string>("1")
  const [loginCustomerId, setLoginCustomerId] = useState<string>("1")
  const [inputValue, setInputValue] = useState("")
  const { theme, setTheme } = useTheme()
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [aiMessages, setAiMessages] = useState<AIMsg[]>([])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [adminInputValue, setAdminInputValue] = useState("");
  const [customerInputValue, setCustomerInputValue] = useState("");
  const [actionModalLoading, setActionModalLoading] = useState(false);
  const [actionModalResult, setActionModalResult] = useState("");

  // All useEffects here, always present, always in the same order
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setConversations(loadConversations()) }, [])
  useEffect(() => { saveConversations(conversations) }, [conversations])
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [conversations, loggedIn, currentCustomerId])
  useEffect(() => {
    setAiMessages([])
    setAiInput("")
    setAiLoading(false)
  }, [currentCustomerId])
  // AI suggestions effect: use only state/props in deps, compute local vars inside
  useEffect(() => {
    if (!loggedIn) return setAiSuggestions([])
    const isAdmin = loggedIn === 'admin'
    const customerId = isAdmin ? currentCustomerId : (loggedIn as any).id
    const messages = conversations[customerId] || []
    const selectedCustomer = customers.find(c => c.id === customerId)
    if (isAdmin && selectedCustomer && messages.length > 0) {
      const latestMsg = messages[messages.length - 1].content
      setAiSuggestions([])
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "Based on the following customer message, suggest 2 very short, helpful questions (max 8 words each) an admin might want to ask. Return ONLY a JSON array of 2 questions, e.g. [\"Q1\", \"Q2\"].",
            },
            { role: "user", content: latestMsg },
          ],
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setAiSuggestions([`AI error: ${data.error}`])
            return
          }
          try {
            const arr = JSON.parse(data.choices?.[0]?.message?.content || "[]")
            if (Array.isArray(arr)) setAiSuggestions(arr)
            else setAiSuggestions(["Could not parse AI suggestions."])
          } catch {
            setAiSuggestions(["Could not parse AI suggestions."])
          }
        })
        .catch((err) => setAiSuggestions([`Network error: ${err}`]))
    } else {
      setAiSuggestions([])
    }
  }, [loggedIn, currentCustomerId, conversations])

  // ThemeToggle function here (after hooks)
  const ThemeToggle = () => {
    if (!mounted) return null
    return (
      <Button variant="ghost" className="mt-2" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />} {theme === 'light' ? 'Dark' : 'Light'} Mode
      </Button>
    )
  }

  // 2. Early return for login page
  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-blue-200 font-sans" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 className="text-4xl font-extrabold text-purple-700 mb-2 drop-shadow-lg tracking-tight">Support Copilot</h1>
        <div className="text-lg text-purple-800 font-medium mb-8 tracking-wide">AI-powered customer support made easy</div>
        <div className="bg-white/90 dark:bg-[#23232a] p-8 rounded-3xl shadow-2xl w-96 flex flex-col gap-6 border border-purple-200 dark:border-gray-700 backdrop-blur-md">
          <h2 className="text-xl font-bold text-center text-gray-900 dark:text-gray-100">Login</h2>
          <Button className="w-full" onClick={() => setLoggedIn('admin')}>Login as Admin</Button>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700 dark:text-gray-300">Login as Customer:</label>
            <select
              className="border rounded px-2 py-1 bg-gray-50 dark:bg-[#23232a] text-gray-900 dark:text-gray-100"
              value={loginCustomerId}
              onChange={e => setLoginCustomerId(e.target.value)}
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Button className="w-full mt-2" onClick={() => setLoggedIn({ role: 'customer', id: loginCustomerId })}>
              Login as Customer
            </Button>
          </div>
          <ThemeToggle />
        </div>
      </div>
    )
  }

  // 3. Only now, after login, declare these variables ONCE
  const isAdmin = loggedIn === 'admin'
  const customerId = isAdmin ? currentCustomerId : (loggedIn as any).id
  const inboxList = isAdmin ? customers : customers.filter(c => c.id === customerId)
  const selectedCustomer = customers.find(c => c.id === customerId)
  const messages = conversations[customerId] || []

  const actionList = [
    { icon: <FileText className="w-4 h-4 mr-2" />, label: "Write a note", shortcut: "N" },
    { icon: <span className="w-4 h-4 mr-2">🏷️</span>, label: "Use macro", shortcut: "\\" },
    { icon: <span className="w-4 h-4 mr-2">😊</span>, label: "Summarize conversation", shortcut: "" },
    { icon: <span className="w-4 h-4 mr-2">📝</span>, label: "Create a back-office ticket", shortcut: "" },
    { icon: <span className="w-4 h-4 mr-2">🌙</span>, label: "Snooze", shortcut: "Z" },
    { icon: <span className="w-4 h-4 mr-2">📎</span>, label: "Upload attachment", shortcut: "A" },
    { icon: <span className="w-4 h-4 mr-2">🎬</span>, label: "Insert gif", shortcut: "G" },
  ]

  // Handle AI question submit
  const handleAISubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!aiInput.trim() || aiLoading) return
    setAiLoading(true)
    const userMsg: AIMsg = { id: Date.now().toString(), role: "user", content: aiInput }
    setAiMessages((prev) => [...prev, userMsg])
    setAiInput("")
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a helpful customer support assistant for an admin. Answer the admin's question in a friendly, clear, and policy-aware way. Use notes, steps, and formatting as needed." },
            ...aiMessages,
            userMsg,
          ],
        }),
      })
      const data = await res.json()
      if (data.error) {
        setAiMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: `AI error: ${data.error}` },
        ])
        return
      }
      const aiMsg: AIMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.choices?.[0]?.message?.content || "Sorry, I couldn't find an answer.",
      }
      setAiMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: `Network error: ${err}` },
      ])
    } finally {
      setAiLoading(false)
    }
  }

  // Add to composer handler for AI composer (suggested question)
  const handleAddToComposer = (content: string) => {
    setAiInput(content)
  }
  // Add to composer handler for inbox composer (AI answer)
  const handleAddToInboxComposer = (content: string) => {
    if (!isAdmin) return; // Guard: only allow for admin
    setAdminInputValue(content)
  }

  // Dummy data for open count, waiting, unread, etc.
  const openCount = customers.length
  const waitingLongest = true // just for dropdown UI
  const unreadIds = ["2"] // hardcoded: Ivan has unread
  const times: { [key: string]: string } = { "1": "45m", "2": "3min", "3": "40m", "4": "45m", "5": "45m" }

  // Send message
  const handleSend = (msg: string) => {
    if (!msg.trim()) return
    setConversations((prev) => {
      const updated = {
        ...prev,
        [customerId]: [
          ...(prev[customerId] || []),
          { sender: isAdmin ? 'admin' : 'customer', content: msg, timestamp: Date.now() },
        ],
      }
      saveConversations(updated)
      return updated
    })
    if (isAdmin) setAdminInputValue("");
    else setCustomerInputValue("");
  }

  // Handle close chat (admin: deselect, customer: logout)
  const handleClose = () => {
    if (isAdmin) setCurrentCustomerId("")
    else setLoggedIn(null)
  }

  // Handle logout/back to home
  const handleLogout = () => setLoggedIn(null)

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-screen bg-gray-50 dark:bg-[#18181b] font-sans" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Inbox (admin only) */}
      {isAdmin && (
        <div className="w-full md:w-72 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#23232a] flex flex-col h-full">
          {/* Inbox Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Back to Home">
                <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-300" />
              </Button>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{customers.length} Open</span>
          </div>
          {/* Inbox List */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {inboxList.map((c, idx) => (
              <div
                key={c.id}
                className={`group p-2.5 cursor-pointer rounded-xl mb-1 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-[#23232a]/70 ${customerId === c.id ? 'bg-gray-200 dark:bg-[#23232a]/80' : ''}`}
                onClick={() => setCurrentCustomerId(c.id)}
              >
                <div
                  className="h-9 w-9 flex items-center justify-center rounded-full text-white font-bold text-lg"
                  style={{ backgroundColor: getAvatarColor(c.name, idx) }}
                >
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-base text-gray-900 dark:text-gray-100">{c.name}</span>
                    {c.company && <span className="text-gray-400 text-xs ml-1">• {c.company}</span>}
                    <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{times[c.id]}</span>
                    {unreadIds.includes(c.id) && <span className="w-2 h-2 rounded-full bg-yellow-400 ml-1" title="unread" />}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{c.preview}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Chat */}
      <div className="flex-1 flex flex-col relative h-full w-full">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#23232a]">
          <div className="flex items-center gap-3">
            {selectedCustomer && (
              <>
                {!isAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => setLoggedIn(null)} title="Back to Home">
                    <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                  </Button>
                )}
                <h2 className="font-medium text-gray-900 dark:text-gray-100 text-base">{selectedCustomer.name}</h2>
                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => setShowActionModal(true)} title="Show actions">
                    <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Toggle theme">
                  {theme === 'light' ? <Moon className="h-5 w-5 text-gray-500" /> : <Sun className="h-5 w-5 text-yellow-400" />}
                </Button>
              </>
            )}
          </div>
          {isAdmin ? (
            <Button variant="outline" className="flex items-center ml-2" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          ) : null}
        </div>
        {/* Messages */}
        {selectedCustomer && (isAdmin ? currentCustomerId : customerId) ? (
          <>
            <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-[#18181b] flex flex-col">
              {/* Chat bubbles */}
              {messages.map((m, i) => (
                <div key={i} className={`flex items-end mb-4 ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  {m.sender !== 'admin' && (
                    <div
                      className="h-8 w-8 flex items-center justify-center rounded-full text-white font-bold text-base mr-2"
                      style={{ backgroundColor: getAvatarColor(selectedCustomer.name, 0) }}
                    >
                      {selectedCustomer.name[0]}
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm max-w-xs ${
                      m.sender === 'admin'
                        ? 'bg-blue-100 text-gray-900 dark:bg-blue-900/60 dark:text-gray-100'
                        : 'bg-gray-200 dark:bg-[#23232a] text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {m.content}
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      Seen • 1min
                    </div>
                  </div>
                  {m.sender === 'admin' && (
                    <span className="ml-1 flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-tr from-blue-400 via-purple-300 to-pink-300 shadow text-white text-xs font-bold border-2 border-white" title="Admin">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="9" fill="#a78bfa" />
                        <path d="M7 13c0-2 6-2 6-4s-6-2-6-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="10" cy="7" r="1.2" fill="#fff" />
                      </svg>
                    </span>
                  )}
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
            {/* Message composer */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#23232a] p-3 flex items-center gap-2">
              <Button variant="ghost" size="icon"><Smile className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon"><Paperclip className="h-5 w-5" /></Button>
              {isAdmin ? (
                <div className="flex-1 min-w-[420px] max-w-2xl">
                  <MessageComposer
                    value={adminInputValue}
                    composerContent={adminInputValue}
                    onChange={e => setAdminInputValue(e.target.value)}
                    onSubmit={e => { e.preventDefault(); handleSend(adminInputValue) }}
                    isLoading={aiLoading}
                  />
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); handleSend(customerInputValue) }} className="flex-1 flex items-center gap-2">
                  <input
                    className="flex-1 bg-transparent outline-none px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Chat"
                    value={customerInputValue}
                    onChange={e => setCustomerInputValue(e.target.value)}
                  />
                  <Button type="submit" variant="default" size="icon" disabled={!customerInputValue.trim()}><Send className="h-5 w-5" /></Button>
                </form>
              )}
              <span className="ml-2 text-xs text-gray-400">Use ⌘K for shortcuts</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg">
            {isAdmin ? "Select a conversation to start chatting" : "No conversation selected"}
          </div>
        )}
      </div>
      {/* AI Copilot Panel (right) */}
      {isAdmin && (
        <div className="w-full md:w-[420px] h-full border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#f8fafc] flex flex-col h-full">
          <SuggestionPanel
            suggestions={aiSuggestions}
            messages={aiMessages}
            onAddToComposer={handleAddToComposer}
            onAddToInboxComposer={handleAddToInboxComposer}
            isAdmin={true}
          />
          <form className="w-full flex items-center gap-2 px-4 md:px-8 pb-4" onSubmit={handleAISubmit}>
            <input
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Ask a question..."
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              disabled={aiLoading}
            />
            <Button type="submit" variant="default" size="icon" disabled={!aiInput.trim() || aiLoading}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      )}
      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/90 rounded-3xl shadow-2xl w-full max-w-lg mx-auto p-0 relative border border-purple-200 backdrop-blur-md animate-fade-in">
            <div className="flex items-center border-b px-8 py-5 bg-gradient-to-tr from-purple-100 via-pink-100 to-blue-100 rounded-t-3xl">
              <input
                className="flex-1 text-lg font-semibold px-2 py-2 border-none outline-none bg-transparent text-purple-800 tracking-wide"
                placeholder="Search actions"
                autoFocus
              />
              <Button variant="ghost" size="icon" onClick={() => setShowActionModal(false)}>
                <X className="h-5 w-5 text-purple-400" />
              </Button>
            </div>
            <div className="divide-y">
              {actionList.map((action, idx) => (
                <div
                  key={action.label}
                  className={`flex items-center px-8 py-4 cursor-pointer hover:bg-gradient-to-tr hover:from-purple-50 hover:to-pink-50 transition-all duration-150 ${idx === 2 ? 'bg-gradient-to-tr from-purple-50 to-pink-50' : ''} rounded-xl`}
                  onClick={async () => {
                    if (action.label === 'Summarize conversation') {
                      setActionModalLoading(true);
                      setActionModalResult("");
                      // Gather all messages for this conversation
                      const convo = conversations[customerId] || [];
                      const convoText = convo.map(m => `${m.sender}: ${m.content}`).join("\n");
                      // Call AI backend to summarize
                      try {
                        const res = await fetch("/api/chat", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            messages: [
                              { role: "system", content: "Summarize the following conversation between admin and customer in 3-4 sentences, focusing on the main points and next steps. Only return the summary, no explanation." },
                              { role: "user", content: convoText }
                            ]
                          })
                        });
                        const data = await res.json();
                        const summary = data.choices?.[0]?.message?.content || "AI error.";
                        setActionModalResult(summary);
                        // Insert summary as admin message
                        setConversations(prev => {
                          const updated = {
                            ...prev,
                            [customerId]: [
                              ...(prev[customerId] || []),
                              { sender: 'admin', content: summary, timestamp: Date.now() },
                            ],
                          };
                          saveConversations(updated);
                          return updated;
                        });
                      } catch (err) {
                        setActionModalResult("Network error.");
                      } finally {
                        setActionModalLoading(false);
                      }
                    }
                  }}
                >
                  {action.icon}
                  <span className="flex-1 text-base font-semibold text-purple-900">{action.label}</span>
                  {action.shortcut && <span className="text-xs text-purple-400 ml-2">{action.shortcut}</span>}
                </div>
              ))}
            </div>
            {/* Show loading or result for summarize */}
            {actionModalLoading && (
              <div className="flex items-center justify-center py-6 text-purple-700 font-semibold text-base">Summarizing conversation...</div>
            )}
            {actionModalResult && !actionModalLoading && (
              <div className="px-8 py-4 text-sm text-green-700 whitespace-pre-line bg-green-50 rounded-b-3xl">{actionModalResult}</div>
            )}
            <div className="flex items-center justify-between px-8 py-3 text-xs text-purple-400 border-t bg-gradient-to-tr from-purple-50 to-pink-50 rounded-b-3xl">
              <span>↑↓ to navigate</span>
              <span>⏎ to select</span>
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
