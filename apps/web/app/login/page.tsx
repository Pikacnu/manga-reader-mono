'use client';
import { authClient } from '@/src/utils/authClient';
import { useState } from 'react';

enum EmailAuthSectionType {
  SIGNIN,
  SIGNUP,
  FORGET_PASSWORD,
}

export default function LoginPage() {
  const [EmailAuthType, setEmailAuthType] = useState<EmailAuthSectionType>(
    EmailAuthSectionType.SIGNIN,
  );

  return (
    <div className='text-white w-full h-full flex items-center justify-center'>
      <div className=' w-full grow flex flex-col items-center justify-center'>
        <h1 className='text-4xl mb-4'>Signin</h1>
        <hr className='my-8 border-gray-600 col-span-6 w-full' />
        <div className='grid grid-cols-6'>
          <div className='col-span-6 flex flex-col items-center justify-center'>
            <button
              className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
              onClick={() =>
                authClient.signIn.social({
                  provider: 'discord',
                })
              }
            >
              Signin with Discord
            </button>
          </div>
          <hr className='my-8 border-gray-600 col-span-6 w-full' />
          <div className='col-span-6 flex flex-col items-center justify-center'>
            <h2 className='text-2xl mb-4'>Email</h2>
            <div className='flex gap-2 mb-4'>
              <button
                className={`py-2 px-4 rounded ${
                  EmailAuthType === EmailAuthSectionType.SIGNIN
                    ? 'bg-green-600'
                    : 'bg-gray-700'
                }`}
                onClick={() => setEmailAuthType(EmailAuthSectionType.SIGNIN)}
                type='button'
              >
                Sign In
              </button>
              <button
                className={`py-2 px-4 rounded ${
                  EmailAuthType === EmailAuthSectionType.SIGNUP
                    ? 'bg-green-600'
                    : 'bg-gray-700'
                }`}
                onClick={() => setEmailAuthType(EmailAuthSectionType.SIGNUP)}
                type='button'
              >
                Sign Up
              </button>
              <button
                className={`py-2 px-4 rounded ${
                  EmailAuthType === EmailAuthSectionType.FORGET_PASSWORD
                    ? 'bg-green-600'
                    : 'bg-gray-700'
                }`}
                onClick={() =>
                  setEmailAuthType(EmailAuthSectionType.FORGET_PASSWORD)
                }
                type='button'
              >
                Forgot Password
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const email = formData.get('email') as string;
                const password = formData.get('password') as string;
                const name = formData.get('name') as string;
                const rememberMe = formData.get('rememberMe') === 'on';
                try {
                  if (EmailAuthType === EmailAuthSectionType.SIGNIN) {
                    await authClient.signIn.email(
                      {
                        email,
                        password,
                        rememberMe,
                      },
                      {
                        onError: (ctx) => {
                          // Handle the error
                          if (ctx.error.status === 403) {
                            alert('Please verify your email address');
                          }
                        },
                      },
                    );
                  } else if (EmailAuthType === EmailAuthSectionType.SIGNUP) {
                    await authClient.signUp.email({
                      email,
                      password,
                      name: name,
                      callbackURL: window.location.origin,
                    });
                  } else if (
                    EmailAuthType === EmailAuthSectionType.FORGET_PASSWORD
                  ) {
                    await authClient.requestPasswordReset({
                      email,
                      redirectTo: window.location.origin + '/reset-password',
                    });
                  } else {
                    throw new Error('Invalid email auth type');
                  }
                } catch (error) {
                  alert('Login failed: ' + (error as Error).message);
                }
              }}
              className='flex flex-col gap-4 w-full max-w-sm'
            >
              <input
                type='email'
                name='email'
                placeholder='Email'
                required
                className='w-full p-2 rounded bg-gray-800 border border-gray-600 text-white'
              />
              {EmailAuthType !== EmailAuthSectionType.FORGET_PASSWORD && (
                <input
                  type='password'
                  name='password'
                  placeholder='Password'
                  required
                  className='w-full p-2 rounded bg-gray-800 border border-gray-600 text-white'
                />
              )}
              {EmailAuthType === EmailAuthSectionType.SIGNUP ? (
                <input
                  type='text'
                  name='name'
                  placeholder='Name'
                  required
                  className='w-full p-2 rounded bg-gray-800 border border-gray-600 text-white'
                />
              ) : (
                <div className='flex items-center gap-2'>
                  {EmailAuthType === EmailAuthSectionType.SIGNIN && (
                    <>
                      <input
                        type='checkbox'
                        name='rememberMe'
                        id='rememberMe'
                      />
                      <label htmlFor='rememberMe'>Remember Me</label>
                    </>
                  )}
                </div>
              )}
              <button
                type='submit'
                className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'
              >
                {EmailAuthType === EmailAuthSectionType.SIGNIN
                  ? 'Sign In'
                  : EmailAuthType === EmailAuthSectionType.SIGNUP
                  ? 'Sign Up'
                  : 'Send Reset Email'}
              </button>
            </form>
          </div>
        </div>
        <div className=' p-4 bg-gray-200/10 rounded mt-4'>
          <p className='text-sm text-gray-400'>
            By logging in, you agree to our{' '}
            <a
              href='/terms'
              className='underline'
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href='/privacy'
              className='underline'
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
