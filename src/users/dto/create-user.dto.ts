import { Type } from "class-transformer";
import { IsDateString, IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";

export class CreateDoctorProfileDto {
	@IsString()
	@IsNotEmpty()
	specialty: string;

	@IsString()
	@IsNotEmpty()
	crm_number: string;
}

export class CreatePatientProfileDto {
	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsDateString()
	birth_date?: string;
}

export class CreateUserDto {
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	name: string;

	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	password: string;

	@IsNotEmpty()
	role_id: number;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => CreateDoctorProfileDto)
	doctor?: CreateDoctorProfileDto;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => CreatePatientProfileDto)
	patient?: CreatePatientProfileDto;
}
