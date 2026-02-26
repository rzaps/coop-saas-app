import { useState } from 'react'
import HelpModal from './HelpModal'

export default function HelpButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed top-4 right-4 w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center text-xl font-bold z-40"
        aria-label="Помощь"
      >
        ?
      </button>
      <HelpModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
