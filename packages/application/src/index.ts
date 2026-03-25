/**
 * @ecomsaas/application
 * Application layer: use cases and repository interfaces (ports)
 *
 * This is the application orchestration layer in Clean Architecture.
 * It depends only on the domain layer and defines ports (interfaces) for
 * infrastructure dependencies.
 */

export * from './ports';
export * from './use-cases';
