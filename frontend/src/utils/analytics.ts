import posthog from 'posthog-js'

// Initialize PostHog with your project API key
const POSTHOG_API_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY

if (POSTHOG_API_KEY) {
  posthog.init(POSTHOG_API_KEY, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  })
}

// Helper function to get current user details
const getCurrentUser = () => {
  const user = {
    id: 1,
    email: "john.doe@example.com",
    fullName: "John Doe"
  }
  if (!user) {
    throw new Error('User not found in store')
  }
  return {
    personId: user.id.toString(),
    email: user.email,
    name: user.fullName
  }
}

interface SignupEventProperties {
  name: string
  email: string
}

interface WorkspaceCreatedProperties {
  workspaceId: number
  workspaceName: string
}

interface WorkspaceDeletedProperties {
  workspaceId: number
  workspaceName?: string
}

interface InviteUserProperties {
  invitedEmails: string[]
  invitedRole: string
}

interface InviteAcceptedProperties {
  workspaceId: number
  workspaceName: string
  invitedRole: string
}

interface UserRemovedProperties {
  removedUserId: string
  removedUserEmail: string
}

interface InviteRevokedProperties {
  invitedEmail: string
}

interface TaskCreatedProperties {
  taskId: string
  taskName: string
}

export const registerWorkspaceContext = (workspaceId: string | number, properties?: Record<string, any>) => {
  posthog.group('workspace', `id:${workspaceId}`, properties)
}

export const unregisterWorkspaceContext = () => {
  posthog.group('workspace', '')
}

export const trackSignup = ({ name, email }: SignupEventProperties) => {
  const { personId } = getCurrentUser()
  posthog.capture('user_signed_up', {
    personId,
    name,
    email,
    $set: {
      name,
      email,
    },
  })
}

export const trackWorkspaceCreated = ({ workspaceId, workspaceName }: WorkspaceCreatedProperties) => {
  const { personId, email } = getCurrentUser();

  // Track the creation event
  posthog.capture('workspace_created', {
    personId,
    workspaceId,
    workspaceName,
    createdByEmail: email,
    $groups: {
      workspace: `id:${workspaceId}`
    }
  })
}

export const trackWorkspaceDeleted = ({ workspaceId, workspaceName }: WorkspaceDeletedProperties) => {
  const { personId, email } = getCurrentUser()
  
  posthog.capture('workspace_deleted', {
    personId,
    workspaceId,
    workspaceName,
    deletedByEmail: email
  })
}

export const trackInviteUsers = ({ invitedEmails, invitedRole }: InviteUserProperties) => {
  const { personId } = getCurrentUser()
  
  posthog.capture('users_invited', {
    personId,
    invitedEmails,
    invitedRole,
    invitedCount: invitedEmails.length
  })
}

export const trackInviteAccepted = ({ workspaceId, workspaceName, invitedRole }: InviteAcceptedProperties) => {
  const { personId } = getCurrentUser()
  
  posthog.capture('invite_accepted', {
    personId,
    workspaceId,
    workspaceName,
    invitedRole,
    $groups: {
      workspace: workspaceId.toString()
    }
  })
}

export const trackUserRemoved = ({ removedUserId, removedUserEmail }: UserRemovedProperties) => {
  const { personId } = getCurrentUser()
  
  posthog.capture('user_removed', {
    personId,
    removedUserId,
    removedUserEmail
  })
}

export const trackInviteRevoked = ({ invitedEmail }: InviteRevokedProperties) => {
  const { personId } = getCurrentUser()
  
  posthog.capture('invite_revoked', {
    personId,
    invitedEmail
  })
}

export const trackLogin = () => {
  const { personId } = getCurrentUser()
  posthog.capture('user_logged_in', {
    personId
  })
}

export const trackLogout = () => {
  try {
    const { personId } = getCurrentUser()
    
    posthog.capture('user_logged_out', {
      personId
    })
  } catch (error) {
    // If getCurrentUser fails (user already cleared), just track without personId
    posthog.capture('user_logged_out')
  }
}

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  posthog.identify(userId, properties)
}

export const resetAnalytics = () => {
  posthog.reset()
}

export const trackTaskCreated = ({ taskId, taskName }: TaskCreatedProperties) => {
  const { personId } = getCurrentUser()
  
  posthog.capture('task_created', {
    personId,
    taskId,
    taskName
  })
} 