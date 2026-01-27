import { Page } from '@playwright/test'

/**
 * Helper function to login as an assessor
 */
export async function loginAsAssessor(page: Page, pin: string = '1234') {
  await page.goto('/login')
  await page.waitForTimeout(1000) // Wait for assessors to load
  await page.locator('#pin').fill(pin)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/courses/)
}

/**
 * Helper function to navigate to first available course's participant list
 */
export async function navigateToFirstCourseParticipants(page: Page) {
  const courseCards = page.locator('.bg-white.rounded-lg.shadow')
  const courseCount = await courseCards.count()

  if (courseCount === 0) {
    return null
  }

  await courseCards.first().click()
  await page.waitForURL(/\/course\/.*\/participants/)
  await page.waitForTimeout(1000)

  return true
}

/**
 * Helper function to navigate to first available participant's assessment
 */
export async function navigateToFirstParticipantAssessment(page: Page) {
  const success = await navigateToFirstCourseParticipants(page)

  if (!success) {
    return null
  }

  const participantRows = page.locator('tbody tr')
  const rowCount = await participantRows.count()

  if (rowCount === 0) {
    return null
  }

  await participantRows.first().getByText(/assess/i).click()
  await page.waitForURL(/\/course\/.*\/participant\/.*\/assess/)
  await page.waitForTimeout(1500) // Wait for assessment data to load

  return true
}

/**
 * Helper to check if courses are available
 */
export async function hasCoursesAvailable(page: Page): Promise<boolean> {
  const courseCards = page.locator('.bg-white.rounded-lg.shadow')
  const courseCount = await courseCards.count()
  return courseCount > 0
}

/**
 * Helper to check if participants are available
 */
export async function hasParticipantsAvailable(page: Page): Promise<boolean> {
  const participantRows = page.locator('tbody tr')
  const rowCount = await participantRows.count()
  return rowCount > 0
}

/**
 * Helper to wait for loading to complete
 */
export async function waitForLoadingComplete(page: Page, timeout: number = 2000) {
  try {
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout })
  } catch {
    // Loading spinner may not appear or already disappeared
  }
}

/**
 * Helper to get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}
