/* ============================================================
   產出物與 tokens.json 同步嗎？
   MIGI 咪吉麻將 · 共用資產

   🔴 產出物是 commit 進版控的（git 相依沒有 publish 步驟）——
     所以「改了 tokens.json 但忘了跑 build」是**一定會發生**的事。
     而它的症狀是：**三端裝到的還是舊值，而且沒有任何錯誤**。

   → 重跑 build，比對結果與磁碟上的檔案。不一樣就 exit 1。
   ⚠ 同 CLAUDE.md 硬規則 1.7：讓過期看得見，不要靠記性。
   ============================================================ */
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const before = ['dist/tokens.css', 'dist/tokens.js']
  .map((f) => { try { return readFileSync(join(HERE, f), 'utf8') } catch { return null } })

execSync('node build.mjs', { cwd: HERE, stdio: 'ignore' })

const after = ['dist/tokens.css', 'dist/tokens.js']
  .map((f) => readFileSync(join(HERE, f), 'utf8'))

const stale = before.some((b, i) => b !== after[i])
if (stale) {
  console.error('🔴 dist/ 與 tokens.json 不同步 —— 已重新產生，記得一起 commit')
  process.exit(1)
}
console.log('✅ dist/ 與 tokens.json 同步')
