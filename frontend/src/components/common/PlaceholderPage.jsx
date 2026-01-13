import { Link } from 'react-router-dom'
import { ArrowLeft, Construction } from 'lucide-react'

const PlaceholderPage = ({ title, description, backLink = "/", backText = "Go back" }) => {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-bg-card py-8 px-4 border border-border sm:rounded-lg sm:px-10 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-accent/10 mb-4">
              <Construction className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">{title}</h1>
            <p className="text-text-secondary">
              {description || "This page is under construction and will be available soon."}
            </p>
          </div>

          <div className="space-y-4">
            <Link
              to={backLink}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaceholderPage
