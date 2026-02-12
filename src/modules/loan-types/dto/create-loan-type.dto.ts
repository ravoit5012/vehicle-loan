import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { STATUS as LoanStatus } from '../../../common/enums/status.enum';
import { InterestType } from '../../../common/enums/interest-type.enum';
import { CollectionFrequency } from '../../../common/enums/collection-frequency.enum';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer'

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

export class CreateLoanTypeDto {
  @IsString()
  loanName: string;

  @IsEnum(LoanStatus)
  status: LoanStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  minAmount: number;

  @IsNumber()
  maxAmount: number;

  @IsNumber()
  interestRate: number;

  @IsEnum(InterestType)
  interestType: InterestType;

  @IsOptional()
  @ValidateNested()
  @Type(() => FeeDto)
  processingFees: FeeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FeeDto)
  insuranceFees: FeeDto;

  @IsArray()
  otherFees: OtherFeeDto[];

  @IsNumber()
  loanDuration: number;

  @IsEnum(CollectionFrequency)
  collectionFreq: CollectionFrequency;
}
