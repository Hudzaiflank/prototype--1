export const ROLE_HOME = Object.freeze({
  SUPER_ADMIN: "/dashboard",
  ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
});

export function getRoleHome(role) {
  return ROLE_HOME[role] ?? "/join";
}
