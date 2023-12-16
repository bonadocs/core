import { ValidationResult } from '../collection'

export class BonadocsError extends Error {
  constructor(private validationResult?: ValidationResult) {
    super(validationResult?.toString())
  }

  get validation(): ValidationResult | undefined {
    return this.validationResult
  }
}
