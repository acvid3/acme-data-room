import { Github, Globe, Linkedin, Mail, Send, type LucideIcon } from 'lucide-react'

export type ContactLink = {
    href: string
    label: string
    icon: LucideIcon
}

export const contactLinks: ContactLink[] = [
    { href: 'https://acvid3.com/', label: 'acvid3.com', icon: Globe },
    { href: 'mailto:acvid3@gmail.com', label: 'acvid3@gmail.com', icon: Mail },
    { href: 'https://t.me/acvid3', label: 'Telegram', icon: Send },
    { href: 'https://github.com/acvid3', label: 'GitHub', icon: Github },
    { href: 'https://linkedin.com/in/acvid3', label: 'LinkedIn', icon: Linkedin },
]
