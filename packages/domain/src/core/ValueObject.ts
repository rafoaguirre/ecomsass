/**
 * Base class for value objects.
 *
 * Value objects are immutable and defined entirely by their attributes
 * (structural equality), not by identity.
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * Value objects are equal if all their properties are equal.
   */
  equals(vo?: ValueObject<T>): boolean {
    if (!vo) {
      return false;
    }
    if (this === vo) {
      return true;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }

  /**
   * Get the raw value(s) of this value object.
   */
  abstract value(): unknown;
}
