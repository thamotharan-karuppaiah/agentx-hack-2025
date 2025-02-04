import { Toaster } from './components/ui/toaster'
import AppRoutes from './routes'
import { PostHogProvider} from 'posthog-js/react';

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
}
function App() {

  return (
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
      <AppRoutes />
      <Toaster />
    </PostHogProvider>
  )
}

export default App
