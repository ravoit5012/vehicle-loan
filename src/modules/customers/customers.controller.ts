import {
  Controller,
  Post,
  Get,
  Body,
  Delete,
  Patch,
  Request as Req,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  Param,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/role-guard';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UploadExtraDocumentsDto } from './dto/create-customer.dto';
import constants from 'constants';

@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) { }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'panImage', maxCount: 1 },
        { name: 'poiFrontImage', maxCount: 1 },
        { name: 'poiBackImage', maxCount: 1 },
        { name: 'poaFrontImage', maxCount: 1 },
        { name: 'poaBackImage', maxCount: 1 },
        { name: 'applicantSignature', maxCount: 1 },
        { name: 'personalPhoto', maxCount: 1 },
        { name: 'nomineePanImage', maxCount: 1 },
        { name: 'nomineePoiFrontImage', maxCount: 1 },
        { name: 'nomineePoiBackImage', maxCount: 1 },
        { name: 'nomineePoaFrontImage', maxCount: 1 },
        { name: 'nomineePoaBackImage', maxCount: 1 },
        { name: 'nomineeSignature', maxCount: 1 },
        { name: 'nomineePersonalPhoto', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
      },
    ),
  )
  async create(@UploadedFiles() files: any,
    @Body() dto: CreateCustomerDto) {
    if (files) {
      console.log('Files received:', Object.keys(files));
      Object.entries(files).forEach(([key, value]) => {
        const fileArray = value as Express.Multer.File[] | undefined;
        if (fileArray && fileArray.length > 0) {
          console.log(`${key}: size=${fileArray[0].size} mimetype=${fileArray[0].mimetype}`);
        } else {
          console.log(`${key}: no file uploaded`);
        }
      });
    } else {
      console.log('No multi-part files received. Processing purely via JSON payload.');
    }


    console.log('DTO:', dto);

    try {
      console.log('Creating customer with DTO and files...');
      const result = await this.service.create(dto, files);
      console.log('Customer created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }



  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.AGENT)
  @Get('all')
  getAllCustomers(@Req() req) {
    return this.service.findAll(req.user);
  }

  @Get('get-all')
  getAllCustomersNoFilter() {
    return this.service.findAllNoFilter();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.AGENT)
  @Get('count')
  async getCustomerCount(@Req() req) {
    return { count: await this.service.getCustomerCount(req.user) };
  }

  @Get('/id/:id')
  async getCustomerById(@Param('id') id: string) {
    return this.service.getCustomerById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.AGENT)
  @Patch('/update/id/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'panImage', maxCount: 1 },
        { name: 'poiFrontImage', maxCount: 1 },
        { name: 'poiBackImage', maxCount: 1 },
        { name: 'poaFrontImage', maxCount: 1 },
        { name: 'poaBackImage', maxCount: 1 },
        { name: 'applicantSignature', maxCount: 1 },
        { name: 'personalPhoto', maxCount: 1 },
        { name: 'nomineePanImage', maxCount: 1 },
        { name: 'nomineePoiFrontImage', maxCount: 1 },
        { name: 'nomineePoiBackImage', maxCount: 1 },
        { name: 'nomineePoaFrontImage', maxCount: 1 },
        { name: 'nomineePoaBackImage', maxCount: 1 },
        { name: 'nomineeSignature', maxCount: 1 },
        { name: 'nomineePersonalPhoto', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + extname(file.originalname));
          },
        }),
      },
    ),
  )
  async updateCustomer(
    @Param('id') id: string,
    @UploadedFiles() files: any,
    @Body() dto: UpdateCustomerDto,
    @Req() req,
  ) {
    return this.service.updateCustomer(id, dto, files, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('/delete/id/:id')
  async deleteCustomer(@Param('id') id: string) {
    return this.service.deleteCustomer(id);
  }

  @Post('/check-duplicate')
  async checkDuplicate(
    @Body() body: { field: string; value: string; excludeId?: string },
  ) {
    return this.service.checkDuplicate(body.field, body.value, body.excludeId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.AGENT)
  @Delete('/:customerId/extra-documents/:docId')
  async deleteExtraDocument(
    @Param('customerId') customerId: string,
    @Param('docId') docId: string,
  ) {
    return this.service.deleteExtraDocument(customerId, docId);
  }

  @Post('/upload-extra/:customerId')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'documents', maxCount: 20 }],
      { storage: memoryStorage() }
    )
  )
  async uploadExtraDocuments(
    @Param('customerId') customerId: string,
    @Body() dto: UploadExtraDocumentsDto,
    @UploadedFiles() files: any,
  ) {
    return this.service.uploadExtraDocuments(customerId, dto, files);
  }
  @Post('/upload-single-document')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadSingleDocument(
    @UploadedFile() file: any,
    @Body() body: { applicantName: string; mobileNumber: string; documentType: string }
  ) {
    if (!file) throw new Error('File not provided');
    if (!body.applicantName || !body.mobileNumber || !body.documentType) {
      throw new Error('applicantName, mobileNumber, and documentType are required');
    }
    return this.service.uploadSingleDocument(file, body.applicantName, body.mobileNumber, body.documentType);
  }

}
