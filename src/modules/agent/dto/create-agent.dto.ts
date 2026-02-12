import { IsString, IsOptional, IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { AccountStatus } from '@prisma/client';
export class CreateAgentDto {
    @IsString()
    @IsNotEmpty()
    agentCode: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    pincode: string;
    
    @IsString()
    @IsOptional()
    status: AccountStatus;

    @IsString()
    @IsNotEmpty()
    managerId: string;
}
