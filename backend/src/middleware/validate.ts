import type { NextFunction, Request, Response } from 'express'
import type { ZodTypeAny, infer as ZodInfer } from 'zod'

type Source = 'body' | 'query' | 'params'

/**
 * Validate a request part against a Zod schema. On success, replaces the raw part
 * with the parsed (typed, defaulted) value. On failure, forwards a ZodError to the
 * global error handler (mapped to 400).
 */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])
    if (!result.success) return next(result.error)
    // Replace the raw request part with the parsed (typed, defaulted) value.
    Object.assign(req, { [source]: result.data })
    next()
  }
}

export type Infer<T extends ZodTypeAny> = ZodInfer<T>
