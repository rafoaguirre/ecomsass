/**
 * Base interface for all domain events.
 */
export interface DomainEvent {
  readonly occurredAt: Date;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly version?: number;
}

/**
 * Base class for domain events with common functionality.
 */
export abstract class BaseDomainEvent implements DomainEvent {
  readonly occurredAt: Date;

  constructor(
    public readonly eventType: string,
    public readonly aggregateId: string,
    public readonly version?: number
  ) {
    this.occurredAt = new Date();
  }
}
