import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreatePatientDto {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	user_id?: string;

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
