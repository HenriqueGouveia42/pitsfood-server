import bcrypt from "bcryptjs";
import { User, UserRole } from "./modules/user/entities/user.js"
import { PrismaUserRepository } from "./modules/user/repositories/implementations/prisma/user.repository.prisma.js"

const plain_text_password = "And785$"

const hashed_password: string = await bcrypt.hash(plain_text_password, 8)

const user: User = User.buildUser(
    "Anderson",
    hashed_password,
    UserRole.VENDEDOR
)

const userRep: PrismaUserRepository = new PrismaUserRepository();

await userRep.saveUser(user);