import type { ReactNode } from 'react'

/**
 * The assistant writes plain text with light markdown ("- " bullets, "1." steps,
 * **bold**). Render just that, as React elements: never HTML, so a reply can't inject markup.
 */

const BULLET = /^\s*[-*•]\s+(.*)$/
/** "1." or, in Bangla replies, "১।" / "১." */
const NUMBERED = /^\s*[0-9০-৯]+[.)।]\s+(.*)$/
const HEADING = /^\s*#{1,4}\s+(.*)$/

function inline(text: string, key: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={`${key}-${i}`} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part.replace(/(^|\s)\*(\S[^*]*\S|\S)\*(?=\s|$|[.,!?])/g, '$1$2')
    ),
  )
}

type Block = { kind: 'p' | 'h'; text: string } | { kind: 'ul' | 'ol'; items: string[] }

function blocks(text: string): Block[] {
  const out: Block[] = []
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trimEnd()
    const last = out[out.length - 1]
    const bullet = BULLET.exec(line)
    const numbered = NUMBERED.exec(line)
    const heading = HEADING.exec(line)
    if (bullet || numbered) {
      const kind = bullet ? 'ul' : 'ol'
      const item = (bullet ?? numbered)![1]!
      if (last && last.kind === kind) last.items.push(item)
      else out.push({ kind, items: [item] })
    } else if (heading) {
      out.push({ kind: 'h', text: heading[1]! })
    } else if (line.trim() === '') {
      out.push({ kind: 'p', text: '' })
    } else if (last && last.kind === 'p' && last.text !== '') {
      last.text += `\n${line}`
    } else {
      out.push({ kind: 'p', text: line })
    }
  }
  return out.filter((b) => ('items' in b ? b.items.length > 0 : b.text.trim() !== ''))
}

export function FormattedText({ text }: { text: string }) {
  return (
    <div className="space-y-2.5">
      {blocks(text).map((b, i) => {
        if ('items' in b) {
          const List = b.kind
          return (
            <List key={i} className={`space-y-1 pl-5 ${b.kind === 'ul' ? 'list-disc' : 'list-decimal'} marker:text-teal`}>
              {b.items.map((item, j) => (
                <li key={j}>{inline(item, `${i}-${j}`)}</li>
              ))}
            </List>
          )
        }
        if (b.kind === 'h') {
          return (
            <p key={i} className="font-bold text-ink">
              {inline(b.text, String(i))}
            </p>
          )
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {inline(b.text, String(i))}
          </p>
        )
      })}
    </div>
  )
}
