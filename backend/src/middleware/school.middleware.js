export function requireSchoolScope(request, _response, next) {
  request.schoolId = request.user?.schoolId ?? null;
  next();
}
