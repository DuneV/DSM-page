import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'

/* ============================================================
   CONSTANTS
============================================================ */
const VOTE_KEY  = 'dsm_votes_v1'
const MAX_VOTES = 3

// Realistic seed counts so the ranking is non-trivial on first load
const SEEDS = {
  cinematica: 42, slider: 31, robot3r: 38,
  dinamica: 47, impacto: 29, multicuerpo: 35,
  energias: 51, virtuales: 22, duffing: 44,
  vibraciones: 53, absorsor: 33, vigas: 48,
}

const TOPIC_COLOR = {
  Cinematica:  '#2b6cb0',
  Dinamica:    '#276749',
  Energias:    '#975a16',
  Vibraciones: '#553c9a',
}

const MEDALS = ['🥇', '🥈', '🥉']

/* ============================================================
   PERSISTENCE
============================================================ */
function load() {
  try {
    const raw = localStorage.getItem(VOTE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { counts: { ...SEEDS }, myVotes: [] }
}

function save(data) {
  localStorage.setItem(VOTE_KEY, JSON.stringify(data))
}

/* ============================================================
   COMPONENT
============================================================ */
export default function VotePanel({ labs }) {
  const [data, setData] = useState(load)

  const toggle = useCallback((id) => {
    setData(prev => {
      const voted = prev.myVotes.includes(id)
      let myVotes, counts

      if (voted) {
        myVotes = prev.myVotes.filter(v => v !== id)
        counts  = { ...prev.counts, [id]: Math.max(0, (prev.counts[id] ?? 0) - 1) }
      } else if (prev.myVotes.length < MAX_VOTES) {
        myVotes = [...prev.myVotes, id]
        counts  = { ...prev.counts, [id]: (prev.counts[id] ?? 0) + 1 }
      } else {
        return prev                 // no votes left, ignore
      }

      const next = { counts, myVotes }
      save(next)
      return next
    })
  }, [])

  const sorted = useMemo(
    () => [...labs].sort((a, b) => (data.counts[b.id] ?? 0) - (data.counts[a.id] ?? 0)),
    [labs, data.counts]
  )

  const topCount  = data.counts[sorted[0]?.id] ?? 1
  const remaining = MAX_VOTES - data.myVotes.length
  const total     = Object.values(data.counts).reduce((s, v) => s + v, 0)

  return (
    <div className="vote-panel">
      {/* ── Header ── */}
      <div className="vote-panel-header">
        <div>
          <h3 className="vote-panel-title">Ranking del Banco</h3>
          <p className="vote-panel-sub">
            Vota por los laboratorios que más te interesan · máximo {MAX_VOTES} votos
          </p>
        </div>
        <div className="vote-tokens">
          {Array.from({ length: MAX_VOTES }, (_, i) => (
            <span
              key={i}
              className={`vote-token ${i < MAX_VOTES - remaining ? 'vote-token--used' : ''}`}
            />
          ))}
          <span className="vote-tokens-label">
            {remaining > 0
              ? `${remaining} disponible${remaining > 1 ? 's' : ''}`
              : 'Sin votos'}
          </span>
        </div>
      </div>

      {/* ── List ── */}
      <div className="vote-list">
        {sorted.map((lab, idx) => {
          const count   = data.counts[lab.id] ?? 0
          const isVoted = data.myVotes.includes(lab.id)
          const pct     = topCount > 0 ? (count / topCount) * 100 : 0
          const canVote = isVoted || remaining > 0
          const color   = TOPIC_COLOR[lab.topic] ?? '#555'

          return (
            <div
              key={lab.id}
              className={`vote-row ${isVoted ? 'vote-row--voted' : ''}`}
            >
              {/* rank */}
              <span className="vote-rank">
                {idx < 3
                  ? <span className="vote-medal">{MEDALS[idx]}</span>
                  : <span className="vote-rank-num">{idx + 1}</span>
                }
              </span>

              {/* topic chip */}
              <span
                className="vote-chip"
                style={{ background: color + '22', color, borderColor: color + '55' }}
              >
                {lab.topic}
              </span>

              {/* title */}
              <Link to={lab.path} className="vote-title" tabIndex={0}>
                {lab.title}
              </Link>

              {/* bar */}
              <div className="vote-bar-wrap" title={`${pct.toFixed(0)}% del líder`}>
                <div
                  className="vote-bar"
                  style={{
                    width: `${pct}%`,
                    background: isVoted ? '#ee826d' : color,
                    opacity: isVoted ? 1 : 0.6,
                  }}
                />
              </div>

              {/* count */}
              <span className={`vote-count ${isVoted ? 'vote-count--active' : ''}`}>
                {count}
              </span>

              {/* button */}
              <button
                className={`vote-btn ${isVoted ? 'vote-btn--active' : ''} ${!canVote ? 'vote-btn--locked' : ''}`}
                onClick={() => toggle(lab.id)}
                disabled={!canVote}
                aria-label={isVoted ? 'Quitar voto' : 'Votar'}
                title={
                  isVoted     ? 'Haz clic para quitar tu voto'  :
                  remaining   ? 'Dar voto a este laboratorio'   :
                                'Quita un voto primero'
                }
              >
                <span className="vote-btn-arrow">{isVoted ? '▲' : '△'}</span>
                <span className="vote-btn-label">{isVoted ? 'Votado' : 'Votar'}</span>
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Footer ── */}
      <div className="vote-footer">
        <span className="vote-total">{total} votos totales</span>
        {remaining === 0 && (
          <span className="vote-hint-msg">
            Haz clic en <strong>Votado</strong> para cambiar tu voto
          </span>
        )}
      </div>
    </div>
  )
}
