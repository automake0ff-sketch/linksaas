import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from './entity';

/**
 * Punto único de comunicación entre módulos. Un módulo NUNCA importa el
 * domain/ de otro módulo directamente — publica y escucha eventos aquí.
 * Esto es lo que permite extraer un módulo (ej. analytics, workflows) como
 * servicio independiente más adelante sin tocar el resto del sistema.
 */
@Injectable()
export class DomainEventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  publish(event: DomainEvent): void {
    this.emitter.emit(event.name, event);
  }

  publishAll(events: DomainEvent[]): void {
    events.forEach((e) => this.publish(e));
  }
}
