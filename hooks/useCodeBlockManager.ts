import { useState, useCallback, useEffect, useContext, useMemo } from "react"
import { ChatbotUIChatContext } from "@/context/chat"
import { CodeBlock } from "@/types/chat-message"
import { ChatMessage } from "@/types"
import { updateMessage } from "@/db/messages"
import { reconstructContentWithCodeBlocks } from "@/lib/messages"

function compareCodeBlocks(codeBlock1: CodeBlock | null, codeBlock2: CodeBlock | null): boolean {
    if (!codeBlock1 || !codeBlock2) {
        return false
    }
    return codeBlock1.messageId === codeBlock2.messageId
        && codeBlock1.sequenceNo === codeBlock2.sequenceNo
        && codeBlock1.code === codeBlock2.code
        && codeBlock1.language === codeBlock2.language
}

export function useCodeBlockManager(ignore?: ChatMessage[]) {
    const [selectedCodeBlock, setSelectedCodeBlock] = useState<CodeBlock | null>(null)
    const { isGenerating, chatMessages, setChatMessages } = useContext(ChatbotUIChatContext)
    const [isEditable, setIsEditable] = useState(false)

    const lastCodeBlock = useMemo(() => {
        if (chatMessages.length === 0) {
            return null
        }

        for (let i = chatMessages.length - 1; i >= 0; i--) {
            const message = chatMessages[i]
            const codeBlocks = message?.codeBlocks
            if (codeBlocks && codeBlocks.length > 0) {
                return codeBlocks[codeBlocks.length - 1]
            }
        }

        return null
    }, [chatMessages])

    const handleSelectCodeBlock = useCallback((codeBlock: CodeBlock | null) => {
        console.log("handleSelectCodeBlock", codeBlock, lastCodeBlock)
        setSelectedCodeBlock(codeBlock)
        setIsEditable(compareCodeBlocks(codeBlock, lastCodeBlock))
    }, [isEditable, lastCodeBlock, chatMessages])

    const handleCodeChange = useCallback((updatedCode: string, messageId: string, sequenceNo: number): void => {

        const updatedMessage = chatMessages.find(
            message => message.message?.id === messageId
        )

        const codeBlock = updatedMessage?.codeBlocks?.[sequenceNo]

        if (updatedMessage && updatedMessage.codeBlocks && codeBlock) {
            const updatedCodeBlock = {
                ...codeBlock,
                code: updatedCode
            }

            updatedMessage.codeBlocks[sequenceNo] = updatedCodeBlock

            setChatMessages(prev => {
                const updatedMessages = [...prev]
                const index = updatedMessages.findIndex(
                    message => message.message?.id === updatedMessage.message?.id
                )

                if (index !== -1) {
                    updatedMessages[index] = updatedMessage
                }
                return updatedMessages
            })

            handleSelectCodeBlock(updatedCodeBlock)
            updateMessage(updatedMessage.message!.id, {
                content: reconstructContentWithCodeBlocks(
                    updatedMessage.message?.content || "",
                    updatedMessage.codeBlocks
                )
            })
        }
    }, [chatMessages, setChatMessages])

    useEffect(() => {
        if (chatMessages.length === 0) {
            return
        }

        if (!isGenerating) {
            return
        }

        if (!compareCodeBlocks(selectedCodeBlock, lastCodeBlock)) {
            setTimeout(() => {
                handleSelectCodeBlock(lastCodeBlock)
            }, 10)
        }

    }, [isGenerating, chatMessages, selectedCodeBlock])

    return {
        selectedCodeBlock,
        handleSelectCodeBlock,
        handleCodeChange,
        isEditable,
    }
}
