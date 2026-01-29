interface StatsBarProps {
  stats: {
    totalParticipants: number
    totalComponents: number
    completedAssessments: number
    totalAssessments: number
    participantsComplete: number
    participantsWithIssues: number
    progressPercent: number
    passRate: number
  }
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 print:border-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Progress Bar */}
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-600">
                {stats.completedAssessments}/{stats.totalAssessments} assessments
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-redi-teal h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center space-x-6">
            {/* Participants */}
            <div className="text-center">
              <div className="text-2xl font-bold text-redi-navy">
                {stats.participantsComplete}/{stats.totalParticipants}
              </div>
              <div className="text-xs text-gray-500 uppercase">Complete</div>
            </div>
            
            {/* Pass Rate */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.passRate}%
              </div>
              <div className="text-xs text-gray-500 uppercase">Pass Rate</div>
            </div>
            
            {/* Issues */}
            {stats.participantsWithIssues > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {stats.participantsWithIssues}
                </div>
                <div className="text-xs text-gray-500 uppercase">Issues</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
