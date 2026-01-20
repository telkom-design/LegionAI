import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { UserProfile } from '~/components/auth';
import { useUser } from '~/lib/auth/useUser';
import { toggleSidebar } from '~/lib/stores/ui';

export function Header() {
  const chat = useStore(chatStore);
  const user = useUser();

  return (
    <header
      className={classNames('flex items-center justify-between gap-4 px-4 border-b h-[var(--header-height)] dark:bg-gray-950', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary">
        <button
          type="button"
          onClick={toggleSidebar}
          className="inline-flex items-center justify-center rounded-md p-1 bg-transparent text-bolt-elements-textPrimary hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <span className="i-ph:sidebar-simple-duotone text-xl" />
        </button>
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          {/* <span className="i-bolt:logo-text?mask w-[46px] inline-block" /> */}
          <img src="/logo-light-alpha.png" alt="logo" className="h-[35px] inline-block dark:hidden" />
          <img src="/logo-dark-alpha.png" alt="logo" className="h-[35px] inline-block hidden dark:block" />
        </a>
      </div>
      {chat.started && (
        <>
          <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="">
                <HeaderActionButtons chatStarted={chat.started} />
              </div>
            )}
          </ClientOnly>
        </>
      )}
      {user && (
        <>
          <ClientOnly>{() => <UserProfile />}</ClientOnly>
        </>
      )}
    </header>
  );
}
