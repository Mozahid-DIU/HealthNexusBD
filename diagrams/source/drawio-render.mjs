// Render a .drawio file to PNG with draw.io's own viewer (the diagram stays in the browser).
// Usage: node drawio-render.mjs in.drawio out.png [scale]
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const [inPath, outPath, scale = '2'] = process.argv.slice(2)
const xml = readFileSync(inPath, 'utf8')
const cfg = JSON.stringify({ xml, highlight: 'none', nav: false, resize: true, toolbar: null, edit: null, lightbox: false })
const page_html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#fff}</style></head><body>
<div class="mxgraph" style="max-width:none" data-mxgraph='${cfg.replace(/&/g, '&amp;').replace(/'/g, '&#39;')}'></div>
<script src="https://viewer.diagrams.net/js/viewer-static.min.js"></script></body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 4000, height: 3000 }, deviceScaleFactor: Number(scale) })
await page.setContent(page_html, { waitUntil: 'networkidle', timeout: 120000 })
const svg = page.locator('.mxgraph svg').first()
await svg.waitFor({ timeout: 60000 })
await page.waitForTimeout(1500)
const box = await svg.boundingBox()
await page.screenshot({ path: outPath, clip: { x: box.x, y: box.y, width: box.width, height: box.height } })
await browser.close()
console.log(`saved ${outPath} (${Math.round(box.width * scale)}x${Math.round(box.height * scale)})`)
