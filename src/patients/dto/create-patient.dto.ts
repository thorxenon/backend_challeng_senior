import { IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreatePatientDto {
	@IsString()
	@IsNotEmpty()
	user_id: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsDateString()
	birth_date?: string;
}
