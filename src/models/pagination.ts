import { ApiProperty } from '@nestjs/swagger';

export class Pagination {
  @ApiProperty()
  next: string;
  @ApiProperty()
  prev: string;
}

export type ResponseWithPagination<T extends unknown> = {
  data: T[];
  paging: Pagination;
};

export type Response<T extends unknown> = {
  data: T;
};

type Constructor<T = {}> = new (...args: any[]) => T;

export const WithResponse = <T extends Constructor>(Base: T) => {
  class ResponseDto {
    @ApiProperty({ type: () => Base })
    data: typeof Base;
  }

  return ResponseDto;
};

export const WithPagination = <T extends Constructor>(Base: T) => {
  class ResponseWithPaginationDto {
    @ApiProperty({ type: (): T[] => [Base] })
    data: (typeof Base)[];
    @ApiProperty({ type: () => Pagination })
    paging: Pagination;
  }

  return ResponseWithPaginationDto;
};
