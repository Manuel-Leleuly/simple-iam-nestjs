import { ApiProperty } from '@nestjs/swagger';

export class ErrorMessage {
  @ApiProperty()
  message: string;
}

export class ValidationErrorMessage {
  @ApiProperty()
  messages: string[];
}
