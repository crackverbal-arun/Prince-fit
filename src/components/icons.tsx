const s = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
type P = { className?: string };
export const IconHome = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...s}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>;
export const IconUsers = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...s}><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 9M22 21a7 7 0 0 0-4-6.3" /></svg>;
export const IconChart = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...s}><path d="M3 3v18h18M7 15l4-4 3 3 6-7" /></svg>;
export const IconClipboard = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...s}><rect x="5" y="4" width="14" height="18" rx="2" /><path d="M9 2h6v4H9zM9 12h6M9 16h4" /></svg>;
export const IconCheck = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...s}><path d="m5 12 5 5L20 7" /></svg>;
export const IconCamera = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...s}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></svg>;
export const IconPlus = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...s}><path d="M12 5v14M5 12h14" /></svg>;
export const IconTrash = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...s}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>;
export const IconTrophy = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...s}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></svg>;
export const IconChevron = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...s}><path d="m9 6 6 6-6 6" /></svg>;
export const IconBack = ({ className }: P) => <svg viewBox="0 0 24 24" className={className} {...s}><path d="m15 6-6 6 6 6" /></svg>;
export const IconWhatsApp = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z" /></svg>
);
