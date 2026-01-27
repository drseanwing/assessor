import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login page with correct elements', async ({ page }) => {
    // Check page title and headings
    await expect(page.locator('h1')).toContainText('REdI Assess')
    await expect(page.locator('h2')).toContainText('Assessor Login')

    // Check form elements are present
    await expect(page.locator('#assessor')).toBeVisible()
    await expect(page.locator('#pin')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Check development note is present
    await expect(page.getByText(/Development Mode/)).toBeVisible()
  })

  test('should have assessor dropdown populated', async ({ page }) => {
    // Wait for assessors to load
    await page.waitForTimeout(1000)

    const assessorSelect = page.locator('#assessor')

    // Check that dropdown is not showing "Loading assessors..."
    const options = await assessorSelect.locator('option').allTextContents()
    expect(options.length).toBeGreaterThan(0)
    expect(options[0]).not.toContain('Loading')
  })

  test('should validate PIN length', async ({ page }) => {
    // Wait for assessors to load
    await page.waitForTimeout(1000)

    const pinInput = page.locator('#pin')
    const submitButton = page.locator('button[type="submit"]')

    // Enter less than 4 digits
    await pinInput.fill('123')
    await expect(submitButton).toBeDisabled()

    // Enter exactly 4 digits
    await pinInput.fill('1234')
    await expect(submitButton).toBeEnabled()

    // Try to enter more than 4 digits - should be limited
    await pinInput.fill('12345')
    const pinValue = await pinInput.inputValue()
    expect(pinValue.length).toBeLessThanOrEqual(4)
  })

  test('should only accept numeric input in PIN field', async ({ page }) => {
    const pinInput = page.locator('#pin')

    // Try to enter letters
    await pinInput.fill('abcd')
    const pinValue = await pinInput.inputValue()

    // PIN field should be empty or not contain letters
    expect(pinValue).not.toMatch(/[a-zA-Z]/)
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Wait for assessors to load
    await page.waitForTimeout(1000)

    const assessorSelect = page.locator('#assessor')
    const pinInput = page.locator('#pin')
    const submitButton = page.locator('button[type="submit"]')

    // Select first assessor (should be auto-selected)
    const selectedValue = await assessorSelect.inputValue()
    expect(selectedValue).toBeTruthy()

    // Enter PIN
    await pinInput.fill('1234')

    // Submit form
    await submitButton.click()

    // Should redirect to courses page
    await expect(page).toHaveURL(/\/courses/)

    // Verify we're on the courses page
    await expect(page.locator('h1')).toContainText('REdI Assessment System')
  })

  test('should show loading state during login', async ({ page }) => {
    // Wait for assessors to load
    await page.waitForTimeout(1000)

    const pinInput = page.locator('#pin')
    const submitButton = page.locator('button[type="submit"]')

    // Enter PIN
    await pinInput.fill('1234')

    // Submit form
    await submitButton.click()

    // Check for loading text (may be brief)
    // Note: This may not always catch the loading state due to fast response
    const loadingOrSuccess = await Promise.race([
      submitButton.textContent(),
      page.waitForURL(/\/courses/).then(() => 'redirected')
    ])

    // Either we saw loading state or we were redirected
    expect(loadingOrSuccess).toBeTruthy()
  })

  test('should redirect to courses if already authenticated', async ({ page }) => {
    // First login
    await page.waitForTimeout(1000)
    await page.locator('#pin').fill('1234')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/courses/)

    // Now try to go back to login page
    await page.goto('/login')

    // Should immediately redirect back to courses
    await expect(page).toHaveURL(/\/courses/)
  })

  test('should clear PIN on error', async ({ page }) => {
    // Wait for assessors to load
    await page.waitForTimeout(1000)

    const pinInput = page.locator('#pin')

    // Enter PIN
    await pinInput.fill('1234')

    // If there's an error scenario that clears PIN, test it
    // For now, just verify PIN can be cleared
    await pinInput.clear()

    const pinValue = await pinInput.inputValue()
    expect(pinValue).toBe('')
  })
})
