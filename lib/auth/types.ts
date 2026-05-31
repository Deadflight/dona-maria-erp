export type Role = "admin" | "seller" | "viewer"

export type UserWithProfile = {
  id: string
  email: string
  role: Role
  fullName: string | null
  isActive: boolean
}

export type AuthResult =
  | { success: true; data: UserWithProfile }
  | { success: false; error: string }

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
  fullName: string
  role: Role
}
