export const IdentityErrors = {
  UserNotFoundId: 'Identity.UserNotFound.Id',
  UserAlreadyExists: 'Identity.UserAlreadyExists',
  EmailAlreadyExists: 'Identity.EmailAlreadyExists',
  UsernameAlreadyExists: 'Identity.UsernameAlreadyExists',
  InvalidEmail: 'Identity.InvalidEmail',
  WeakPassword: 'Identity.WeakPassword',
  UserLockedOut: 'Identity.UserLockedOut',
  RoleNotFound: 'Identity.RoleNotFound',
  MissingToken: 'Identity.MissingToken',
  ExpiredToken: 'Identity.ExpiredToken',
  InvalidToken: 'Identity.InvalidToken',
  ForbiddenAccess: 'Identity.ForbiddenAccess',
} as const;
