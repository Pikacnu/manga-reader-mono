import NavBar from '@/src/components/navbar';

export default function TermsOfService() {
  return (
    <>
      <NavBar />
      <div className='mx-auto p-8 text-white max-w-4xl overflow-y-auto w-full h-full'>
        <h1 className='text-4xl font-bold mb-8'>Terms of Service</h1>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            1. Content Upload and Sharing
          </h2>
          <p className='mb-4 text-gray-300'>
            By uploading any files (including but not limited to images, manga
            chapters, and covers) to Manga Reader (&quot;the Website&quot;), you
            explicitly grant the Website a worldwide, non-exclusive,
            royalty-free, transferable license to use, reproduce, distribute,
            display, and perform the content in connection with the service
            provided by the Website.
          </p>
          <p className='mb-4 text-gray-300'>
            You acknowledge and agree that any content you upload will be made
            publicly available and can be accessed, viewed, and shared by other
            users of the Website. You represent and warrant that you have all
            necessary rights and permissions to upload and share such content.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            2. Copyright and Liability
          </h2>
          <p className='mb-4 text-gray-300'>
            Manga Reader acts as a platform for user-generated content and does
            not actively monitor or review all uploaded material. The Website
            assumes no liability for any copyright infringement, illegal
            content, or other violations of third-party rights arising from user
            uploads.
          </p>
          <p className='mb-4 text-gray-300'>
            The user who uploads the content is solely responsible for ensuring
            that the content does not violate any laws or regulations, including
            copyright laws. You agree to indemnify and hold harmless Manga
            Reader, its operators, and affiliates from any claims, damages, or
            expenses arising out of your violation of these Terms or any
            third-party rights.
          </p>
          <p className='mb-4 text-gray-300'>
            If you believe that your copyrighted work has been infringed upon,
            please contact us immediately with proof of ownership, and we will
            take appropriate action in accordance with our takedown policy.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            3. Content Storage and Deletion
          </h2>
          <p className='mb-4 text-gray-300'>
            Uploaded images and data are stored on our servers to provide the
            service. While we strive to ensure data integrity, we do not
            guarantee that your data will be preserved indefinitely. We
            recommend keeping your own backups.
          </p>
          <p className='mb-4 text-gray-300'>
            <strong>Deletion Process:</strong> When a user or administrator
            initiates the deletion of content (such as a book or chapter), the
            content is not immediately permanently removed from our storage
            systems. Instead, the following process occurs:
          </p>
          <ul className='list-disc list-inside mb-4 text-gray-300 ml-4'>
            <li>
              The content is immediately &quot;soft deleted&quot; or hidden from
              public view. It will no longer be accessible via the
              Website&apos;s interface or API to general users.
            </li>
            <li>
              The actual files may remain on our servers for a retention period
              determined by the platform administrators for audit, recovery, or
              legal compliance purposes.
            </li>
            <li>
              Permanent deletion of the files from the physical storage is
              executed periodically according to our internal maintenance
              schedules.
            </li>
          </ul>
          <p className='mb-4 text-gray-300'>
            Manga Reader reserves the right to determine the specific timing and
            method of permanent deletion. We also reserve the right to remove
            any content at any time, without prior notice, if it violates these
            Terms or for any other reason deemed necessary by the
            administrators.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>4. User Conduct</h2>
          <p className='mb-4 text-gray-300'>
            You agree not to use the Website to upload, post, or transmit any
            content that is unlawful, harmful, threatening, abusive, harassing,
            defamatory, vulgar, obscene, libelous, invasive of another&apos;s
            privacy, hateful, or racially, ethnically, or otherwise
            objectionable.
          </p>
        </section>
      </div>
    </>
  );
}
