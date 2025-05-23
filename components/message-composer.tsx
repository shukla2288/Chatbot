"use client"

import type React from "react"

import { type FormEvent, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Smile, Send, Paperclip, X } from "lucide-react"
import { createPortal } from "react-dom"

interface MessageComposerProps {
  value: string
  composerContent: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
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

export function MessageComposer({ value, composerContent, onChange, onSubmit, isLoading }: MessageComposerProps) {
  const [inputValue, setInputValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 })
  const [selectedText, setSelectedText] = useState("")
  const [modal, setModal] = useState<{action: string, text: string, result?: string, loading?: boolean} | null>(null)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiProcessing, setAiProcessing] = useState(false)
  const [aiResult, setAiResult] = useState("")
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (composerContent) {
      setInputValue(composerContent)
      if (textareaRef.current) {
        textareaRef.current.value = composerContent
        textareaRef.current.focus()
      }
    }
  }, [composerContent])

  const handleLocalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    onChange(e)
  }

  // Selection toolbar logic
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    let lastSelection = { start: textarea.selectionStart, end: textarea.selectionEnd }
    let pollInterval: any = null
    const updateToolbar = () => {
      if (document.activeElement !== textarea) {
        setShowToolbar(false)
        setSelectedText("")
        return
      }
      const selectionStart = textarea.selectionStart
      const selectionEnd = textarea.selectionEnd
      if (selectionStart === selectionEnd) {
        setShowToolbar(false)
        setSelectedText("")
        return
      }
      const rect = textarea.getBoundingClientRect()
      const toolbarHeight = 48 // px
      const extraOffset = 32 // px, move further up
      setToolbarPos({
        top: rect.top + window.scrollY - toolbarHeight - extraOffset,
        left: rect.left + window.scrollX + rect.width / 2
      })
      setShowToolbar(true)
      setSelectedText(textarea.value.substring(selectionStart, selectionEnd))
      lastSelection = { start: selectionStart, end: selectionEnd }
    }
    const handleBlur = () => {
      setShowToolbar(false)
      setSelectedText("")
      if (pollInterval) clearInterval(pollInterval)
    }
    const handleFocus = () => {
      updateToolbar()
      pollInterval = setInterval(() => {
        if (document.activeElement !== textarea) return
        if (textarea.selectionStart !== lastSelection.start || textarea.selectionEnd !== lastSelection.end) {
          updateToolbar()
        }
      }, 120)
    }
    textarea.addEventListener("select", updateToolbar)
    textarea.addEventListener("keyup", updateToolbar)
    textarea.addEventListener("mouseup", updateToolbar)
    textarea.addEventListener("input", updateToolbar)
    textarea.addEventListener("focus", handleFocus)
    textarea.addEventListener("blur", handleBlur)
    textarea.addEventListener("keydown", (e) => {
      // Always allow backspace/delete
      // No-op, just ensure no handler blocks it
    })
    return () => {
      textarea.removeEventListener("select", updateToolbar)
      textarea.removeEventListener("keyup", updateToolbar)
      textarea.removeEventListener("mouseup", updateToolbar)
      textarea.removeEventListener("input", updateToolbar)
      textarea.removeEventListener("focus", handleFocus)
      textarea.removeEventListener("blur", handleBlur)
      textarea.removeEventListener("keydown", () => {})
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [])

  const handleAIAction = async (action: string) => {
    setModal({ action, text: selectedText, loading: true })
    setAiProcessing(true)
    const result = await aiProcess(action, selectedText)
    setAiResult(result)
    setModal({ action, text: selectedText, result, loading: false })
    setAiProcessing(false)
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      {/* Floating AI Toolbar for composer (portal) */}
      {showToolbar && typeof window !== 'undefined' && createPortal(
        <div
          ref={toolbarRef}
          className="fixed z-50 bg-gradient-to-tr from-purple-50 via-pink-50 to-blue-50 border border-purple-200 rounded-2xl shadow-2xl flex flex-col min-w-[180px] p-2 animate-fade-in"
          style={{
            bottom: '96px', // just above the composer
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: '0 8px 32px 0 rgba(120, 80, 220, 0.12)',
            transition: 'transform 0.18s cubic-bezier(.4,2,.6,1), opacity 0.18s',
            opacity: 0.98,
          }}
        >
          {AI_ACTIONS.map((action) => (
            <button
              key={action}
              className="text-left px-4 py-2 text-base font-semibold rounded-xl transition-all duration-150 hover:bg-gradient-to-tr hover:from-purple-100 hover:to-pink-100 hover:text-purple-800 w-full mb-1 last:mb-0 shadow-sm"
              style={{fontFamily:'Inter, system-ui, sans-serif'}}
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleAIAction(action)}
            >
              {action}
            </button>
          ))}
        </div>,
        document.body
      )}
      {/* Modal for AI action result */}
      {modal && typeof window !== 'undefined' && createPortal(
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
        </div>,
        document.body
      )}
      <div className="flex items-center border rounded-lg overflow-hidden bg-white">
        <textarea
          ref={textareaRef}
          className="flex-1 p-3 resize-none focus:outline-none h-12 max-h-32"
          placeholder="Type a message..."
          value={inputValue}
          onChange={handleLocalChange}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              if (inputValue.trim()) {
                onSubmit(e as unknown as FormEvent<HTMLFormElement>)
              }
            }
          }}
        />
        <div className="flex items-center px-3 space-x-2">
          <Button type="button" variant="ghost" size="icon" className="text-gray-500">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-gray-500">
            <Smile className="h-5 w-5" />
          </Button>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            disabled={!inputValue.trim() || isLoading}
            className="text-gray-500"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1 ml-2">Use ⌘K for shortcuts</div>
    </form>
  )
}
