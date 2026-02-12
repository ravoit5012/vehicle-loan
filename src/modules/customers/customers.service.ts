import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
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
      const panImageUrl = await uploadToStorage(
        files.panImage[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/pan${extname(files.panImage[0].originalname)}`,
        files.panImage[0].mimetype
      );
      const poiFrontImageUrl = await uploadToStorage(
        files.poiFrontImage[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/poiFrontImage${extname(files.poiFrontImage[0].originalname)}`,
        files.poiFrontImage[0].mimetype
      );
      const poiBackImageUrl = await uploadToStorage(
        files.poiBackImage[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/poiBackImage${extname(files.poiBackImage[0].originalname)}`,
        files.poiBackImage[0].mimetype
      );
      const poaFrontImageUrl = await uploadToStorage(
        files.poaFrontImage[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/poaFrontImage${extname(files.poaFrontImage[0].originalname)}`,
        files.poaFrontImage[0].mimetype
      );
      const poaBackImageUrl = await uploadToStorage(
        files.poaBackImage[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/poaBackImage${extname(files.poaBackImage[0].originalname)}`,
        files.poaBackImage[0].mimetype
      );
      const applicantSignatureUrl = await uploadToStorage(
        files.applicantSignature[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/signature${extname(files.applicantSignature[0].originalname)}`,
        files.applicantSignature[0].mimetype
      );
      const personalPhotoUrl = await uploadToStorage(
        files.personalPhoto[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/photo${extname(files.personalPhoto[0].originalname)}`,
        files.personalPhoto[0].mimetype
      );
      const nomineePanImageUrl = await uploadToStorage(
        files.nomineePanImage[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/nomineePan${extname(files.nomineePanImage[0].originalname)}`,
        files.nomineePanImage[0].mimetype
      );
      const nomineePoiFrontImageUrl = await uploadToStorage(
        files.nomineePoiFrontImage[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/nomineePoiFront${extname(files.nomineePoiFrontImage[0].originalname)}`,
        files.nomineePoiFrontImage[0].mimetype
      );
      const nomineePoiBackImageUrl = await uploadToStorage(
        files.nomineePoiBackImage[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/nomineePoiBack${extname(files.nomineePoiBackImage[0].originalname)}`,
        files.nomineePoiBackImage[0].mimetype
      );
      const nomineePoaFrontImageUrl = await uploadToStorage(
        files.nomineePoaFrontImage[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/nomineePoaFront${extname(files.nomineePoaFrontImage[0].originalname)}`,
        files.nomineePoaFrontImage[0].mimetype
      );
      const nomineePoaBackImageUrl = await uploadToStorage(
        files.nomineePoaBackImage[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/nomineePoaBack${extname(files.nomineePoaBackImage[0].originalname)}`,
        files.nomineePoaBackImage[0].mimetype
      );
      const nomineeSignatureUrl = await uploadToStorage(
        files.nomineeSignature[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/nomineeSignature${extname(files.nomineeSignature[0].originalname)}`,
        files.nomineeSignature[0].mimetype
      );
      const nomineePersonalPhotoUrl = await uploadToStorage(
        files.nomineePersonalPhoto[0].buffer,
        `customers/${dto.applicantName}-${dto.mobileNumber}/nomineePhoto${extname(files.nomineePersonalPhoto[0].originalname)}`,
        files.nomineePersonalPhoto[0].mimetype
      );
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

  async getCustomerCount() {
    return this.prisma.customer.count();
  }

  async findAll(user: { id: string; role: string }) {
    const whereCondition: any = {};

    if (user.role === 'MANAGER') {
      whereCondition.managerId = user.id;
    }

    if (user.role === 'AGENT') {
      whereCondition.agentId = user.id;
    }

    // ADMIN → no where condition (gets all customers)

    return this.prisma.customer.findMany({
      where: whereCondition,
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

  async updateCustomer(id: string, dto: UpdateCustomerDto, files: any) {
    try {
      const existingCustomer = await this.prisma.customer.findUnique({ where: { id } });

      if (!existingCustomer) {
        throw new NotFoundException('Customer not found');
      }

      const { memberId, managerId, agentId, ...updatableData } = dto || {};


      // Handle files if provided
      if (files) {
        if (files.panImage) updatableData['panImageUrl'] = `/files/${files.panImage[0].filename}`;
        if (files.poiFrontImage) updatableData['poiFrontImageUrl'] = `/files/${files.poiFrontImage[0].filename}`;
        if (files.poiBackImage) updatableData['poiBackImageUrl'] = `/files/${files.poiBackImage[0].filename}`;
        if (files.poaFrontImage) updatableData['poaFrontImageUrl'] = `/files/${files.poaFrontImage[0].filename}`;
        if (files.poaBackImage) updatableData['poaBackImageUrl'] = `/files/${files.poaBackImage[0].filename}`;
        if (files.applicantSignature) updatableData['applicantSignatureUrl'] = `/files/${files.applicantSignature[0].filename}`;
        if (files.personalPhoto) updatableData['personalPhotoUrl'] = `/files/${files.personalPhoto[0].filename}`;
      }

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
}