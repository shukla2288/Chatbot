"use client"

import { useState } from "react"
import { Avatar } from "@/components/ui/avatar"
import { AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronDown, Mail } from "lucide-react"

interface InboxProps {
  onSelectMessage: (message: { sender: string; content: string; time: string; id: number }) => void
}

export function Inbox({ onSelectMessage }: InboxProps) {
  const [filter, setFilter] = useState("Open")
  const [sort, setSort] = useState("Waiting longest")
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const inboxMessages = [
    {
      id: 1,
      sender: "Luis Easton",
      company: "Github",
      preview: "Hey! I have a question...",
      content:
        "I bought a product from your store in November as a Christmas gift for a member of my family. However, it turns out they have something very similar already. I was hoping you'd be able to refund me, as it is un-opened.",
      time: "45m",
      avatar: "L",
      unread: false,
    },
    {
      id: 2,
      sender: "Ivan",
      company: "Nike",
      preview: "Hi there, I have a question...",
      content: "I ordered shoes last week but received the wrong size. Can I exchange them?",
      time: "30m",
      avatar: "I",
      unread: true,
    },
    {
      id: 3,
      sender: "Lead from New York",
      company: "",
      preview: "Good morning, let me...",
      content: "Good morning, I'm interested in your premium plan. Can you tell me more about the features?",
      time: "40m",
      avatar: "L",
      unread: false,
    },
    {
      id: 4,
      sender: "Luis",
      company: "Small Crafts",
      preview: "Bug report",
      content: "I found a bug in your booking API. The confirmation emails are not being sent.",
      time: "45m",
      avatar: "L",
      unread: false,
      isSystem: true,
    },
    {
      id: 5,
      sender: "Miracle",
      company: "Exemplary Bank",
      preview: "Hey there, I'm here to...",
      content: "Hey there, I'm here to discuss our partnership opportunities.",
      time: "45m",
      avatar: "M",
      unread: false,
    },
  ]

  return (
    <div>
      <div className="p-2 flex items-center justify-between">
        <Button variant="ghost" className="text-sm font-medium">
          {filter} <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
        <Button variant="ghost" className="text-sm font-medium">
          {sort} <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <div className="divide-y">
        {inboxMessages.map((message) => (
          <div
            key={message.id}
            className={`p-3 hover:bg-gray-100 cursor-pointer rounded-lg mb-1 transition-colors flex items-center gap-3 ${selectedId === message.id ? 'bg-gray-200' : ''}`}
            onClick={() => {
              setSelectedId(message.id)
              onSelectMessage({
                sender: message.sender,
                content: message.content,
                time: message.time,
                id: message.id,
              })
            }}
          >
            <Avatar className="h-9 w-9 mr-2">
              <AvatarFallback>{message.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-base">{message.sender}</span>
                  {message.company && <span className="text-gray-400 text-xs ml-1">• {message.company}</span>}
                </div>
                <span className="text-xs text-gray-400">{message.time}</span>
              </div>
              <p className="text-xs text-gray-600 truncate mt-0.5">
                {message.isSystem ? <Mail className="inline h-3 w-3 mr-1" /> : null}
                {message.preview}
              </p>
            </div>
            {message.unread && <div className="h-2 w-2 bg-yellow-400 rounded-full mt-2 border-2 border-white shadow"></div>}
          </div>
        ))}
      </div>
    </div>
  )
}
