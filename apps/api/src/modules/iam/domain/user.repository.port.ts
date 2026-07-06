import { User } from './user.entity';

/**
 * Puerto (interfaz) del repositorio. La capa de aplicación depende de esto,
 * no de Prisma. El adaptador concreto vive en infrastructure/.
 */
export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
