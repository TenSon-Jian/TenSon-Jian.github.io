import {
  ArrowUpRight,
  Braces,
  Clock,
  Copy,
  FileText,
  Folder,
  Hash,
  Home,
  Image as ImageIcon,
  Info,
  Link2,
  Menu,
  Moon,
  Palette,
  Regex,
  Sun,
  Type,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-vue-next'

/** 导航 / 通用图标（Lucide，极简线性） */
export const navIcons: Record<string, LucideIcon> = {
  home: Home,
  folder: Folder,
  'file-text': FileText,
  wrench: Wrench,
  user: Info,
  menu: Menu,
  close: X,
  sun: Sun,
  moon: Moon,
  external: ArrowUpRight,
  copy: Copy,
  hash: Hash,
  clock: Clock,
  palette: Palette,
  braces: Braces,
  'link-2': Link2,
  image: ImageIcon,
  regex: Regex,
  type: Type,
}

export const toolIcons: Record<string, LucideIcon> = {
  braces: Braces,
  palette: Palette,
  clock: Clock,
  'file-text': FileText,
  hash: Hash,
  image: ImageIcon,
  'link-2': Link2,
  regex: Regex,
  type: Type,
}

export type { LucideIcon }
