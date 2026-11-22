import { useEffect, useRef } from 'react'

export type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement
      const firstFocusable = overlayRef.current?.querySelector(
        'button, input, select, textarea, [href]'
      ) as HTMLElement | null
      firstFocusable?.focus()
    } else {
      if (
        previousActiveElement.current instanceof HTMLElement
      ) {
        previousActiveElement.current.focus()
      }
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) {
      onClose()
    }
  }

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
