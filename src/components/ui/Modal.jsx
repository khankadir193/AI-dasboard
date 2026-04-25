import { useEffect, useRef } from 'react'
import clsx from 'clsx'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  ...props 
}) => {
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      // Store previous focus with safety check
      try {
        previousFocusRef.current = document.activeElement
      } catch {
        previousFocusRef.current = null
      }
      
      // Focus modal with delay to ensure DOM is ready
      const focusTimer = setTimeout(() => {
        if (modalRef.current && typeof modalRef.current.focus === 'function') {
          modalRef.current.focus()
        }
      }, 100)
      
      // Prevent body scroll with error handling
      try {
        document.body.style.overflow = 'hidden'
      } catch {
        // Fallback for older browsers
        document.body.style.position = 'fixed'
        document.body.top = `-${window.scrollY}px`
      }

      return () => {
        clearTimeout(focusTimer)
      }
    } else {
      // Restore focus with safety check
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        try {
          previousFocusRef.current.focus()
        } catch {
          // Focus restoration failed, but don't crash
        }
      }
      
      // Restore body scroll with error handling
      try {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.top = ''
        window.scrollTo(0, parseInt(document.body.style.top || '0') * -1)
      } catch {
        // Fallback
        document.body.style.overflow = ''
      }
    }

    return () => {
      // Cleanup function
      try {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.top = ''
      } catch {
        // Ignore cleanup errors
      }
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && typeof onClose === 'function') {
        try {
          onClose()
        } catch (error) {
          console.error('Modal close handler failed:', error)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, onClose])

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget && typeof onClose === 'function') {
      try {
        onClose()
      } catch (error) {
        console.error('Modal backdrop close handler failed:', error)
      }
    }
  }

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={clsx(
          'w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl outline-none',
          'transform transition-all duration-200 scale-100 opacity-100',
          sizeClasses[size]
        )}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        {...props}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
