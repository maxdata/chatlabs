"use client"

import {
  createContext,
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState
} from "react"
import { userInputAtom } from "@/atoms/chatAtoms"
import { Tables } from "@/supabase/types"
import { ChatMessage, ChatSettings } from "@/types"

import { MessageHtmlElement } from "@/types/html"

interface ChatbotUIChatContext {
  // PASSIVE CHAT STORE
  chatMessages: ChatMessage[]
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>
  chatSettings: ChatSettings | null
  setChatSettings: Dispatch<SetStateAction<ChatSettings>>
  selectedChat: Tables<"chats"> | null
  setSelectedChat: Dispatch<SetStateAction<Tables<"chats"> | null>>
  chatFileItems: Tables<"file_items">[]
  setChatFileItems: Dispatch<SetStateAction<Tables<"file_items">[]>>

  // ACTIVE CHAT STORE
  abortController: AbortController | null
  setAbortController: Dispatch<SetStateAction<AbortController | null>>
  firstTokenReceived: boolean
  setFirstTokenReceived: Dispatch<SetStateAction<boolean>>
  isGenerating: boolean
  setIsGenerating: Dispatch<SetStateAction<boolean>>

  requestTokensTotal: number
  setRequestTokensTotal: Dispatch<SetStateAction<number>>
  responseTimeToFirstToken: number
  setResponseTimeToFirstToken: Dispatch<SetStateAction<number>>
  responseTimeTotal: number
  setResponseTimeTotal: Dispatch<SetStateAction<number>>
  responseTokensTotal: number
  setResponseTokensTotal: Dispatch<SetStateAction<number>>

  selectedTools: Tables<"tools">[]
  setSelectedTools: Dispatch<SetStateAction<Tables<"tools">[]>>

  selectedHtmlElements: MessageHtmlElement[]
  setSelectedHtmlElements: Dispatch<SetStateAction<MessageHtmlElement[]>>
}

export const ChatbotUIChatContext = createContext<ChatbotUIChatContext>({
  // PASSIVE CHAT STORE
  chatMessages: [],
  setChatMessages: () => {},
  chatSettings: null,
  setChatSettings: () => {},
  selectedChat: null,
  setSelectedChat: () => {},
  chatFileItems: [],
  setChatFileItems: () => {},

  // ACTIVE CHAT STORE
  isGenerating: false,
  setIsGenerating: () => {},
  firstTokenReceived: false,
  setFirstTokenReceived: () => {},
  abortController: null,
  setAbortController: () => {},

  requestTokensTotal: 0,
  setRequestTokensTotal: () => {},
  responseTimeToFirstToken: 0,
  setResponseTimeToFirstToken: () => {},
  responseTimeTotal: 0,
  setResponseTimeTotal: () => {},
  responseTokensTotal: 0,
  setResponseTokensTotal: () => {},

  selectedTools: [],
  setSelectedTools: () => {},

  selectedHtmlElements: [],
  setSelectedHtmlElements: () => {}
})

interface ChatbotUIChatProviderProps {
  id: string
  children: React.ReactNode
}

export const ChatbotUIChatProvider: FC<ChatbotUIChatProviderProps> = ({
  id,
  children
}) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatSettings, setChatSettings] = useState<ChatSettings>(() => {
    return {
      model: "gpt-4o-mini",
      prompt: "You are a helpful AI assistant.",
      temperature: 0.5,
      contextLength: 4000,
      includeProfileContext: true,
      includeWorkspaceInstructions: true,
      embeddingsProvider: "openai"
    }
  })

  const [selectedChat, setSelectedChat] = useState<Tables<"chats"> | null>(null)
  const [chatFileItems, setChatFileItems] = useState<Tables<"file_items">[]>([])

  // ACTIVE CHAT STORE
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [firstTokenReceived, setFirstTokenReceived] = useState<boolean>(false)
  const [abortController, setAbortController] =
    useState<AbortController | null>(null)

  const [responseTimeToFirstToken, setResponseTimeToFirstToken] =
    useState<number>(0)
  const [responseTimeTotal, setResponseTimeTotal] = useState<number>(0)
  const [responseTokensTotal, setResponseTokensTotal] = useState<number>(0)
  const [requestTokensTotal, setRequestTokensTotal] = useState<number>(0)

  const [selectedTools, setSelectedTools] = useState<Tables<"tools">[]>([])

  const [selectedHtmlElements, setSelectedHtmlElements] = useState<
    MessageHtmlElement[]
  >([])

  return (
    <ChatbotUIChatContext.Provider
      value={{
        // PASSIVE CHAT STORE
        chatMessages,
        setChatMessages,
        chatSettings,
        setChatSettings,
        selectedChat,
        setSelectedChat,
        chatFileItems,
        setChatFileItems,

        // ACTIVE CHAT STORE
        isGenerating,
        setIsGenerating,
        firstTokenReceived,
        setFirstTokenReceived,
        abortController,
        setAbortController,

        responseTimeToFirstToken,
        setResponseTimeToFirstToken,
        responseTimeTotal,
        setResponseTimeTotal,
        responseTokensTotal,
        setResponseTokensTotal,
        requestTokensTotal,
        setRequestTokensTotal,

        selectedTools,
        setSelectedTools,

        selectedHtmlElements,
        setSelectedHtmlElements
      }}
    >
      {children}
    </ChatbotUIChatContext.Provider>
  )
}
