import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
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
    try {
      return this.prisma.customer.create({
        data: {
          ...dto,
          password: hashedPassword,
          dateOfBirth: new Date(dto.dateOfBirth),
          managerId: dto.managerId,
          agentId: dto.agentId,

          // Store local URLs
          panImageUrl: `/files/${files.panImage[0].filename}`,
          poiFrontImageUrl: `/files/${files.poiFrontImage[0].filename}`,
          poiBackImageUrl: `/files/${files.poiBackImage[0].filename}`,
          poaFrontImageUrl: `/files/${files.poaFrontImage[0].filename}`,
          poaBackImageUrl: `/files/${files.poaBackImage[0].filename}`,
          applicantSignatureUrl: `/files/${files.applicantSignature[0].filename}`,
          personalPhotoUrl: `/files/${files.personalPhoto[0].filename}`,
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
        manager: {
          select: {
            name: true,
            id:true,
          },
        },
        agent: {
          select: {
            name: true,
            id:true,
          },
        },
      },
    });
  }

  async getCustomerById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });
    console.log("REQ RECIEVED")
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

      // Convert dateOfBirth to Date if provided
      if (updatableData.dateOfBirth) {
        updatableData.dateOfBirth = new Date(updatableData.dateOfBirth);
      }

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
      console.log("Error deleting customer:", error);
      throw error;
    }
  }
}