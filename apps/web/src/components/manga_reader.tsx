'use clent';

import { useEffect, useRef, useState } from 'react';
import { Page, PagesPerView } from '@/src/types/manga';
import { MangaPage } from '@/src/components/manga_page';

export enum PageDirection {
  RIGHT = 'right',
  LEFT = 'left',
}

export enum DeviceSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

const maxPagesToPreload = 20;

export function MangaReader({
  pages = [],
  startDirection = PageDirection.RIGHT,
  pageCountPerView = PagesPerView.TWO,
  bookId,
}: {
  pages?: Page[];
  startDirection?: PageDirection;
  pageCountPerView?: PagesPerView;
  bookId: string;
}) {
  const pageBase64URLs = useRef<Map<string, string>>(new Map());
  const loadedPages = useRef<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLoadedPagesState] = useState<Set<string>>(new Set());
  const [deviceSize, setDeviceSize] = useState<DeviceSize>();
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const deltaPage = deviceSize === DeviceSize.Small ? 1 : 2;

    if (isLeftSwipe) {
      // Swipe Left (<-)
      if (startDirection === PageDirection.LEFT) {
        // LTR: Next Page
        if (currentPage + deltaPage < pages.length)
          setCurrentPage(currentPage + deltaPage);
      } else {
        // RTL: Prev Page
        if (currentPage - deltaPage >= 0)
          setCurrentPage(currentPage - deltaPage);
      }
    }

    if (isRightSwipe) {
      // Swipe Right (->)
      if (startDirection === PageDirection.LEFT) {
        // LTR: Prev Page
        if (currentPage - deltaPage >= 0)
          setCurrentPage(currentPage - deltaPage);
      } else {
        // RTL: Next Page
        if (currentPage + deltaPage < pages.length)
          setCurrentPage(currentPage + deltaPage);
      }
    }
  };

  // Fetch initial history
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`/api/user/history?bookIdx=${bookId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.history) {
            let page = data.history.pageNumber;
            if (page % 2 !== 0) page -= 1;
            setCurrentPage(page);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [bookId]);

  // Save history (debounced)
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      fetch('/api/user/history', {
        method: 'POST',
        body: JSON.stringify({ bookIdx: bookId, page: currentPage }),
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentPage, bookId, isLoading]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      setClientWidth(document.body.clientWidth);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPageBase64 = async (page: Page) => {
    if (!page || !('id' in page)) return null;
    if (pageBase64URLs.current.has(page.id.toString())) {
      return pageBase64URLs.current.get(page.id.toString());
    }

    if (loadedPages.current.has(page.id.toString())) {
      return null;
    }
    loadedPages.current.add(page.id.toString());

    try {
      const response = await fetch(
        page.getImageUrl
          ? page.getImageUrl(
              deviceSize === DeviceSize.Small
                ? Math.min(clientWidth, 600)
                : deviceSize === DeviceSize.Medium
                ? Math.min(clientWidth / 2, 800)
                : Math.min(clientWidth / 2, 1200),
            )
          : page.imageUrl,
      );
      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        pageBase64URLs.current.set(page.id.toString(), '');
        loadedPages.current.delete(page.id.toString());
        return null;
      }
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      return new Promise<string>((resolve) => {
        reader.onloadend = () => {
          pageBase64URLs.current.set(
            page.id.toString(),
            reader.result as string,
          );
          setLoadedPagesState((prev) => new Set(prev).add(page.id.toString()));
          resolve(reader.result as string);
        };
      });
    } catch (error) {
      console.error('Error preloading page:', page.id, page.imageUrl, error);
      loadedPages.current.delete(page.id.toString());
      pageBase64URLs.current.set(page.id.toString(), '');
      return null;
    } finally {
      if (pageBase64URLs.current.size > maxPagesToPreload) {
        const keys = Array.from(pageBase64URLs.current.keys());
        for (let i = 0; i < keys.length - maxPagesToPreload; i++) {
          pageBase64URLs.current.delete(keys[i]);
          loadedPages.current.delete(keys[i]);
        }
      }
    }
  };

  function getPageURL(page: Page) {
    if (pageBase64URLs.current.has(page.id.toString())) {
      const url = pageBase64URLs.current.get(page.id.toString());
      if (url?.trim().length !== 0) return url;
      console.log('Error loading page:', page.id);
      return undefined;
    }
    getPageBase64(page);
    return undefined;
  }

  function getPage(index: number) {
    if (index < 0 || index >= pages.length)
      return {
        id: -1 * (index + 1000),
        imageUrl: '',
        isBlank: true,
      } as Page;
    const page = pages[index];
    return page;
  }

  useEffect(() => {
    const preloadPages = async () => {
      const nextPageIndex = currentPage + 2;
      const prevPageIndex = currentPage - 2;
      if (nextPageIndex < pages.length) {
        await getPageBase64(pages[nextPageIndex]);
        await getPageBase64(pages[nextPageIndex + 1]);
      }
      if (prevPageIndex >= 0) {
        await getPageBase64(pages[prevPageIndex]);
        await getPageBase64(pages[prevPageIndex - 1]);
      }
    };
    preloadPages();
    if (document.body) {
      switch (true) {
        case document.body.clientWidth < 640:
          setDeviceSize(DeviceSize.Small);
          break;
        case document.body.clientWidth >= 640 &&
          document.body.clientWidth < 1024:
          setDeviceSize(DeviceSize.Medium);
          break;
        case document.body.clientWidth >= 1024:
          setDeviceSize(DeviceSize.Large);
          break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    if (isLoading) return;
    const loadPage = async () => {
      await Promise.all([
        getPageBase64(getPage(currentPage)),
        getPageBase64(getPage(currentPage + 1)),
      ]);
    };
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <div className='w-full h-full flex items-center justify-center bg-black text-white overflow-hidden'>
      <div className='flex flex-row items-center *:grow w-full h-full'>
        {isLoading ? (
          <div className='w-full h-full flex items-end justify-center'>
            <p className='text-gray-400'>Loading...</p>
          </div>
        ) : (
          <div
            className='w-full flex flex-row overflow-hidden relative bottom-0 h-full'
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className=' z-10 absolute inset-0 bg-black opacity-0 cursor-pointer w-full h-full grid grid-cols-2'>
              <div
                onClick={() => {
                  const deltaPage = deviceSize === DeviceSize.Small ? 1 : 2;
                  switch (startDirection) {
                    case PageDirection.RIGHT: {
                      if (currentPage + deltaPage < pages.length)
                        setCurrentPage(currentPage + deltaPage);
                      break;
                    }
                    case PageDirection.LEFT: {
                      if (currentPage - deltaPage >= 0)
                        setCurrentPage(currentPage - deltaPage);
                      break;
                    }
                  }
                }}
              ></div>
              <div
                onClick={() => {
                  const deltaPage = deviceSize === DeviceSize.Small ? 1 : 2;
                  switch (startDirection) {
                    case PageDirection.RIGHT: {
                      if (currentPage - deltaPage >= 0)
                        setCurrentPage(currentPage - deltaPage);
                      break;
                    }

                    case PageDirection.LEFT: {
                      if (currentPage + deltaPage < pages.length)
                        setCurrentPage(currentPage + deltaPage);
                      break;
                    }
                  }
                }}
              ></div>
            </div>
            <div className=' w-full h-full flex justify-end bg-inherit overflow-hidden select-none z-0'>
              {(pages[currentPage] && pages[currentPage]?.isBlank) || (
                <MangaPage
                  imageUrl={
                    getPageURL(
                      getPage(
                        currentPage +
                          (startDirection === PageDirection.RIGHT ? 1 : 0),
                      ),
                    ) || 'blank'
                  }
                  isBlurred={pages[currentPage]?.isBlurred}
                  isBlank={
                    pages[currentPage]?.isBlank ||
                    !getPageURL(getPage(currentPage + 1))
                  }
                  objectPosition={
                    deviceSize === DeviceSize.Small ||
                    pageCountPerView === PagesPerView.ONE
                      ? 'center'
                      : 'right'
                  }
                ></MangaPage>
              )}
            </div>
            {deviceSize !== DeviceSize.Small &&
              pageCountPerView !== PagesPerView.ONE && (
                <div className=' w-full h-full flex justify-start bg-inherit overflow-hidden select-none z-0'>
                  {(pages[currentPage] && pages[currentPage + 1]?.isBlank) || (
                    <MangaPage
                      imageUrl={
                        getPageURL(
                          getPage(
                            currentPage +
                              (startDirection === PageDirection.RIGHT ? 0 : 1),
                          ),
                        ) || 'blank'
                      }
                      isBlurred={pages[currentPage + 1]?.isBlurred}
                      isBlank={
                        pages[currentPage + 1]?.isBlank ||
                        !getPageURL(getPage(currentPage + 1))
                      }
                      objectPosition='left'
                    ></MangaPage>
                  )}
                </div>
              )}
            {
              //page indicator
            }
            <div className=' absolute z-20 rounded-xl p-4 bg-black bg-opacity-50 bottom-16 left-1/2 -translate-x-1/2 text-sm cursor-default opacity-10 hover:opacity-100 transition-opacity max-md:opacity-100'>
              {currentPage + 1} / {pages.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
