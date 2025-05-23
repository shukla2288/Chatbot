import type { Message } from "ai"
import { Avatar } from "@/components/ui/avatar"
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useRef, useState } from "react"

interface MessageListProps {
  messages: Message[]
  initialMessage?: string
}

const AI_ACTIONS = [
  "Rephrase",
  "My tone of voice",
  "More friendly",
  "More formal",
  "Fix grammar & spelling",
  "Translate..."
]

async function aiProcess(action: string, text: string) {
  // Call backend API for AI processing
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: `You are an expert AI assistant. ${action} the following text. Only return the result, no explanation.` },
        { role: "user", content: text }
      ]
    })
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || "AI error."
}

export function MessageList({ messages, initialMessage }: MessageListProps) {
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 })
  const [selectedText, setSelectedText] = useState("")
  const [modal, setModal] = useState<{action: string, text: string, result?: string, loading?: boolean} | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setShowToolbar(false)
        setSelectedText("")
        return
      }
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      // Robust check: is selection inside container?
      function isNodeInContainer(node: Node | null): boolean {
        while (node) {
          if (node === containerRef.current) return true
          node = node.parentNode
        }
        return false
      }
      if (
        rect &&
        selection.toString().trim().length > 0 &&
        isNodeInContainer(selection.anchorNode) &&
        isNodeInContainer(selection.focusNode)
      ) {
        setToolbarPos({
          top: rect.top + window.scrollY - 48,
          left: rect.left + window.scrollX + rect.width / 2
        })
        setShowToolbar(true)
        setSelectedText(selection.toString())
      } else {
        setShowToolbar(false)
        setSelectedText("")
      }
    }
    document.addEventListener("selectionchange", handleSelection)
    document.addEventListener("mouseup", handleSelection)
    return () => {
      document.removeEventListener("selectionchange", handleSelection)
      document.removeEventListener("mouseup", handleSelection)
    }
  }, [])

  // Handle AI action click
  const handleAIAction = async (action: string) => {
    setModal({ action, text: selectedText, loading: true })
    const result = await aiProcess(action, selectedText)
    setModal({ action, text: selectedText, result, loading: false })
  }

  return (
    <div className="space-y-4 relative" ref={containerRef}>
      {/* Floating AI Toolbar */}
      {showToolbar && (
        <div
          style={{ position: "absolute", top: toolbarPos.top, left: toolbarPos.left, transform: "translate(-50%, -100%)", zIndex: 50 }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col min-w-[180px] max-w-[220px] p-1"
        >
          <div className="flex items-center gap-2 px-2 py-1 border-b border-gray-100">
            <span className="bg-blue-100 text-blue-700 rounded p-1 text-xs font-semibold">AI</span>
            <span className="text-xs text-gray-500">Options</span>
          </div>
          {AI_ACTIONS.map((action) => (
            <button
              key={action}
              className="text-left px-3 py-2 text-sm hover:bg-gray-100 w-full"
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleAIAction(action)}
            >
              {action}
            </button>
          ))}
        </div>
      )}
      {/* Modal for AI action result */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="mb-2 text-base font-semibold">{modal.action} (AI)</div>
            <div className="mb-4 text-sm text-gray-700 whitespace-pre-line">{modal.text}</div>
            {modal.loading ? (
              <div className="text-blue-600 text-sm">Processing...</div>
            ) : (
              <div className="mb-4 text-sm text-green-700 whitespace-pre-line bg-green-50 p-2 rounded">{modal.result}</div>
            )}
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setModal(null)}>Close</button>
          </div>
        </div>
      )}
      {initialMessage && (
        <div className="flex items-start gap-3 text-sm">
          <Avatar className="h-8 w-8 mt-1">
            <AvatarFallback>L</AvatarFallback>
          </Avatar>
          <div className="bg-white p-3 rounded-lg max-w-[80%]">
            <p>{initialMessage}</p>
            <div className="text-xs text-gray-500 mt-1">1min</div>
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 text-sm ${message.role === "user" ? "justify-end" : ""}`}
            >
              {message.role !== "user" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`p-3 rounded-lg max-w-[80%] ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-blue-100"
                }`}
              >
                {/* If message contains [image:URL], render the image */}
                {message.content.startsWith('[image:') && message.content.endsWith(']') ? (
                  <img
                    src={message.content.slice(7, -1)}
                    alt="attachment"
                    className="rounded-lg max-w-xs max-h-48 mb-2 border border-gray-200 shadow"
                  />
                ) : (
                  <p>{message.content}</p>
                )}
                <div className={`text-xs mt-1 ${message.role === "user" ? "text-blue-200" : "text-gray-500"}`}>
                  {message.role === "user" ? "Seen" : ""} • 1min
                </div>
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
