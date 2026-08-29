/* ============================================================
   tokens.json → dist/tokens.css ＋ dist/tokens.js
   MIGI 咪吉麻將 · 共用資產

   ── 🔴 為什麼需要這一步 ────────────────────────────
   同一個值在三端有**兩種形狀**：
     migi-web / migi-admin   `var(--brand)`      ← CSS 變數
     migi-pos                `C.brand`           ← JS 物件

   在這之前那是**兩份手寫的表述**，而手抄的東西只會抄「當下需要的」——
   2026-08-15 統一時 POS 抄了 17 個顏色，之後 web 長出的
   字級／圓角／間距／陰影（27 個）就再也沒跟上。
   實測（2026-08-29）：POS 有 304 個寫死的 fontSize、117 個寫死的 borderRadius，
   而它的 `var(--)` 只用了 **17 次**。

   → 那不是店員端偷懶，是**那份 token 從來沒送到它手上**。
   → 這支讓兩種形狀變成**同一份的兩個輸出**。

   ⚠ 產出物要一起 commit。git 相依（`github:migi-hq/migi-assets#v1.0.0`）
     沒有 `npm publish` 的打包步驟 —— 靠 `prepare` script 在安裝時 build
     等於多一個會失敗的地方，而它失敗時的錯誤訊息指向 `npm install`。
   ⚠ 所以要有 `check.mjs`：產出物與 tokens.json 不同步就報。
     **讓漂移看得見，不要靠記性**（同 CLAUDE.md 硬規則 1.7 的 baseline 過期偵測）。
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const tokens = JSON.parse(readFileSync(join(HERE, 'tokens.json'), 'utf8'))

/* CSS 變數名沿用既有寫法（`--brand`、`--r-pill`、`--sp-1`…）——
   ⚠ **不可以改名**：三端已經有 2200+ 個使用點，改名等於一次改光。
   所以 JSON 的鍵就是去掉 `--` 的既有名稱，這裡原樣加回去。 */
/* 🔴 **JSON 的鍵必須是完整的 CSS 變數名**（`z-sheet` 而不是 `sheet`）。
   2026-08-29 踩到：新加的六組用了裸鍵（`sheet`／`hair`／`body`），
   產出的是 `--sheet`／`--hair`／`--body`，而程式碼寫的是 `var(--z-sheet)`
   —— **解析不出來，CSS 直接忽略那個屬性**：邊框整排消失、行高退回預設。
   ⚠ 而且 **build 不會報錯、瀏覽器也不會**。是在 dev server 上
     逐一讀 `getComputedStyle` 才發現的（硬規則 3.85）。
   → 這裡刻意**不做任何加前綴的聰明事**：鍵是什麼，變數就是什麼。
     猜前綴會讓「JSON 看到的名字」與「CSS 裡的名字」變成兩件事。 */
const cssName = (k) => '--' + k
/* JS 物件的鍵：POS 的 `C` 物件習慣是 camelCase（`C.fieldBg`）。
   `gray-1` → `gray1`、`field-bg` → `fieldBg`、`r-pill` → `rPill`。 */
const jsName = (k) => k.replace(/-(\w)/g, (_, c) => c.toUpperCase())

const groups = Object.entries(tokens)
const lines = []
const jsLines = []

for (const [group, items] of groups) {
  lines.push(`  /* ── ${group} ── */`)
  jsLines.push(`  // ── ${group} ──`)
  for (const [key, def] of Object.entries(items)) {
    const d = def.$description ? `  /* ${def.$description} */` : ''
    lines.push(`  ${cssName(key)}: ${def.$value};${d}`)
    /* ⚠ JS 端一律吐 `var(--x)` 而不是原始值 ——
       這樣 POS 的 inline style 仍然走 CSS 變數，
       日後真的要做深色模式時只要換 `:root` 就好，不用改 JS。
       🔴 若吐原始值，JS 端會變成第二份**已經解析過**的真相，
         那就回到今天的問題了。 */
    jsLines.push(`  ${jsName(key)}: 'var(${cssName(key)})',`)
  }
}

const banner = `/* 🔴 這個檔案是產生的，不要手改 —— 改 tokens.json 然後跑 \`npm run build\`。
   來源：@migi/assets ／ tokens.json
   共 ${groups.reduce((n, [, v]) => n + Object.keys(v).length, 0)} 個 token */`

mkdirSync(join(HERE, 'dist'), { recursive: true })
writeFileSync(join(HERE, 'dist/tokens.css'),
  `${banner}\n:root {\n${lines.join('\n')}\n}\n`, 'utf8')

writeFileSync(join(HERE, 'dist/tokens.js'),
  `${banner}\nexport const C = {\n${jsLines.join('\n')}\n}\nexport default C\n`, 'utf8')

console.log('產出 dist/tokens.css 與 dist/tokens.js')
