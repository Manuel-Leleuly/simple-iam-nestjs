import { Pagination } from 'src/models/pagination';

export class PaginationHelper {
  static getPagination = (urlStr: string, hasNext: boolean): Pagination => {
    const url = new URL(urlStr);

    let next = url.pathname;
    let prev = url.pathname;

    const nextQueryParams: Record<string, string> = {};
    const prevQueryParams: Record<string, string> = {};

    for (const [key, value] of url.searchParams.entries()) {
      if (key === 'offset') continue;
      nextQueryParams[key] = value;
      prevQueryParams[key] = value;
    }

    const selectedLimit = url.searchParams.get('limit') ?? '10';
    const selectedOffset = url.searchParams.get('offset') ?? '0';

    nextQueryParams['offset'] = (+selectedLimit + +selectedOffset).toString();
    if (+selectedOffset > +selectedLimit) {
      prevQueryParams['offset'] = (+selectedOffset - +selectedLimit).toString();
    }

    if (!!Object.keys(nextQueryParams).length) {
      next = `${next}?${new URLSearchParams(nextQueryParams).toString()}`;
    }

    if (!!Object.keys(prevQueryParams).length) {
      prev = `${prev}?${new URLSearchParams(prevQueryParams).toString()}`;
    }

    if (selectedOffset === '0') {
      prev = '';
    }

    if (!hasNext) {
      next = '';
    }

    return {
      next,
      prev,
    };
  };
}
