import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerDto, UploadExtraDocumentsDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { extname } from 'path';
import { uploadToStorage } from 'src/utils/uploadToStorage';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateCustomerDto, files: any) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    if (!dto.managerId || !dto.agentId) {
      throw new BadRequestException("Manager and agent IDs are required");
    }
    console.log("FILES RECEIVED:", files);

    try {
      const getFileUrl = async (field: keyof CreateCustomerDto, fileArr: any, fileName: string) => {
        if (dto[field]) return dto[field] as string;
        if (fileArr && fileArr[0]) {
          return await uploadToStorage(
            fileArr[0].buffer,
            `customers/${dto.applicantName}-${dto.mobileNumber}/${fileName}${extname(fileArr[0].originalname)}`,
            fileArr[0].mimetype
          );
        }
        return ''; 
      };

      const panImageUrl = await getFileUrl('panImageUrl', files?.panImage, 'pan');
      const poiFrontImageUrl = await getFileUrl('poiFrontImageUrl', files?.poiFrontImage, 'poiFrontImage');
      const poiBackImageUrl = await getFileUrl('poiBackImageUrl', files?.poiBackImage, 'poiBackImage');
      const poaFrontImageUrl = await getFileUrl('poaFrontImageUrl', files?.poaFrontImage, 'poaFrontImage');
      const poaBackImageUrl = await getFileUrl('poaBackImageUrl', files?.poaBackImage, 'poaBackImage');
      const applicantSignatureUrl = await getFileUrl('applicantSignatureUrl', files?.applicantSignature, 'signature');
      const personalPhotoUrl = await getFileUrl('personalPhotoUrl', files?.personalPhoto, 'photo');

      const nomineePanImageUrl = await getFileUrl('nomineePanImageUrl', files?.nomineePanImage, 'nomineePan');
      const nomineePoiFrontImageUrl = await getFileUrl('nomineePoiFrontImageUrl', files?.nomineePoiFrontImage, 'nomineePoiFront');
      const nomineePoiBackImageUrl = await getFileUrl('nomineePoiBackImageUrl', files?.nomineePoiBackImage, 'nomineePoiBack');
      const nomineePoaFrontImageUrl = await getFileUrl('nomineePoaFrontImageUrl', files?.nomineePoaFrontImage, 'nomineePoaFront');
      const nomineePoaBackImageUrl = await getFileUrl('nomineePoaBackImageUrl', files?.nomineePoaBackImage, 'nomineePoaBack');
      const nomineeSignatureUrl = await getFileUrl('nomineeSignatureUrl', files?.nomineeSignature, 'nomineeSignature');
      const nomineePersonalPhotoUrl = await getFileUrl('nomineePersonalPhotoUrl', files?.nomineePersonalPhoto, 'nomineePhoto');
      return this.prisma.customer.create({
        data: {
          ...dto,
          password: hashedPassword,
          dateOfBirth: new Date(dto.dateOfBirth),
          managerId: dto.managerId,
          agentId: dto.agentId,
          panImageUrl,
          poiFrontImageUrl,
          poiBackImageUrl,
          poaFrontImageUrl,
          poaBackImageUrl,
          applicantSignatureUrl,
          personalPhotoUrl,
          nomineePanImageUrl,
          nomineePoiFrontImageUrl,
          nomineePoiBackImageUrl,
          nomineePoaFrontImageUrl,
          nomineePoaBackImageUrl,
          nomineeSignatureUrl,
          nomineePersonalPhotoUrl,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target;

        let field = Array.isArray(target) ? target[0] : target;

        if (typeof target === 'string') {
          // Extract field name from index: Customer_panNumber_key
          field = target.replace(/^Customer_/, '').replace(/_key$/, '');
        }

        const messages: Record<string, string> = {
          panNumber: 'PAN Number already exists in the database',
          poaDocumentNumber: 'POA Document Number already exists in the database',
          poiDocumentNumber: 'POI Document Number already exists in the database',
          mobileNumber: 'Mobile number already exists',
          email: 'Email already exists',
          memberId: 'Member ID already exists',
        };

        throw new BadRequestException(
          messages[field] || 'Duplicate field value detected'
        );
      }

      throw error;
    }
  }

  private getRoleFilter(user: any) {
    if (!user) return {};
    if (user.role === 'AGENT') return { agentId: user.id };
    if (user.role === 'MANAGER') return { managerId: user.id };
    return {};
  }

  async getCustomerCount(user?: any) {
    return this.prisma.customer.count({
      where: this.getRoleFilter(user)
    });
  }

  async findAll(user: { id: string; role: string }) {
    return this.prisma.customer.findMany({
      where: this.getRoleFilter(user),
      select: {
        id: true,
        applicantName: true,
        memberId: true,
        mobileNumber: true,
        email: true,
        accountStatus: true,
        managerId: true,
        agentId: true
      },
    });
  }

  async getCustomerById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async checkDuplicate(field: string, value: string, excludeId?: string) {
    if (!field || !value) {
      return { exists: false };
    }

    const trimmed = value.trim();
    if (!trimmed) return { exists: false };

    const notSelf = excludeId ? { NOT: { id: excludeId } } : {};

    const documentNumberFields = new Set([
      'poiDocumentNumber',
      'poaDocumentNumber',
      'nomineePoiDocumentNumber',
      'nomineePoaDocumentNumber',
    ]);

    if (documentNumberFields.has(field)) {
      const match = await this.prisma.customer.findFirst({
        where: {
          ...notSelf,
          OR: [
            { poiDocumentNumber: trimmed },
            { poaDocumentNumber: trimmed },
            { nomineePoiDocumentNumber: trimmed },
            { nomineePoaDocumentNumber: trimmed },
          ],
        },
        select: {
          id: true,
          applicantName: true,
          memberId: true,
          poiDocumentNumber: true,
          poaDocumentNumber: true,
          poiDocumentType: true,
          poaDocumentType: true,
          nomineePoiDocumentNumber: true,
          nomineePoaDocumentNumber: true,
          nomineePoiDocumentType: true,
          nomineePoaDocumentType: true,
        },
      });

      if (!match) return { exists: false };

      let conflictField = '';
      let conflictDocType = '';
      if (match.poiDocumentNumber === trimmed) {
        conflictField = 'poiDocumentNumber';
        conflictDocType = match.poiDocumentType;
      } else if (match.poaDocumentNumber === trimmed) {
        conflictField = 'poaDocumentNumber';
        conflictDocType = match.poaDocumentType;
      } else if (match.nomineePoiDocumentNumber === trimmed) {
        conflictField = 'nomineePoiDocumentNumber';
        conflictDocType = match.nomineePoiDocumentType;
      } else if (match.nomineePoaDocumentNumber === trimmed) {
        conflictField = 'nomineePoaDocumentNumber';
        conflictDocType = match.nomineePoaDocumentType;
      }

      return {
        exists: true,
        conflictField,
        conflictDocType,
        applicantName: match.applicantName,
        memberId: match.memberId,
      };
    }

    const allowedScalar = new Set([
      'panNumber',
      'mobileNumber',
      'email',
      'memberId',
      'nomineePanNumber',
    ]);

    if (!allowedScalar.has(field)) {
      throw new BadRequestException('Field not supported for duplicate check');
    }

    const match = await this.prisma.customer.findFirst({
      where: { ...notSelf, [field]: trimmed } as any,
      select: { id: true, applicantName: true, memberId: true },
    });

    return match
      ? { exists: true, conflictField: field, applicantName: match.applicantName, memberId: match.memberId }
      : { exists: false };
  }

  async deleteExtraDocument(customerId: string, docId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const remaining = (customer.extraDocuments || []).filter((d) => d.id !== docId);
    if (remaining.length === (customer.extraDocuments || []).length) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { extraDocuments: remaining },
    });

    return { message: 'Document deleted successfully' };
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto, files: any, currentUser?: any) {
    try {
      const existingCustomer = await this.prisma.customer.findUnique({ where: { id } });

      if (!existingCustomer) {
        throw new NotFoundException('Customer not found');
      }

      const { memberId, managerId, agentId, ...updatableData } = dto || {};

      if (currentUser?.role === 'ADMIN') {
        if (managerId) (updatableData as any).managerId = managerId;
        if (agentId) (updatableData as any).agentId = agentId;
      }

      // const overwriteIfExists = async (field: string, fileName: string) => {
      //   if (!files?.[field]?.[0]) return;

      //   const file = files[field][0];

      //   await uploadToStorage(
      //     file.buffer,
      //     `customers/${existingCustomer.applicantName}-${existingCustomer.mobileNumber}/${fileName}${extname(file.originalname)}`,
      //     file.mimetype
      //   );
      // };
      const overwriteIfExists = async (field: string, fileName: string) => {
        if (!files?.[field]?.[0]) return;

        const file = files[field][0];

        const key = `customers/${existingCustomer.applicantName}-${existingCustomer.mobileNumber}/${fileName}`;

        await uploadToStorage(
          file.buffer,
          key,
          file.mimetype
        );
      };

      await overwriteIfExists('panImage', 'pan');
      await overwriteIfExists('poiFrontImage', 'poiFrontImage');
      await overwriteIfExists('poiBackImage', 'poiBackImage');
      await overwriteIfExists('poaFrontImage', 'poaFrontImage');
      await overwriteIfExists('poaBackImage', 'poaBackImage');
      await overwriteIfExists('applicantSignature', 'signature');
      await overwriteIfExists('personalPhoto', 'photo');

      await overwriteIfExists('nomineePanImage', 'nomineePan');
      await overwriteIfExists('nomineePoiFrontImage', 'nomineePoiFront');
      await overwriteIfExists('nomineePoiBackImage', 'nomineePoiBack');
      await overwriteIfExists('nomineePoaFrontImage', 'nomineePoaFront');
      await overwriteIfExists('nomineePoaBackImage', 'nomineePoaBack');
      await overwriteIfExists('nomineeSignature', 'nomineeSignature');
      await overwriteIfExists('nomineePersonalPhoto', 'nomineePhoto');


      // if (panImageUrl) updatableData.panImageUrl = panImageUrl;
      // if (poiFrontImageUrl) updatableData.poiFrontImageUrl = poiFrontImageUrl;
      // if (poiBackImageUrl) updatableData.poiBackImageUrl = poiBackImageUrl;
      // if (poaFrontImageUrl) updatableData.poaFrontImageUrl = poaFrontImageUrl;
      // if (poaBackImageUrl) updatableData.poaBackImageUrl = poaBackImageUrl;
      // if (applicantSignatureUrl) updatableData.applicantSignatureUrl = applicantSignatureUrl;
      // if (personalPhotoUrl) updatableData.personalPhotoUrl = personalPhotoUrl;

      // if (nomineePanImageUrl) updatableData.nomineePanImageUrl = nomineePanImageUrl;
      // if (nomineePoiFrontImageUrl) updatableData.nomineePoiFrontImageUrl = nomineePoiFrontImageUrl;
      // if (nomineePoiBackImageUrl) updatableData.nomineePoiBackImageUrl = nomineePoiBackImageUrl;
      // if (nomineePoaFrontImageUrl) updatableData.nomineePoaFrontImageUrl = nomineePoaFrontImageUrl;
      // if (nomineePoaBackImageUrl) updatableData.nomineePoaBackImageUrl = nomineePoaBackImageUrl;
      // if (nomineeSignatureUrl) updatableData.nomineeSignatureUrl = nomineeSignatureUrl;
      // if (nomineePersonalPhotoUrl) updatableData.nomineePersonalPhotoUrl = nomineePersonalPhotoUrl;


      // Handle password hashing if password is being updated
      if (updatableData.password) {
        updatableData.password = await bcrypt.hash(updatableData.password, 10);
      }

      // // Convert dateOfBirth to Date if provided
      // if (updatableData.dateOfBirth) {
      //   updatableData.dateOfBirth = new Date(updatableData.dateOfBirth);
      // }

      await this.prisma.customer.update({
        where: { id },
        data: updatableData,
      });
      return { message: 'Customer updated successfully' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target;

        let field = Array.isArray(target) ? target[0] : target;

        if (typeof target === 'string') {
          // Extract field name from index: Customer_panNumber_key
          field = target.replace(/^Customer_/, '').replace(/_key$/, '');
        }

        const messages: Record<string, string> = {
          panNumber: 'PAN Number already exists in the database',
          poaDocumentNumber: 'POA Document Number already exists in the database',
          poiDocumentNumber: 'POI Document Number already exists in the database',
          mobileNumber: 'Mobile number already exists',
          email: 'Email already exists',
          memberId: 'Member ID already exists',
        };

        throw new BadRequestException(
          messages[field] || 'Duplicate field value detected'
        );
      }

      throw error;
    }


  }

  async deleteCustomer(id: string) {
    try {
      const existingCustomer = await this.prisma.customer.findUnique({ where: { id } });

      if (!existingCustomer) {
        throw new NotFoundException('Customer not found');
      }

      await this.prisma.customer.delete({ where: { id } });
      return { message: 'Customer deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

async uploadExtraDocuments(
  customerId: string,
  dto: UploadExtraDocumentsDto,
  files: any,
) {

  const customer = await this.prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new NotFoundException('Customer not found');
  }

  if (!files?.documents?.length) {
    throw new BadRequestException('No documents uploaded');
  }

  const existingDocs = customer.extraDocuments || [];

  if (existingDocs.length + files.documents.length > 20) {
    throw new BadRequestException('Maximum 20 documents allowed');
  }

  const newDocs: any[] = [];

  for (let i = 0; i < files.documents.length; i++) {

    const file = files.documents[i];
    const name = dto.documentNames[i];

    const key = `customers/${customerId}/extra/${name}`;

    const url = await uploadToStorage(
      file.buffer,
      key,
      file.mimetype
    );

    newDocs.push({
      id: Date.now().toString() + Math.random(),
      name,
      url,
      uploadedAt: new Date(),
    });
  }

  await this.prisma.customer.update({
    where: { id: customerId },
    data: {
      extraDocuments: [...existingDocs, ...newDocs],
    },
  });

  return { message: 'Documents uploaded successfully' };
}

  async uploadSingleDocument(file: any, applicantName: string, mobileNumber: string, documentType: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const key = `customers/${applicantName}-${mobileNumber}/${documentType}${extname(file.originalname)}`;
    const url = await uploadToStorage(file.buffer, key, file.mimetype);
    return { url, fieldName: documentType };
  }

}