// End-to-end smoke test driven by the browser-automation skill:
//   node <skill>/browser.mjs http://localhost:5173 --script ./qa-smoke.mjs
export default async function run(page, ui) {
  const report = {}
  const wire = []
  page.on('pageerror', (e) => wire.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') wire.push(`console: ${m.text()}`)
  })

  report.title = await page.title()

  // 1. Landing renders + 3D logo is present
  report.logoPanels = await page.locator('.hp').count()
  report.bottomNav = await page.locator('.bottom-nav .nav-item').count()

  // 2. Register a brand-new account
  const email = `qa${Date.now()}@stark.com`
  await page.goto('http://localhost:5173/register')
  await page.getByLabel('Full name').fill('QA Stark')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel(/Password/).fill('arc-reactor-42')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL('**/builder', { timeout: 10000 })
  report.registered = page.url().endsWith('/builder')

  // 3. Fill the resume, confirm live preview + autosave
  await page.getByLabel('Full name').fill('QA Stark')
  await page.getByLabel('Target role').fill('Mechanical Engineer')
  await page.getByLabel('Skills (comma separated)').fill('React, Node.js, CAD, TypeScript, Welding')
  await page.getByLabel('Experience (one achievement per line)').fill('- Built an arc reactor\n- Led 12 engineers')
  await page.waitForTimeout(1200)
  report.previewName = await page.locator('.rs-name').innerText()
  report.previewSkills = await page.locator('.rs-skills li').count()
  report.saveState = await page.locator('.save-state').innerText()

  // 4. Free plan must NOT be able to generate → shows the upgrade CTA
  report.upgradeCta = await page.getByRole('link', { name: /Unlock AI/ }).count()

  // 5. Buy Pro through the interface
  await page.goto('http://localhost:5173/pricing')
  await page.getByLabel('Name on card').fill('QA Stark')
  await page.getByLabel('Card number').fill('4242424242424242')
  await page.getByLabel('Expiry (MM/YY)').fill('12/29')
  await page.getByLabel('CVV').fill('123')
  await page.getByRole('button', { name: /Pay R100/ }).click()
  await page.waitForSelector('.alert-success', { timeout: 10000 })
  report.paymentOk = await page.locator('.alert-success').innerText()

  // 6. Pro user can generate with AI
  await page.goto('http://localhost:5173/builder')
  await page.waitForSelector('text=Resume builder')
  await page.getByRole('button', { name: /Generate with AI/ }).click()
  await page.waitForSelector('.suggestions', { timeout: 10000 })
  report.aiSummary = (await page.locator('.rs-section').first().locator('.rs-text').innerText()).slice(0, 90)
  report.suggestions = await page.locator('.suggestions li').count()
  report.creditChip = await page.locator('.chip-gold').innerText()

  // 7. Account page shows the receipt
  await page.goto('http://localhost:5173/account')
  await page.waitForSelector('.payments tbody tr')
  report.payments = await page.locator('.payments tbody tr').count()

  // 8. Bottom menu navigation works
  await page.locator('.bottom-nav').getByRole('link', { name: 'Home' }).click()
  await page.waitForURL('http://localhost:5173/')
  report.homeNav = (await page.locator('h1').innerText()).includes('Stark')

  // 9. Logged-out guard: protected route redirects to /login
  await page.evaluate(() => localStorage.removeItem('ironman-rb-token'))
  await page.goto('http://localhost:5173/builder')
  await page.waitForURL('**/login', { timeout: 10000 })
  report.guard = page.url().endsWith('/login')

  // 10. Wrong password surfaces a clean error (no crash)
  await page.goto('http://localhost:5173/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForSelector('.alert-error')
  report.loginError = await page.locator('.alert-error').innerText()

  // The 401s here are deliberate: the wrong-password test and /auth/me after logout.
  report.runtimeErrors = wire.filter((w) => !/401/.test(w))
  return report
}
