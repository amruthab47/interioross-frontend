const { chromium } = require('./node_modules/playwright-core')
const fs = require('fs')
const OUT = 'C:/Users/91994/AppData/Local/Temp/studio_fixes'
fs.mkdirSync(OUT, { recursive: true })
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })
  
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()) })

  await page.goto('http://localhost:5173/login')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)
  await page.locator('input[type="email"]').fill('ramesh@squareinteriors.in')
  await page.locator('input[type="password"]').fill('password123')
  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(2500)

  await page.goto('http://localhost:5173/designer-studio')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2500)

  // 1. Floor plan (default view) – check for blank
  await page.screenshot({ path: `${OUT}/01_floor_plan.png` })
  console.log('1: floor plan loaded, errors:', errors.length)

  // 2. Check door is visible on Living Room (bottom wall)
  const bodyText = await page.locator('body').innerText().catch(() => '')
  console.log('   Has "Living Room":', bodyText.includes('Living Room'))
  console.log('   Has toolbar buttons:', bodyText.includes('Save'))

  // 3. Furnish a room, move door to a different wall
  const furnishBtn = page.locator('text=Furnish →').first()
  if (await furnishBtn.isVisible().catch(()=>false)) {
    await furnishBtn.click()
    await page.waitForTimeout(600)
  }
  await page.screenshot({ path: `${OUT}/02_room_view.png` })
  console.log('2: room view')

  // Place some items
  const catBtns = page.locator('.flex-1.overflow-y-auto button.w-full.text-left')
  const n = await catBtns.count()
  for (let i=0; i<Math.min(n,4); i++) { await catBtns.nth(i).click(); await page.waitForTimeout(200) }

  // Change door to right wall
  const rightWallBtn = page.locator('button').filter({ hasText: /^right$/ }).first()
  if (await rightWallBtn.isVisible().catch(()=>false)) {
    await rightWallBtn.click()
    await page.waitForTimeout(400)
    console.log('3: changed door to right wall')
  }
  await page.screenshot({ path: `${OUT}/03_door_right.png` })

  // Go back to floor plan - check door position updated
  await page.locator('button').filter({ hasText: /Floor Plan/ }).first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/04_floorplan_door_right.png` })
  console.log('4: floor plan after door change')

  // Check Save button and PDF button
  const saveBtn = page.locator('button').filter({ hasText: /^Save$/ }).first()
  const pdfBtn  = page.locator('button').filter({ hasText: /⬇ PDF/ }).first()
  console.log('Save button:', await saveBtn.isVisible().catch(()=>false))
  console.log('PDF button:', await pdfBtn.isVisible().catch(()=>false))

  // Click Send to Client modal
  await page.locator('button').filter({ hasText: /Send to Client/ }).first().click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/05_send_modal.png` })
  console.log('5: send modal')

  console.log('Errors:', errors)
  await browser.close()
})()
