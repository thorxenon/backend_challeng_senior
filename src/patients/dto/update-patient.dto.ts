import { IsDateString, IsOptional, IsString } from "class-validator";

export class UpdatePatientDto {
	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsDateString()
	birth_date?: string;
}
