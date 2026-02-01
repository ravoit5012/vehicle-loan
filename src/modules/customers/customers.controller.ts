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
  Param,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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
      ],
      {
        storage: memoryStorage(),
      },
    ),
  )
  async create(
    @UploadedFiles() files: any,
    @Body() dto: CreateCustomerDto,
  ) {
    console.log("Customer Creation Request Recieved");
    return this.service.create(dto, files);
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.AGENT)
  @Get('all')
  getAllCustomers(@Req() req) {
    return this.service.findAll(req.user);
  }


  @Get('count')
  async getCustomerCount() {
    return { count: await this.service.getCustomerCount() };
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
  ) {
    return this.service.updateCustomer(id, dto, files);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('/delete/id/:id')
  async deleteCustomer(@Param('id') id: string) {
    return this.service.deleteCustomer(id);
  }
}
