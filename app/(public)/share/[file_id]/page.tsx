import { notFound } from "next/navigation"
import { getFileByAppSlug } from "@/db/applications"
import { getFileByHashId, getFileById } from "@/db/files"
import {
  IconExternalLink,
  IconInfoCircle,
  IconRocket,
  IconShoppingCart,
  IconUsers,
  IconWorld
} from "@tabler/icons-react"
import { DOMParser } from "xmldom"

import { updateHtml } from "@/lib/code-viewer"
import { REGEX_FILENAME } from "@/lib/preview"
import { getOgImageUrl } from "@/lib/utils/og"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import RemixButton from "@/components/remix/remix-button"

interface SharePageProps {
  params: {
    file_id: string
  }
  searchParams: {
    __show_banner: string | boolean | undefined
  }
}

export async function generateMetadata({
  params: { file_id }
}: SharePageProps) {
  const file = await getFileByIdOrHashIdOrAppSlug(file_id)

  if (!file) {
    return {
      title: "ChatLabs",
      description: "AI Chat Platform"
    }
  }

  return {
    title: file.name,
    description: file.description,
    openGraph: {
      title: file.name,
      images: [
        {
          url: getOgImageUrl(file.name, file.description),
          width: 1200,
          height: 630,
          alt: `${file.name} - ChatLabs`
        }
      ],
      twitter: {
        card: "summary_large_image",
        title: file.name,
        description: file.description,
        images: [getOgImageUrl(file.name, file.description)]
      }
    }
  }
}

function parseBoolean(value: string | boolean | undefined) {
  if (value === "true") {
    return true
  }
  if (value === "false") {
    return false
  }
  return !!value
}

async function getFileByIdOrHashIdOrAppSlug(idOrHashIdOrAppSlug: string) {
  try {
    const file = await getFileByHashId(idOrHashIdOrAppSlug)
    if (file) {
      return file
    }
  } catch (error) {
    try {
      const file = await getFileById(idOrHashIdOrAppSlug)
      if (file) {
        return file
      }
    } catch (error) {
      return await getFileByAppSlug(idOrHashIdOrAppSlug)
    }
  }
}

const SharePage = async ({
  params: { file_id },
  searchParams: { __show_banner = true }
}: SharePageProps) => {
  const showBanner = parseBoolean(__show_banner)
  let file
  try {
    file = await getFileByIdOrHashIdOrAppSlug(file_id)

    if (
      !file ||
      file.type != "html" ||
      file.sharing != "public" ||
      file.file_items.length == 0
    ) {
      return notFound()
    }
  } catch (error) {
    return notFound()
  }

  const updateHtmlFromString = (html: string) => {
    const cleanHtml = html.replace(REGEX_FILENAME, "")
    const parser = new DOMParser({
      errorHandler: {
        warning: () => {}
        // error: () => {},
        // fatalError: () => {}
      }
    })
    const doc = parser.parseFromString(cleanHtml, "text/html")
    return updateHtml(doc).toString()
  }

  return (
    <div className={"relative flex flex-col h-screen " + "w-screen"}>
      <iframe
        allow="clipboard-write"
        className={"w-full flex-1 border-none"}
        srcDoc={updateHtmlFromString(file.file_items[0].content)}
      />
      {showBanner && (
        <div
          className={
            "flex h-[60px] w-full items-center justify-center space-x-1 border-t text-sm"
          }
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <IconInfoCircle size={18} className={"mr-2"} stroke={1.5} />
                Built with ChatLabs
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <div className="grid gap-4">
                <h4 className="text-lg font-medium leading-none">
                  What is ChatLabs?
                </h4>
                <p className="text-muted-foreground text-sm">
                  ChatLabs is a platform for creating, sharing, and exploring
                  groundbreaking AI applications.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <FeatureCard
                    icon={<IconRocket size={24} />}
                    title="Build AI Apps"
                    description="Create custom AI applications without any coding skills"
                  />
                  <FeatureCard
                    icon={<IconShoppingCart size={24} />}
                    title="Build upon existing apps"
                    description="Find pre-built AI applications that you can modify to your needs"
                  />
                  <FeatureCard
                    icon={<IconUsers size={24} />}
                    title="Collaborate"
                    description="Work together with others on exciting AI projects"
                  />
                  <FeatureCard
                    icon={<IconWorld size={24} />}
                    title="Share & Deploy"
                    description="Easily deploy and share your AI creations with the world"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <RemixButton fileId={file_id} />
        </div>
      )}
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description
}) => (
  <div className="flex flex-col items-center rounded-lg bg-gray-100 p-3 text-center">
    <div className="mb-2 text-blue-500">{icon}</div>
    <h5 className="mb-1 text-sm font-medium">{title}</h5>
    <p className="text-xs text-gray-600">{description}</p>
  </div>
)

SharePage.layout = "none"

export default SharePage
