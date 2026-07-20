import { useState } from 'react'
import Modal from '../Modal'
import SelectStep from './SelectStep'
import AssignStep from './AssignStep'
import PreviewStep from './PreviewStep'
import { eyebrow, stepTitle, closeBtn } from './styles'
import { IconClose } from '../icons'

const STEP_TITLES = { select: 'Select Exercises', assign: 'Assign to Blocks', preview: 'Preview & Generate' }

// Effective programme interval for generated blocks: the draft's first
// existing block's active/recover, or a 45/15 fallback if it has none yet.
// There's no programmes.interval field in the real schema (only per-block
// active_seconds/recover_seconds) — see docs/architecture.md's Quick
// Select section for why this is computed here instead of stored anywhere.
function effectiveInterval(programme) {
  const first = programme.blocks[0]
  return { active: first?.active || 45, recover: first?.recover || 15 }
}

function buildBlocks(shortlist, interval) {
  const blockNums = [...new Set(shortlist.filter((i) => i.block != null).map((i) => i.block))].sort((a, b) => a - b)
  return blockNums.map((n) => ({
    id: crypto.randomUUID(),
    name: null,
    repeat: 3,
    active: interval.active,
    recover: interval.recover,
    activities: shortlist
      .filter((i) => i.block === n)
      .map((item) => ({ id: crypto.randomUUID(), name: item.name, reps: '', weight: '', notes: '' })),
  }))
}

export default function QuickSelectModal({ open, onClose, programme, onGenerate }) {
  const [step, setStep] = useState('select')
  const [shortlist, setShortlist] = useState([])

  // Closing at any step (X button) discards the whole draft — no
  // autosave/resume — and the next open always starts fresh at 'select'.
  function handleClose() {
    setStep('select')
    setShortlist([])
    onClose()
  }

  function toggleSelect(exercise) {
    setShortlist((list) =>
      list.some((i) => i.id === exercise.id)
        ? list.filter((i) => i.id !== exercise.id)
        : [...list, { id: exercise.id, name: exercise.name, group: exercise.category, block: null }]
    )
  }

  function assignBlock(itemId, block) {
    setShortlist((list) => list.map((i) => (i.id === itemId ? { ...i, block } : i)))
  }

  function removeItem(itemId) {
    setShortlist((list) => list.filter((i) => i.id !== itemId))
  }

  // Single drop handler for both within-block reorder and cross-block
  // reassignment — both are the same splice-and-reinsert, the only
  // difference is whether `block` changes. Cross-block drag is this app's
  // own extension past the design reference (whose PreviewStep only wires
  // within-block reorder).
  function moveItem(itemId, targetBlock, targetIndex) {
    setShortlist((list) => {
      const from = list.findIndex((i) => i.id === itemId)
      if (from === -1) return list
      const next = [...list]
      const [moved] = next.splice(from, 1)
      const updated = { ...moved, block: targetBlock }
      const blockItems = next.filter((i) => i.block === targetBlock)
      const anchor = blockItems[targetIndex]
      const insertAt = anchor ? next.findIndex((i) => i.id === anchor.id) : next.length
      next.splice(insertAt, 0, updated)
      return next
    })
  }

  function handleGenerate() {
    const interval = effectiveInterval(programme)
    const newBlocks = buildBlocks(shortlist, interval)
    onGenerate(newBlocks)
    setStep('select')
    setShortlist([])
  }

  return (
    <Modal open={open} onClose={handleClose} variant="fullBleed" ariaLabel="Quick Create">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px var(--shell-px-mobile) 0', flexShrink: 0 }}>
        <div>
          <div style={eyebrow}>Quick Create</div>
          <h2 style={stepTitle}>{STEP_TITLES[step]}</h2>
        </div>
        <button onClick={handleClose} aria-label="Close" style={{ ...closeBtn, marginTop: 2 }}>
          <IconClose size={16} />
        </button>
      </div>

      {step === 'select' && (
        <SelectStep
          shortlist={shortlist}
          onToggle={toggleSelect}
          onDone={() => setStep('assign')}
        />
      )}

      {step === 'assign' && (
        <AssignStep
          shortlist={shortlist}
          onAssign={assignBlock}
          onBack={() => setStep('select')}
          onNext={() => setStep('preview')}
        />
      )}

      {step === 'preview' && (
        <PreviewStep
          shortlist={shortlist}
          onRemove={removeItem}
          onUnassign={(id) => assignBlock(id, null)}
          onMove={moveItem}
          onBack={() => setStep('assign')}
          onGenerate={handleGenerate}
        />
      )}
    </Modal>
  )
}
