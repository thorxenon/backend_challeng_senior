import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength } from "class-validator";

export class SignUpDto{
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNumber()
    @IsNotEmpty()
    role_id: number;

    @IsNotEmpty()
    @MinLength(8)
    @IsString()
    password: string;
}