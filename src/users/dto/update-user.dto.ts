import { Type } from "class-transformer";
import { IsDateString, IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";

class UpdateDoctorProfileDto {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	specialty?: string;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	crm_number?: string;
}

class UpdatePatientProfileDto {
	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsDateString()
	birth_date?: string;
}

export class UpdateUserDto {
	@IsOptional()
	@IsString()
	@MinLength(3)
	name?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsString()
	@MinLength(8)
	password?: string;

	@IsOptional()
	role_id?: number;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => UpdateDoctorProfileDto)
	doctor?: UpdateDoctorProfileDto;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => UpdatePatientProfileDto)
	patient?: UpdatePatientProfileDto;
}
