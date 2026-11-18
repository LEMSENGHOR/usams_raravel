// All page navigations go through here so tests can observe them (window.location cannot be replaced in tests).
export const navigate = {
  replace: (target) => window.location.replace(target),
  assign: (target) => window.location.assign(target),
}
