"use client"

import { ChatbotUIContext } from "@/context/context"
import { getProfileByUserId, updateProfile } from "@/db/profile"
import { getWorkspacesByUserId } from "@/db/workspaces"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables, TablesInsert, TablesUpdate } from "@/supabase/types"
import { useRouter } from "nextjs-toploader/app"
import { ReactNode, useContext, useEffect, useState } from "react"
import { FinishStep } from "@/components/setup/finish-step"
import { ProfileStep } from "@/components/setup/profile-step"
import { StepContainer } from "@/components/setup/step-container"
import Plans from "@/components/upgrade/plans"
import { useAuth } from "@/context/auth"
import { upsertUserQuestion } from "@/db/user_questions"
import { motion, AnimatePresence } from "framer-motion"
import { useFeatureFlag } from "@/lib/amplitude" // Add this import
import { toast } from "sonner"

export default function SetupPage() {
  const {
    profile,
    setProfile,
    setWorkspaces,
    setSelectedWorkspace,
    setEnvKeyMap,
    setAvailableHostedModels,
    setAvailableOpenRouterModels
  } = useContext(ChatbotUIContext)

  const router = useRouter()

  const { user } = useAuth()

  const [loading, setLoading] = useState(true)

  // Use the Amplitude feature flags
  const { flagValue: enableProfileStep } = useFeatureFlag(
    "enable_profile_step",
    false
  )
  const {
    flagValue: bypassOnboardingRedirect,
    loading: bypassOnboardingRedirectLoading
  } = useFeatureFlag("bypass_onboarding_redirect", false)

  const [currentStep, setCurrentStep] = useState(1)

  // Profile Step
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState(profile?.username || "")
  const [usernameAvailable, setUsernameAvailable] = useState(true)

  // API Step
  const [useAzureOpenai, setUseAzureOpenai] = useState(false)
  const [openaiAPIKey, setOpenaiAPIKey] = useState("")
  const [openaiOrgID, setOpenaiOrgID] = useState("")
  const [azureOpenaiAPIKey, setAzureOpenaiAPIKey] = useState("")
  const [azureOpenaiEndpoint, setAzureOpenaiEndpoint] = useState("")
  const [azureOpenai35TurboID, setAzureOpenai35TurboID] = useState("")
  const [azureOpenai45TurboID, setAzureOpenai45TurboID] = useState("")
  const [azureOpenai45VisionID, setAzureOpenai45VisionID] = useState("")
  const [azureOpenaiEmbeddingsID, setAzureOpenaiEmbeddingsID] = useState("")
  const [anthropicAPIKey, setAnthropicAPIKey] = useState("")
  const [googleGeminiAPIKey, setGoogleGeminiAPIKey] = useState("")
  const [mistralAPIKey, setMistralAPIKey] = useState("")
  const [groqAPIKey, setGroqAPIKey] = useState("")
  const [perplexityAPIKey, setPerplexityAPIKey] = useState("")
  const [openrouterAPIKey, setOpenrouterAPIKey] = useState("")
  const [question, setQuestion] = useState<TablesInsert<"user_questions">>({
    user_id: profile?.user_id || ""
  })

  useEffect(() => {
    ;(async () => {
      if (bypassOnboardingRedirectLoading) {
        return
      }
      if (!user) {
        return router.push("/login")
      } else {
        try {
          const profile = await getProfileByUserId(user.id)

          setProfile(profile)
          setDisplayName(
            profile.display_name || user?.user_metadata?.display_name || ""
          )
          setUsername(profile.username)

          if (!profile.has_onboarded || bypassOnboardingRedirect) {
            setLoading(false)
          } else {
            redirectToHome()
          }
        } catch (error) {
          console.error(error)
          setLoading(false)
          toast.error("Something went wrong. Please try again.")
          return router.push("/login")
        }
      }
    })()
  }, [bypassOnboardingRedirectLoading])

  function redirectToHome() {
    // TODO: this should be a redirect
    window.location.href = "/"
  }

  const handleOnPlanShouldProceed = (proceed: boolean) => {
    if (proceed) {
      setCurrentStep(currentStep + 1)
    } else {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleOnFinishShouldProceed = (proceed: boolean) => {
    if (proceed) {
      handleSaveSetupSetting()
        .then(() => {
          redirectToHome()
        })
        .catch(error => {
          console.error(error)
          toast.error("Failed to save setup settings")
        })
    } else {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleOnProfileShouldProceed = (proceed: boolean) => {
    if (proceed) {
      setCurrentStep(currentStep + 1)
    } else {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSaveSetupSetting = async () => {
    const session = (await supabase.auth.getSession()).data.session
    if (!session) {
      return router.push("/login")
    }

    const user = session.user
    const profile = await getProfileByUserId(user.id)

    const updateProfilePayload: TablesUpdate<"profiles"> = {
      ...profile,
      has_onboarded: true,
      display_name: displayName || user?.user_metadata?.display_name,
      image_url: user?.user_metadata?.picture,
      username,
      openai_api_key: openaiAPIKey,
      openai_organization_id: openaiOrgID,
      anthropic_api_key: anthropicAPIKey,
      google_gemini_api_key: googleGeminiAPIKey,
      mistral_api_key: mistralAPIKey,
      groq_api_key: groqAPIKey,
      perplexity_api_key: perplexityAPIKey,
      openrouter_api_key: openrouterAPIKey,
      use_azure_openai: useAzureOpenai,
      azure_openai_api_key: azureOpenaiAPIKey,
      azure_openai_endpoint: azureOpenaiEndpoint,
      azure_openai_35_turbo_id: azureOpenai35TurboID,
      azure_openai_45_turbo_id: azureOpenai45TurboID,
      azure_openai_45_vision_id: azureOpenai45VisionID,
      azure_openai_embeddings_id: azureOpenaiEmbeddingsID
    }

    const updatedProfile = await updateProfile(profile.id, updateProfilePayload)
    await upsertUserQuestion({
      ...question,
      user_id: updatedProfile.user_id
    })
    setProfile(updatedProfile)

    const workspaces = await getWorkspacesByUserId(profile.user_id)
    const homeWorkspace = workspaces.find(w => w.is_home)

    // There will always be a home workspace
    setSelectedWorkspace(homeWorkspace!)
    setWorkspaces(workspaces)
  }

  const totalSteps = enableProfileStep ? 3 : 2

  function getStepComponents() {
    const stepComponents = [
      enableProfileStep ? (
        <StepContainer
          key={1}
          totalSteps={totalSteps}
          stepDescription="Let's create your profile."
          stepNum={currentStep}
          stepTitle="Welcome to ChatLabs"
          onShouldProceed={handleOnProfileShouldProceed}
          showNextButton={!!(username && usernameAvailable)}
          showBackButton={false}
        >
          <ProfileStep
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
            onUserQuestionChange={setQuestion}
            userQuestion={question}
          />
        </StepContainer>
      ) : null,
      <StepContainer
        key={2}
        totalSteps={totalSteps}
        stepDescription="Pro plan gives unlimited access to over 20 AI models."
        stepNum={currentStep}
        stepTitle="Choose your plan"
        onShouldProceed={handleOnPlanShouldProceed}
        showNextButton={true}
        showBackButton={enableProfileStep}
      >
        <Plans onClose={() => {}} showCloseIcon={false} />
      </StepContainer>,
      <StepContainer
        key={3}
        totalSteps={totalSteps}
        stepDescription="You are all set up!"
        stepNum={currentStep}
        stepTitle="Setup Complete"
        onShouldProceed={handleOnFinishShouldProceed}
        showNextButton={true}
        showBackButton={true}
      >
        <FinishStep displayName={displayName} />
      </StepContainer>
    ].filter(Boolean) as ReactNode[]

    return stepComponents
  }

  const renderStep = (stepNum: number) => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={stepNum}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {getStepComponents()[stepNum - 1]}
        </motion.div>
      </AnimatePresence>
    )
  }

  if (bypassOnboardingRedirectLoading || loading) {
    return null
  }

  return (
    <div className="flex w-full grow items-center justify-center sm:my-6 sm:w-auto">
      {renderStep(currentStep)}
    </div>
  )
}
