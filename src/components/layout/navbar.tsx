import { Menu } from 'lucide-react'

interface NavbarProps {
  title: string
  onMenuClick: () => void
}

export function Navbar({ title, onMenuClick }: NavbarProps) {
  return (
    <header className="h-16 flex items-center gap-3 px-5 border-b border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] shrink-0">
      <button className="lg:hidden text-[#173D22]" onClick={onMenuClick} aria-label="Open sidebar">
        <Menu size={20} />
      </button>
      <h1 className="text-lg font-semibold text-[#173D22] truncate">{title}</h1>
    </header>
  )
}
