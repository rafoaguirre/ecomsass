import type { DomainEvent } from './DomainEvent';

/**
 * Base class for all domain entities.
 *
 * Entities are identified by a unique ID and hold domain state in
 * a protected `props` bag. Property access is exposed via getters
 * in the concrete subclass.
 */
export abstract class Entity<T extends { id: string }> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  /**
   * Two entities are equal if they share the same ID.
   */
  equals(entity?: Entity<T>): boolean {
    if (!entity) {
      return false;
    }
    if (this === entity) {
      return true;
    }
    return this.id === entity.id;
  }

  /**
   * Serialize the entity to a plain data object.
   */
  abstract toData(): T;
}

/**
 * Base class for aggregate roots.
 *
 * Aggregate roots are entities that serve as consistency boundaries
 * and can collect domain events for later dispatch.
 */
export abstract class AggregateRoot<T extends { id: string }> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
