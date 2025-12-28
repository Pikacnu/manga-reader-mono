'use client';
import Link from 'next/link';
import { useSession } from '@/src/context/session';
import {
  HomeIcon,
  LayoutDashboard,
  LogInIcon,
  SearchIcon,
  FileText,
  Shield,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authClient } from '../utils/authClient';

export default function NavBar({ className }: { className?: string }) {
  const session = useSession();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = ['title', 'author', 'description', 'tags'];
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const regex = /(\w+):"([^"]+)"|(\w+):(\S+)|(\S+)/g;
    let match;
    while ((match = regex.exec(search)) !== null) {
      if (match[1]) {
        params.append(match[1], match[2]);
      } else if (match[3]) {
        params.append(match[3], match[4]);
      } else if (match[5]) {
        const currentQ = params.get('q') || '';
        params.set('q', currentQ ? `${currentQ} ${match[5]}` : match[5]);
      }
    }

    if (params.toString()) {
      router.push(`/?${params.toString()}`);
    } else {
      router.push('/');
    }
  };

  const addFilter = (filter: string) => {
    setSearch((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${filter}:` : `${filter}:`;
    });
    // Keep focus?
  };

  useEffect(() => {
    //Setup search from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const qParams: string[] = [];
    suggestions.forEach((s) => {
      const value = urlParams.get(s);
      if (value) {
        qParams.push(`${s}:${value}`);
      }
    });
    const q = urlParams.get('q');
    if (q) {
      qParams.push(q);
    }
    if (qParams.length > 0) {
      setSearch(qParams.join(' '));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <nav
      className={`bg-gray-800 p-2 text-white ${className} self-start w-full flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0 z-50`}
    >
      <ul className='flex space-x-4 *:bg-black/10 *:hover:bg-black/40 *:active:bg-gray-600 *:rounded-full *:p-2 w-full md:w-auto justify-between md:justify-start px-2 md:px-0 items-center flex-row'>
        <li>
          <Link
            href='/'
            className='hover:underline'
          >
            <HomeIcon></HomeIcon>
          </Link>
        </li>
        <li>
          {!!session ? (
            <Link
              href='/dashboard'
              className='hover:underline'
            >
              <LayoutDashboard></LayoutDashboard>
            </Link>
          ) : (
            <Link
              href='/login'
              className='hover:underline'
            >
              <LogInIcon></LogInIcon>
            </Link>
          )}
        </li>
        <li>
          <Link
            href='/terms'
            className='hover:underline text-sm'
            title='Terms of Service'
          >
            <FileText size={20} />
          </Link>
        </li>
        <li>
          <Link
            href='/privacy'
            className='hover:underline text-sm'
            title='Privacy Policy'
          >
            <Shield size={20} />
          </Link>
        </li>
        {!!session && (
          <button
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push('/');
                  },
                },
              });
            }}
          >
            <LogOut />
          </button>
        )}
      </ul>
      <form
        onSubmit={handleSearch}
        className='relative w-full md:w-auto md:mr-4 group px-2 md:px-0'
      >
        <input
          type='text'
          placeholder='Search... (e.g. title:abc)'
          className='bg-gray-700 text-white px-4 py-2 md:py-1 pl-10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        <SearchIcon
          size={18}
          className='absolute left-5 md:left-3 top-1/2 -translate-y-1/2 text-gray-400'
        />
        {showSuggestions && (
          <div className='absolute top-full left-0 bg-gray-800 border border-gray-700 rounded mt-1 w-full shadow-lg overflow-hidden z-50'>
            <div className='p-2 text-xs text-gray-400 uppercase font-bold'>
              Filters
            </div>
            {suggestions.map((s) => (
              <div
                key={s}
                className='px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm'
                onClick={() => addFilter(s)}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </form>
    </nav>
  );
}
