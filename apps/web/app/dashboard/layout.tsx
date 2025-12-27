import NavBar from '@/src/components/navbar';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex flex-col h-screen'>
      <NavBar />
      <div className='flex flex-row grow overflow-hidden'>
        {/* Main Content */}
        <main className='flex-1 overflow-auto bg-gray-900 text-white'>
          {children}
        </main>
      </div>
    </div>
  );
}
