/**
 * Tipos base del dominio. Sin dependencias de framework (ni Nest, ni Prisma) —
 * esta es la regla dura de la arquitectura hexagonal: el dominio no conoce infraestructura.
 */

export abstract class Entity<Props> {
  protected readonly _id: string;
  protected props: Props;

  protected constructor(id: string, props: Props) {
    this._id = id;
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  equals(other?: Entity<Props>): boolean {
    if (!other) return false;
    return this._id === other._id;
  }
}

export abstract class AggregateRoot<Props> extends Entity<Props> {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = this._domainEvents;
    this._domainEvents = [];
    return events;
  }
}

export interface DomainEvent {
  readonly name: string;
  readonly occurredAt: Date;
  readonly payload: Record<string, unknown>;
}

export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DomainError';
  }
}
