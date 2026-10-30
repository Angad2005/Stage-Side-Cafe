import React, { useState, useRef, useEffect } from 'react'
import { Send, Smile, ShieldAlert } from 'lucide-react'
import { ChatMessage } from '../../types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { cn } from '../../lib/utils'

interface ChatPanelProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
}

export function ChatPanel({ messages, onSendMessage }: ChatPanelProps) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSendMessage(text.trim())
    setText('')
  }

  return (
    <div className="flex flex-col h-full bg-[#11111a] border border-[#222230] rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#20202e] bg-[#141420] flex items-center justify-between">
        <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
          Community Table Chat
        </span>
        <span className="text-[10px] text-emerald-400 font-mono">Synced POV Sync Active</span>
      </div>

      {/* Messages scroll area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => {
          const isSystem = msg.messageType === 'system'
          return (
            <div
              key={msg.id}
              className={cn(
                'text-xs leading-relaxed',
                isSystem
                  ? 'p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-indigo-300'
                  : 'flex items-start gap-2.5'
              )}
            >
              {!isSystem && (
                <img
                  src={msg.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.username}`}
                  alt={msg.username}
                  className="w-6 h-6 rounded-full mt-0.5 border border-[#2e2e42]"
                />
              )}
              <div className="flex-1">
                {!isSystem && (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-white text-[11px]">{msg.username}</span>
                    <span className="text-[9px] text-[#636378] font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                <p className={isSystem ? 'font-mono text-[11px]' : 'text-[#dedee8]'}>{msg.message}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#20202e] bg-[#141420] flex items-center gap-2">
        <Input
          placeholder="Message your table..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-9 text-xs bg-[#0c0c14] border-[#252538] focus-visible:border-indigo-500"
        />
        <Button type="submit" size="sm" className="h-9 px-3 gap-1 bg-indigo-600 hover:bg-indigo-500">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  )
}
