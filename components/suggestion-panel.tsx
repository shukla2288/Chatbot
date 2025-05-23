"use client"

import type { Message } from "ai"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { useState } from "react"

interface SuggestionPanelProps {
  suggestions: string[]
  messages: Message[]
  onAddToComposer: (content: string) => void
  onAddToInboxComposer: (content: string) => void
  isAdmin?: boolean
}

export function SuggestionPanel({ suggestions, messages, onAddToComposer, onAddToInboxComposer, isAdmin = false }: SuggestionPanelProps) {
  // Get the last assistant message to display
  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant")
  const [showFullAnswer, setShowFullAnswer] = useState(false)

  // Helper to shorten answer
  let answerContent = lastAssistantMessage?.content || ""
  const maxPreviewChars = 200
  const maxShowMoreChars = 400
  const isLong = answerContent.length > maxPreviewChars
  const previewAnswer = isLong ? answerContent.slice(0, maxPreviewChars) + "..." : answerContent
  const showMoreAnswer = answerContent.length > maxShowMoreChars ? answerContent.slice(0, maxShowMoreChars) + "..." : answerContent

  return (
    <div
      className="border-l border-gray-200 font-sans relative overflow-hidden shadow-2xl rounded-l-2xl flex flex-col w-full h-full"
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        background: 'linear-gradient(135deg, #e0d7fa 0%, #f7d6e6 100%)',
        borderLeft: '2px solid #e5e3f7',
        boxShadow: '0 8px 32px 0 rgba(80, 60, 180, 0.18), 0 1.5px 0 0 #e5e3f7',
        position: 'relative',
      }}
    >
      {/* Glassmorphism overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'rgba(255,255,255,0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      />
      {/* Animated gradient overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18) 0%, rgba(247,214,230,0.10) 60%, transparent 100%)',
          animation: 'gradientMove 8s ease-in-out infinite alternate',
        }}
      />
      {/* Watermark icon and text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 select-none">
        <svg width="120" height="120" viewBox="0 0 48 48" fill="none" className="mb-2" style={{opacity:0.10}}>
          <circle cx="24" cy="24" r="24" fill="#a78bfa" />
          <path d="M16 32c0-4 8-4 8-8s-8-4-8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="24" cy="20" r="2" fill="#fff" />
        </svg>
        <span style={{
          fontSize: '3.5rem',
          fontWeight: 900,
          color: 'rgba(120, 80, 220, 0.10)',
          transform: 'rotate(-24deg)',
          letterSpacing: '0.1em',
          userSelect: 'none',
          textShadow: '0 2px 16px rgba(120,80,220,0.10)',
        }}>AI Copilot</span>
      </div>
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>
      <div className="p-2 border-b border-gray-200 flex items-center space-x-2 z-10 bg-white/70 backdrop-blur-md rounded-t-xl min-h-[40px]">
        <Button variant="ghost" className="px-2 py-1 h-auto text-base font-bold bg-gradient-to-tr from-purple-200 via-pink-100 to-blue-100 text-purple-700 shadow-sm">AI Copilot</Button>
        <Button variant="ghost" className="px-2 py-1 h-auto text-sm font-medium text-gray-500">Details</Button>
      </div>
      <div className="flex-1 px-2 pt-1 pb-2 flex flex-col gap-2 justify-between z-10 overflow-y-auto h-full" style={{minHeight:0}}>
        {/* AI Answer Section */}
        {lastAssistantMessage && (
          <Card
            className="p-4 mb-2 rounded-2xl shadow-lg w-full border-0 relative bg-white/80 backdrop-blur-md"
            style={{
              background: 'linear-gradient(135deg, #f7f6fd 0%, #f7d6e6 100%)',
              boxShadow: '0 2px 16px 0 rgba(80, 60, 180, 0.10)',
              border: '1.5px solid #e5e3f7',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '15px',
              color: '#2d2250',
            }}
          >
            <div className="text-sm whitespace-pre-line leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', color: '#2d2250' }}>
              {showFullAnswer ? showMoreAnswer : previewAnswer}
              {answerContent && (
                <sup className="ml-1 text-xs bg-blue-100 text-blue-800 rounded-full px-1.5 py-0.5 align-super font-bold">1</sup>
              )}
              {isLong && !showFullAnswer && (
                <Button variant="link" className="ml-2 p-0 text-xs text-blue-700" onClick={() => setShowFullAnswer(true)}>
                  Show more
                </Button>
              )}
            </div>
            {isAdmin ? (
              <Button
                variant="outline"
                className="w-full mt-2 bg-white border-blue-200 rounded-lg shadow-sm text-base font-medium hover:shadow-lg hover:border-purple-300 transition-all duration-200"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                onClick={() => isAdmin && onAddToInboxComposer(answerContent)}
              >
                <span className="mr-2">✏️</span> Add to composer
              </Button>
            ) : null}
          </Card>
        )}
        {/* Empty State */}
        {suggestions.length === 0 && !lastAssistantMessage && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in py-1">
            <div className="bg-gradient-to-tr from-purple-200 via-pink-200 to-blue-200 p-3 rounded-full mb-1 shadow-lg border-2 border-white">
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" fill="#e0d7fa" />
                <path d="M16 32c0-4 8-4 8-8s-8-4-8-8" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="24" cy="20" r="2" fill="#a78bfa" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-purple-900 mb-1 tracking-tight">AI Copilot</h3>
            <div className="text-xs font-medium text-purple-700 mb-1 tracking-wide">Your smart support assistant</div>
            <p className="text-xs text-gray-500 mt-1">Ask me anything about this conversation.<br/>I can suggest replies, summarize, and more!</p>
          </div>
        )}
        {/* Suggested Questions Section at the bottom, show max 3, with More button if needed */}
        {suggestions.length > 0 && (
          <div className="mt-auto pt-1">
            <div className="text-xs font-semibold text-purple-700 mb-1 uppercase tracking-wide">Suggested Questions</div>
            <div className="flex flex-row flex-wrap gap-2 w-full">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="rounded-full px-3 py-2 text-xs font-semibold bg-white/80 hover:bg-gradient-to-tr hover:from-purple-100 hover:to-pink-100 border-purple-200 text-purple-800 shadow transition-all duration-200 whitespace-normal break-words min-w-[120px] max-w-[200px] text-left leading-snug"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', lineHeight: '1.3', borderRadius: '999px', wordBreak: 'break-word', whiteSpace: 'normal' }}
                  onClick={() => onAddToComposer(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
              {suggestions.length > 3 && (
                <Button
                  variant="ghost"
                  className="rounded-full px-3 py-2 text-xs font-medium text-blue-700 bg-white/80 hover:bg-white border-gray-300 shadow-none min-w-[80px]"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', lineHeight: '1.3', borderRadius: '999px' }}
                  onClick={() => alert('More suggestions coming soon!')}
                >
                  More...
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
