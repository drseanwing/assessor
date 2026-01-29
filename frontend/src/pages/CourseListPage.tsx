import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import type { Course, CourseTemplate } from '../types/database'

interface CourseWithTemplate extends Course {
  template?: CourseTemplate
  participant_count?: number
}

export default function CourseListPage() {
  const { assessor, logout } = useAuthStore()
  const navigate = useNavigate()

  const [courses, setCourses] = useState<CourseWithTemplate[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )

  const loadCourses = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch courses with their templates
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          template:course_templates(*)
        `)
        .eq('course_date', selectedDate)
        .order('course_name', { ascending: true })

      if (coursesError) throw coursesError

      // For each course, get participant count
      const coursesWithCounts = await Promise.all(
        (coursesData || []).map(async (course) => {
          const { count } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.course_id)

          return {
            ...course,
            participant_count: count || 0
          }
        })
      )

      setCourses(coursesWithCounts as CourseWithTemplate[])
    } catch (err) {
      console.error('Error loading courses:', err)
      setError('Failed to load courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}/participants`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-redi-coral">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-redi-navy">
                REdI Assessment System
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, {assessor?.name}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-redi-navy hover:bg-redi-navy-light text-white rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-redi-navy mb-4">
            Select Course
          </h2>

          {/* Date Filter */}
          <div className="flex items-center gap-4 mb-6">
            <label htmlFor="course-date" className="text-sm font-medium text-gray-700">
              Course Date:
            </label>
            <input
              id="course-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-redi-teal focus:border-transparent"
            />
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-200"
            >
              Today
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-redi-teal"></div>
          </div>
        ) : courses.length === 0 ? (
          /* No Courses */
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-redi-navy mb-2">
              No courses found
            </h3>
            <p className="text-gray-600">
              No courses scheduled for {new Date(selectedDate).toLocaleDateString('en-AU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        ) : (
          /* Course Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.course_id}
                onClick={() => handleCourseClick(course.course_id)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden border-l-4 border-redi-teal"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-redi-navy flex-1">
                      {course.course_name}
                    </h3>
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-redi-light-teal/30 text-redi-navy rounded">
                      {course.template?.course_type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(course.course_date).toLocaleDateString('en-AU', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>

                    {course.course_coordinator && (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {course.course_coordinator}
                      </div>
                    )}

                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {course.participant_count} participant{course.participant_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/course/${course.course_id}/dashboard`)
                    }}
                    className="text-sm font-medium text-redi-teal hover:text-redi-teal-dark"
                  >
                    Dashboard →
                  </button>
                  <button className="text-sm font-medium text-redi-coral hover:text-redi-coral-dark">
                    Participants →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
