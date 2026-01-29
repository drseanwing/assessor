interface ComponentFeedback {
  participantName: string
  componentName: string
  feedback: string
  assessorName: string | null
  timestamp: string
}

interface FeedbackPanelProps {
  feedback: ComponentFeedback[]
}

export default function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (feedback.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 sticky top-4">
        <h3 className="text-lg font-semibold text-redi-navy mb-4">Feedback</h3>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <p>No feedback recorded yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow sticky top-4 max-h-[80vh] overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-redi-navy">
          Feedback
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({feedback.length} entries)
          </span>
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {feedback.map((item, index) => (
          <div 
            key={`${item.participantName}-${item.componentName}-${index}`}
            className="bg-gray-50 rounded-lg p-3"
          >
            <div className="flex items-start justify-between mb-1">
              <div>
                <span className="font-medium text-redi-navy">{item.participantName}</span>
                <span className="text-gray-500 mx-1">•</span>
                <span className="text-sm text-gray-600">{item.componentName}</span>
              </div>
              <span className="text-xs text-gray-400">{formatTimestamp(item.timestamp)}</span>
            </div>
            <p className="text-sm text-gray-700 italic">"{item.feedback}"</p>
            {item.assessorName && (
              <p className="text-xs text-gray-500 mt-1">— {item.assessorName}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
