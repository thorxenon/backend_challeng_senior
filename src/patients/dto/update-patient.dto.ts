import { IsDateString, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class UpdatePatientDto {
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
	@IsString()
	phone?: string;

	@IsOptional()
	@IsDateString()
	birth_date?: string;
}
