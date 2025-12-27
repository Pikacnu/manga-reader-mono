import NavBar from '@/src/components/navbar';

export default function PrivacyPolicy() {
  return (
    <>
      <NavBar />
      <div className='container mx-auto p-8 text-white max-w-4xl overflow-y-auto'>
        <h1 className='text-4xl font-bold mb-8'>Privacy Policy</h1>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            1. Information We Collect
          </h2>
          <p className='mb-4 text-gray-300'>
            We collect information you provide directly to us, such as when you
            create an account, upload content, or communicate with us. This may
            include your username, email address, and any content you upload.
          </p>
          <p className='mb-4 text-gray-300'>
            We also automatically collect certain information when you access
            the Website, such as your IP address, browser type, and usage data
            (e.g., pages viewed, reading history).
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            2. How We Use Your Information
          </h2>
          <p className='mb-4 text-gray-300'>
            We use the information we collect to:
          </p>
          <ul className='list-disc list-inside mb-4 text-gray-300 ml-4'>
            <li>Provide, maintain, and improve our services.</li>
            <li>Process your uploads and manage your account.</li>
            <li>
              Monitor and analyze trends, usage, and activities in connection
              with our services.
            </li>
            <li>
              Detect, investigate, and prevent fraudulent transactions and other
              illegal activities.
            </li>
          </ul>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            3. Data Storage and Security
          </h2>
          <p className='mb-4 text-gray-300'>
            We take reasonable measures to help protect information about you
            from loss, theft, misuse, and unauthorized access, disclosure,
            alteration, and destruction. However, no internet transmission or
            electronic storage is ever completely secure or error-free.
          </p>
          <p className='mb-4 text-gray-300'>
            Uploaded files are stored on our secure servers. We retain your
            personal information and uploaded content for as long as necessary
            to provide the services you have requested, or for other essential
            purposes such as complying with our legal obligations, resolving
            disputes, and enforcing our policies.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            4. Content Removal and Data Deletion
          </h2>
          <p className='mb-4 text-gray-300'>
            If you wish to delete your account or specific content you have
            uploaded, you may do so through the dashboard interface or by
            contacting us.
          </p>
          <p className='mb-4 text-gray-300'>
            Please note that when content is deleted:
          </p>
          <ul className='list-disc list-inside mb-4 text-gray-300 ml-4'>
            <li>It is immediately removed from public view on the Website.</li>
            <li>
              Copies of the content may remain in our backup systems for a
              limited period of time before being permanently overwritten or
              deleted.
            </li>
            <li>
              We may retain certain data as required by law or for legitimate
              business purposes.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
