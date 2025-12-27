'use client';
import { authClient } from '@/src/utils/auth-client';

export default function LoginPage() {
  return (
    <div className='text-white w-full h-full flex items-center justify-center'>
      <div className=' w-full grow flex flex-col items-center justify-center'>
        <div className='grid grid-cols-6'>
          <div className='col-span-6 flex flex-col items-center justify-center'>
            <h1 className='text-4xl mb-4'>Login</h1>
            <button
              className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
              onClick={() =>
                authClient.signIn.social({
                  provider: 'discord',
                })
              }
            >
              Login with Discord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
