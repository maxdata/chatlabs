import { useContext, useEffect, useState } from "react"
import { ChatbotUIChatContext } from "@/context/chat"
import { ChatbotUIContext } from "@/context/context"
import { createDocXFile, createFile } from "@/db/files"
import mammoth from "mammoth"
import { toast } from "sonner"

import { guessFileExtensionByContentType } from "@/lib/content-type"
import { LLM_LIST } from "@/lib/models/llm/llm-list"

export const ACCEPTED_FILE_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/json",
  "text/markdown",
  "application/pdf",
  "text/plain"
].join(",")

export const useSelectFileHandler = ({
  imagesAllowed
}: {
  imagesAllowed?: boolean
}) => {
  const {
    selectedWorkspace,
    profile,
    setNewMessageImages,
    setNewMessageFiles,
    setShowFilesDisplay,
    setFiles,
    setUseRetrieval
  } = useContext(ChatbotUIContext)

  const [filesToAccept, setFilesToAccept] = useState(ACCEPTED_FILE_TYPES)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  useEffect(() => {
    handleFilesToAccept()
  }, [imagesAllowed])

  const handleFilesToAccept = () => {
    setFilesToAccept(
      imagesAllowed ? `${ACCEPTED_FILE_TYPES},image/*` : ACCEPTED_FILE_TYPES
    )
  }

  const handleSelectDeviceFile = async (file: File) => {
    if (!profile || !selectedWorkspace) return
    setIsUploading(true)
    setShowFilesDisplay(true)
    setUseRetrieval(true)

    if (file) {
      let simplifiedFileType = guessFileExtensionByContentType(file.type)

      let reader = new FileReader()

      if (file.type.includes("image")) {
        reader.readAsDataURL(file)
      } else if (ACCEPTED_FILE_TYPES.split(",").includes(file.type)) {
        if (simplifiedFileType.includes("vnd.adobe.pdf")) {
          simplifiedFileType = "pdf"
        } else if (
          simplifiedFileType.includes(
            "vnd.openxmlformats-officedocument.wordprocessingml.document"
          )
        ) {
          simplifiedFileType = "docx"
        }

        setNewMessageFiles(prev => [
          ...prev,
          {
            id: "loading",
            name: file.name,
            type: simplifiedFileType,
            file: file
          }
        ])

        // Handle docx files
        if (
          file.type.includes(
            "vnd.openxmlformats-officedocument.wordprocessingml.document"
          )
        ) {
          const arrayBuffer = await file.arrayBuffer()
          const result = await mammoth.extractRawText({
            arrayBuffer
          })

          const createdFile = await createDocXFile(
            result.value,
            file,
            {
              user_id: profile.user_id,
              description: "",
              file_path: "",
              name: file.name,
              size: file.size,
              tokens: 0,
              type: simplifiedFileType
            },
            selectedWorkspace.id,
            "openai"
          )

          setFiles(prev => [...prev, createdFile])

          setNewMessageFiles(prev =>
            prev.map(item =>
              item.id === "loading"
                ? {
                    id: createdFile.id,
                    name: createdFile.name,
                    type: createdFile.type,
                    file: file
                  }
                : item
            )
          )

          reader.onloadend = null

          return
        } else {
          // Use readAsArrayBuffer for PDFs and readAsText for other types
          file.type.includes("pdf")
            ? reader.readAsArrayBuffer(file)
            : reader.readAsText(file)
        }
      } else {
        throw new Error("Unsupported file type")
      }

      reader.onloadend = async function () {
        try {
          if (file.type.includes("image")) {
            // Create a temp url for the image file
            const imageUrl = URL.createObjectURL(file)

            // This is a temporary image for display purposes in the chat input
            setNewMessageImages(prev => [
              ...prev,
              {
                messageId: "temp",
                path: "",
                base64: reader.result, // base64 image
                url: imageUrl,
                file
              }
            ])
          } else {
            const createdFile = await createFile(
              file,
              {
                user_id: profile.user_id,
                description: "",
                file_path: "",
                name: file.name,
                size: file.size,
                tokens: 0,
                type: simplifiedFileType
              },
              selectedWorkspace.id,
              "openai"
            )

            setFiles(prev => [...prev, createdFile])

            setNewMessageFiles(prev =>
              prev.map(item =>
                item.id === "loading"
                  ? {
                      id: createdFile.id,
                      name: createdFile.name,
                      type: createdFile.type,
                      file: file
                    }
                  : item
              )
            )
          }
        } catch (error) {
          toast.error("Failed to upload.")

          setNewMessageImages(prev =>
            prev.filter(img => img.messageId !== "temp")
          )
          setNewMessageFiles(prev => prev.filter(file => file.id !== "loading"))
        } finally {
          setIsUploading(false)
        }
      }
    }
  }

  return {
    handleSelectDeviceFile,
    filesToAccept,
    isUploading
  }
}
