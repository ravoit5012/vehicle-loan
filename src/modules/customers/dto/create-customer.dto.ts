import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  ArrayNotEmpty,
} from 'class-validator'
import {
  RelationType,
  MaritalStatus,
  Gender,
  Religion,
  NomineeRelation,
  POIDocumentType,
  POADocumentType,
  AccountStatus,
} from '@prisma/client'
import { Transform } from 'class-transformer'
export class CreateCustomerDto {
  // Personal
  @IsString()
  applicantName: string

  @IsString()
  guardianName: string

  @IsEnum(RelationType)
  relationType: RelationType

  @IsEnum(Religion)
  religion: Religion

  @IsString()
  village: string

  @IsString()
  postOffice: string

  @IsString()
  policeStation: string

  @IsString()
  district: string

  @IsString()
  pinCode: string

  @IsString()
  mobileNumber: string

  @IsEnum(MaritalStatus)
  maritalStatus: MaritalStatus

  @IsEnum(Gender)
  gender: Gender

  @IsDateString()
  dateOfBirth: string

  // Nominee
  @IsString()
  nomineeName: string

  @IsString()
  nomineeMobileNumber: string

  @IsEnum(NomineeRelation)
  nomineeRelation: NomineeRelation

  @IsString()
  nomineeVillage: string

  @IsString()
  nomineePostOffice: string

  @IsString()
  nomineePoliceStation: string

  @IsString()
  nomineeDistrict: string

  @IsString()
  nomineePinCode: string

  @IsString()
  panNumber: string

  @IsString()
  @IsOptional()
  panImageUrl?: string

  @IsEnum(POIDocumentType)
  poiDocumentType: POIDocumentType

  @IsString()
  poiDocumentNumber: string

  @IsString()
  @IsOptional()
  poiFrontImageUrl?: string

  @IsString()
  @IsOptional()
  poiBackImageUrl?: string

  @IsEnum(POADocumentType)
  poaDocumentType: POADocumentType

  @IsString()
  poaDocumentNumber: string

  @IsString()
  @IsOptional()
  poaFrontImageUrl?: string

  @IsString()
  @IsOptional()
  poaBackImageUrl?: string

  @IsString()
  @IsOptional()
  applicantSignatureUrl?: string

  @IsString()
  @IsOptional()
  personalPhotoUrl?: string

    // Documents
  @IsString()
  nomineePanNumber: string

  @IsString()
  @IsOptional()
  nomineePanImageUrl?: string

  @IsEnum(POIDocumentType)
  nomineePoiDocumentType: POIDocumentType

  @IsString()
  nomineePoiDocumentNumber: string

  @IsString()
  @IsOptional()
  nomineePoiFrontImageUrl?: string

  @IsString()
  @IsOptional()
  nomineePoiBackImageUrl?: string

  @IsEnum(POADocumentType)
  nomineePoaDocumentType: POADocumentType

  @IsString()
  nomineePoaDocumentNumber: string

  @IsString()
  @IsOptional()
  nomineePoaFrontImageUrl?: string

  @IsString()
  @IsOptional()
  nomineePoaBackImageUrl?: string

  @IsString()
  @IsOptional()
  nomineeSignatureUrl?: string

  @IsString()
  @IsOptional()
  nomineePersonalPhotoUrl?: string

  // Account
  @IsString()
  memberId: string

  @IsEmail()
  email: string

  @IsString()
  password: string

  @IsEnum(AccountStatus)
  accountStatus: AccountStatus

  // Relations
  @IsString()
  managerId: string

  @IsString()
  agentId: string

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}


export class UploadExtraDocumentsDto {

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) => {
    // Important: when only 1 document is sent,
    // Nest receives string instead of array.
    // This converts it safely to array.
    if (!Array.isArray(value)) {
      return [value];
    }
    return value;
  })
  documentNames: string[];
}