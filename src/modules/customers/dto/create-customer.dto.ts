import {
  IsString,
  IsEmail,
  IsEnum,
  IsDateString,
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
  dateOfBirth: Date

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

  // Documents
  @IsString()
  panNumber: string

  @IsString()
  panImageUrl: string

  @IsEnum(POIDocumentType)
  poiDocumentType: POIDocumentType

  @IsString()
  poiDocumentNumber: string

  @IsString()
  poiFrontImageUrl: string

  @IsString()
  poiBackImageUrl: string

  @IsEnum(POADocumentType)
  poaDocumentType: POADocumentType

  @IsString()
  poaDocumentNumber: string

  @IsString()
  poaFrontImageUrl: string

  @IsString()
  poaBackImageUrl: string

  @IsString()
  applicantSignatureUrl: string

  @IsString()
  personalPhotoUrl: string

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
}
