import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class SignUpDto{
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @MinLength(8)
    @IsString()
    password: string;
}