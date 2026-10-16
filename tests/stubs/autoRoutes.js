// Test stand-in for unplugin-vue-router's virtual `vue-router/auto-routes`
const Page = { template: '<div class="page" />' }

export const routes = [
  { path: '/', name: '/', component: Page },
  { path: '/Login', name: '/Login', component: Page },
  { path: '/Classes', name: '/Classes', component: { template: '<div class="classesPage" />' } },
  { path: '/Class/:id', name: '/Class/[id]', component: Page },
  { path: '/SchoolAdminBilling', name: '/SchoolAdminBilling', component: Page },
  { path: '/GetStarted', name: '/GetStarted', component: Page },
  { path: '/:path(.*)', name: '/[...path]', component: { template: '<div class="notFound" />' } },
]
