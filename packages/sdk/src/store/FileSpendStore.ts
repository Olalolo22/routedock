import fs from 'node:fs/promises'
import path from 'node:path'
import type { DailySpend, SpendStore } from './SpendStore.js'

/**
 * File-backed durable {@link SpendStore}.
 *
 * Persists the daily spend accumulator to a JSON file on disk, preserving
 * cumulative spending totals across process restarts, crashes, and redeploys.
 *
 * ### Error semantics
 * - File absent (ENOENT): returns null — legitimately no spend recorded yet.
 * - File present but unreadable or malformed: throws — a safety control must
 *   fail closed, not assume nothing was spent.
 *
 * ### Write atomicity
 * Writes go to `<filePath>.tmp` first, then `fs.rename` onto the target.
 * `rename` is atomic within a filesystem, so there is no window where the
 * target file is truncated but not yet fully written.
 */
export class FileSpendStore implements SpendStore {
  readonly filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
  }

  async read(): Promise<DailySpend | null> {
    let data: string
    try {
      data = await fs.readFile(this.filePath, 'utf-8')
    } catch (err) {
      // ENOENT is expected on first run — no spend recorded yet.
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null
      }
      // Any other I/O error (permission denied, EISDIR, etc.) must throw.
      // A cap that cannot read its state should refuse to spend, not assume zero.
      throw new Error(
        `[FileSpendStore] Failed to read spend file at ${this.filePath}: ${(err as Error).message}`,
      )
    }

    try {
      return JSON.parse(data) as DailySpend
    } catch {
      throw new Error(
        `[FileSpendStore] Spend file at ${this.filePath} contains invalid JSON. ` +
          `Delete or repair it before resuming. Raw content: ${data.slice(0, 120)}`,
      )
    }
  }

  async write(state: DailySpend): Promise<void> {
    const dir = path.dirname(this.filePath)
    await fs.mkdir(dir, { recursive: true })

    const tmpPath = `${this.filePath}.tmp`
    await fs.writeFile(tmpPath, JSON.stringify(state, null, 2), 'utf-8')
    // rename is atomic within a filesystem: the target is either the old
    // content or the new content, never a partial write.
    await fs.rename(tmpPath, this.filePath)
  }
}
