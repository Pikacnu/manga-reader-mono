'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateBookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const res = await fetch('/api/book/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
          description: formData.description,
          tags: tagsArray,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/book/${data.bookId}/edit`);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create book');
      }
    } catch (error) {
      console.error('Error creating book:', error);
      alert('An error occurred while creating the book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-8 max-w-2xl mx-auto text-white'>
      <Link
        href='/dashboard'
        className='flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors'
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </Link>

      <h1 className='text-3xl font-bold mb-8'>Create New Book</h1>

      <form
        onSubmit={handleSubmit}
        className='space-y-6'
      >
        <div>
          <label className='block text-sm font-medium mb-2 text-gray-300'>
            Title
          </label>
          <input
            type='text'
            required
            className='w-full bg-gray-800 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500 transition-colors'
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder='Enter book title'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-2 text-gray-300'>
            Author
          </label>
          <input
            type='text'
            required
            className='w-full bg-gray-800 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500 transition-colors'
            value={formData.author}
            onChange={(e) =>
              setFormData({ ...formData, author: e.target.value })
            }
            placeholder='Enter author name'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-2 text-gray-300'>
            Description
          </label>
          <textarea
            required
            rows={4}
            className='w-full bg-gray-800 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500 transition-colors resize-none'
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder='Enter book description'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-2 text-gray-300'>
            Tags (comma separated)
          </label>
          <input
            type='text'
            className='w-full bg-gray-800 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500 transition-colors'
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder='action, adventure, fantasy'
          />
        </div>

        <button
          type='submit'
          disabled={loading}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creating...' : 'Create Book'}
        </button>
      </form>
    </div>
  );
}
