// Render an SVG to a high-resolution PNG with headless Chromium. Usage: node render.mjs in.svg out.png [scale]
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const [svgPath, pngPath, scale = '2'] = process.argv.slice(2)
const svg = readFileSync(svgPath, 'utf8')
const w = Number(svg.match(/width="(\d+)"/)[1])
const h = Number(svg.match(/height="(\d+)"/)[1])
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(scale) })
await page.setContent(`<html><body style="margin:0">${svg}</body></html>`)
await page.locator('svg').screenshot({ path: pngPath })
await browser.close()
console.log(`saved ${pngPath} (${w * scale}x${h * scale})`)
