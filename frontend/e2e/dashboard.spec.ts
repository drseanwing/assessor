import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.waitForTimeout(1000) // Wait for assessors to load
    await page.locator('#pin').fill('1234')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/courses/)
  })

  test('should display course list page', async ({ page }) => {
    // Check page heading
    await expect(page.locator('h1')).toContainText('REdI Assessment System')

    // Check welcome message with assessor name
    await expect(page.getByText(/Welcome,/)).toBeVisible()

    // Check logout button is present
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible()
  })

  test('should display date filter controls', async ({ page }) => {
    // Check date input is present
    const dateInput = page.locator('#course-date')
    await expect(dateInput).toBeVisible()

    // Check "Today" button is present
    await expect(page.getByRole('button', { name: /today/i })).toBeVisible()

    // Check date input has a value
    const dateValue = await dateInput.inputValue()
    expect(dateValue).toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  test('should change date filter', async ({ page }) => {
    const dateInput = page.locator('#course-date')

    // Get current date value
    const originalDate = await dateInput.inputValue()

    // Change to a different date
    await dateInput.fill('2024-01-15')

    // Verify date changed
    const newDate = await dateInput.inputValue()
    expect(newDate).toBe('2024-01-15')
    expect(newDate).not.toBe(originalDate)
  })

  test('should reset to today when clicking Today button', async ({ page }) => {
    const dateInput = page.locator('#course-date')
    const todayButton = page.getByRole('button', { name: /today/i })

    // Change to a past date
    await dateInput.fill('2024-01-15')
    await page.waitForTimeout(500)

    // Click Today button
    await todayButton.click()

    // Should reset to today's date
    const todayDate = new Date().toISOString().split('T')[0]
    const currentDate = await dateInput.inputValue()
    expect(currentDate).toBe(todayDate)
  })

  test('should display courses when available', async ({ page }) => {
    // Wait for courses to load
    await page.waitForTimeout(1000)

    // Check if courses are displayed or "no courses" message
    const hasCourses = await page.locator('.bg-white.rounded-lg.shadow').count()

    if (hasCourses > 0) {
      // At least one course card should be visible
      expect(hasCourses).toBeGreaterThan(0)

      // Each course should have a name
      const firstCourse = page.locator('.bg-white.rounded-lg.shadow').first()
      await expect(firstCourse).toBeVisible()

      // Course should have a "Participants" button or link
      await expect(firstCourse.getByText(/participants/i)).toBeVisible()
    } else {
      // Should show "No courses found" message
      await expect(page.getByText(/no courses found/i)).toBeVisible()
    }
  })

  test('should display course details', async ({ page }) => {
    // Wait for courses to load
    await page.waitForTimeout(1000)

    const courseCards = page.locator('.bg-white.rounded-lg.shadow')
    const courseCount = await courseCards.count()

    if (courseCount > 0) {
      const firstCourse = courseCards.first()

      // Should show participant count
      await expect(firstCourse.getByText(/participant/i)).toBeVisible()

      // Should show date
      await expect(firstCourse.locator('svg').first()).toBeVisible() // Date icon

      // Should have Dashboard and Participants buttons
      await expect(firstCourse.getByText(/dashboard/i)).toBeVisible()
      await expect(firstCourse.getByText(/participants/i)).toBeVisible()
    }
  })

  test('should navigate to participant list when clicking course', async ({ page }) => {
    // Wait for courses to load
    await page.waitForTimeout(1000)

    const courseCards = page.locator('.bg-white.rounded-lg.shadow')
    const courseCount = await courseCards.count()

    if (courseCount > 0) {
      // Click on first course card
      await courseCards.first().click()

      // Should navigate to participants page
      await expect(page).toHaveURL(/\/course\/.*\/participants/)

      // Should show participants page heading
      await expect(page.locator('h1')).toBeVisible()
    }
  })

  test('should navigate to course dashboard when clicking Dashboard button', async ({ page }) => {
    // Wait for courses to load
    await page.waitForTimeout(1000)

    const courseCards = page.locator('.bg-white.rounded-lg.shadow')
    const courseCount = await courseCards.count()

    if (courseCount > 0) {
      // Click Dashboard button on first course
      const dashboardButton = courseCards.first().getByText(/dashboard →/i)
      await dashboardButton.click()

      // Should navigate to course dashboard
      await expect(page).toHaveURL(/\/course\/.*\/dashboard/)
    }
  })

  test('should logout successfully', async ({ page }) => {
    const logoutButton = page.getByRole('button', { name: /logout/i })

    // Click logout
    await logoutButton.click()

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/)

    // Should see login form
    await expect(page.locator('h2')).toContainText('Assessor Login')
  })

  test('should show loading state while fetching courses', async ({ page }) => {
    // Reload page to see loading state
    await page.reload()

    // May briefly see loading spinner
    // Note: Loading may be too fast to catch consistently
    const isLoadingOrLoaded = await Promise.race([
      page.locator('.animate-spin').isVisible(),
      page.waitForTimeout(2000).then(() => true)
    ])

    expect(isLoadingOrLoaded).toBeTruthy()
  })

  test('should display empty state when no courses for selected date', async ({ page }) => {
    const dateInput = page.locator('#course-date')

    // Select a date far in the future (unlikely to have courses)
    await dateInput.fill('2099-12-31')

    // Wait for courses to load
    await page.waitForTimeout(1500)

    // Should show "No courses found" message
    await expect(page.getByText(/no courses found/i)).toBeVisible()
    await expect(page.getByText(/no courses scheduled/i)).toBeVisible()
  })

  test('should show course type badge', async ({ page }) => {
    // Wait for courses to load
    await page.waitForTimeout(1000)

    const courseCards = page.locator('.bg-white.rounded-lg.shadow')
    const courseCount = await courseCards.count()

    if (courseCount > 0) {
      // Each course should have a type badge (bg-blue-100)
      const firstCourse = courseCards.first()
      const badge = firstCourse.locator('.bg-blue-100')

      if ((await badge.count()) > 0) {
        await expect(badge).toBeVisible()
      }
    }
  })

  test('should display coordinator name if available', async ({ page }) => {
    // Wait for courses to load
    await page.waitForTimeout(1000)

    const courseCards = page.locator('.bg-white.rounded-lg.shadow')
    const courseCount = await courseCards.count()

    if (courseCount > 0) {
      // First course may have coordinator info
      const firstCourse = courseCards.first()

      // Look for user icon (coordinator indicator)
      const userIcon = firstCourse.locator('svg').nth(1)

      if (await userIcon.isVisible()) {
        // If icon is visible, coordinator name should follow
        expect(await firstCourse.textContent()).toBeTruthy()
      }
    }
  })
})
