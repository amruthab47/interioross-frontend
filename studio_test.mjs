import { chromium } from './node_modules/playwright-core/index.js'
import fs from 'fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = 'C:/Users/91994/AppData/Local/Temp/studio_shots'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'],
})
const page = await browser.newPage()
await page.setViewportSize({ width: 1400, height: 900 })

await page.goto('http://localhost:5178/login')
await page.waitForLoadState('networkidle')
try {
  await page.fill('input[type="email"]', 'admin@interioross.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2500)
} catch (e) { console.log('login:', e.message) }

await page.goto('http://localhost:5178/designer-studio')
await page.waitForLoadState('networkidle')
await page.waitForTimeout(2000)
await page.screenshot({ path: `${OUT}/01_initial.png` })
console.log('1: initial view')

for (const txt of ['Room','Floor Plan','Project']) {
  const v = await page.locator(`button:has-text("${txt}")`).first().isVisible().catch(()=>false)
  console.log(`  Tab "${txt}": ${v}`)
}

// click first catalog button
const catBtns = page.locator('div.flex-1.overflow-y-auto button.w-full')
const count = await catBtns.count()
console.log('catalog items:', count)
if (count > 0) { await catBtns.first().click(); await page.waitForTimeout(800) }

await page.screenshot({ path: `${OUT}/02_placed.png` })
console.log('2: item placed')

for (const t of ['Rotation','Size','Colour']) {
  const v = await page.getByText(t, {exact:true}).first().isVisible().catch(()=>false)
  console.log(`  "${t}" panel: ${v}`)
}

// rotate CW
const cwBtn = page.locator('button').filter({hasText:'CW'}).first()
if (await cwBtn.isVisible().catch(()=>false)) { await cwBtn.click(); await page.waitForTimeout(400) }

// scale
const slider = page.locator('input[type="range"]').first()
if (await slider.isVisible().catch(()=>false)) {
  await slider.evaluate(el => { el.value='150'; el.dispatchEvent(new Event('input',{bubbles:true})) })
  await page.waitForTimeout(400)
}
await page.screenshot({ path: `${OUT}/03_rotated_scaled.png` })
console.log('3: rotated & scaled')

// floor plan
await page.locator('button').filter({hasText:'Floor Plan'}).first().click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/04_floor.png` })
console.log('4: floor plan')

// project
await page.locator('button').filter({hasText:'Project'}).first().click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/05_project.png` })
console.log('5: project view')

await browser.close()
console.log('Done:', OUT)
