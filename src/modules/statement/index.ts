/**
 * Statement module: public, client-safe API. The project statement:
 * scope, changes, payments and totals on one printable page.
 */
export {
  buildStatement,
  type Statement,
  type StatementInput,
} from "./domain/statement";
export { StatementDocument } from "./ui/statement-document";
