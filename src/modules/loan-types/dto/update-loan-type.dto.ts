import { PartialType } from '@nestjs/mapped-types';
import { CreateLoanTypeDto } from './create-loan-type.dto';
import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { STATUS as LoanStatus } from '../../../common/enums/status.enum';
import { InterestType } from '../../../common/enums/interest-type.enum';
import { CollectionFrequency } from '../../../common/enums/collection-frequency.enum';

class FeeDto {
  @IsNumber()
  amount: number;

  @IsBoolean()
  isPercentage: boolean;
}

class OtherFeeDto extends FeeDto {
  @IsString()
  description: string;
}

export class UpdateLoanTypeDto extends PartialType(CreateLoanTypeDto) {
  @IsOptional() loanName?: string;
  @IsOptional() status?: LoanStatus;
  @IsOptional() description?: string;
  @IsOptional() minAmount?: number;
  @IsOptional() maxAmount?: number;
  @IsOptional() interestRate?: number;
  @IsOptional() interestType?: InterestType;
  @IsOptional() processingFees?: FeeDto;
  @IsOptional() insuranceFees?: FeeDto;
  @IsOptional() otherFees?: OtherFeeDto[];
  @IsOptional() loanDuration?: number;
  @IsOptional() collectionFreq?: CollectionFrequency;
}