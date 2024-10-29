"use client"

import { FC, useState } from "react"
import { AuthProvider, useAuth } from "@/context/auth"
import { IconArrowFork } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

interface RemixButtonProps {
  fileId: string
}

function InnerRemixButton({ fileId }: RemixButtonProps) {
  const [isRemixing, setIsRemixing] = useState(false)
  const { user } = useAuth()

  const getBaseUrl = () => {
    if (window.location.href.indexOf("toolzflow.app") !== -1) {
      return "https://labs.writingmate.ai"
    }
    return window.location.href
  }

  const handleRemix = async () => {
    window.open(
      new URL(`/chat?remix=${fileId}`, getBaseUrl()).toString(),
      "_blank"
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={"default"}
        loading={isRemixing}
        onClick={handleRemix}
        size={"sm"}
        disabled={isRemixing}
        title="Create your own version of this chat"
      >
        <IconArrowFork size={18} className={"mr-2"} stroke={1.5} />
        {isRemixing ? "Creating..." : "Make your version"}
      </Button>
    </div>
  )
}

const RemixButton: FC<RemixButtonProps> = ({ fileId }) => {
  return (
    <AuthProvider>
      <InnerRemixButton fileId={fileId} />
    </AuthProvider>
  )
}

export default RemixButton
