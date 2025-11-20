import { atom } from 'nanostores';

export const sidebarOpen = atom(false);

export function toggleSidebar() {
  sidebarOpen.set(!sidebarOpen.get());
}

export function openSidebar() {
  sidebarOpen.set(true);
}

export function closeSidebar() {
  sidebarOpen.set(false);
}
